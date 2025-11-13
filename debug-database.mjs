import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const poolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : {},
  connectionLimit: 10
};

const pool = mysql.createPool(poolConfig);

async function debugDatabase() {
  console.log('🔍 Debugging database structure and stored procedures...');
  
  try {
    // 1. Check what stored procedures exist
    console.log('\n1. Checking available stored procedures...');
    const [procedures] = await pool.execute(`
      SELECT ROUTINE_NAME, ROUTINE_TYPE 
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'
    `, [process.env.DB_NAME]);
    
    console.log('Available stored procedures:');
    if (procedures.length === 0) {
      console.log('  ❌ No stored procedures found!');
    } else {
      procedures.forEach(proc => {
        console.log(`  ✅ ${proc.ROUTINE_NAME}`);
      });
    }
    
    // 2. Check templates table structure
    console.log('\n2. Checking templates table structure...');
    const [tableInfo] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'templates'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);
    
    if (tableInfo.length === 0) {
      console.log('  ❌ Templates table not found!');
    } else {
      console.log('Templates table columns:');
      tableInfo.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (nullable: ${col.IS_NULLABLE})`);
      });
    }
    
    // 3. Check direct table access
    console.log('\n3. Testing direct table access...');
    const [directTemplates] = await pool.execute('SELECT id, name, description, version, metadata FROM templates LIMIT 3');
    console.log('Direct table query result:');
    directTemplates.forEach((template, index) => {
      console.log(`  Template ${index + 1}:`);
      console.log(`    ID: ${template.id}`);
      console.log(`    Name: ${template.name}`);
      console.log(`    Version: ${template.version}`);
      console.log(`    Metadata exists: ${template.metadata ? 'Yes' : 'No'}`);
    });
    
    // 4. Test GetTemplates procedure if it exists
    if (procedures.some(p => p.ROUTINE_NAME === 'GetTemplates')) {
      console.log('\n4. Testing GetTemplates stored procedure...');
      try {
        const [result] = await pool.execute('CALL GetTemplates()');
        console.log('GetTemplates result structure:', {
          numberOfResultSets: result.length,
          firstSetLength: result[0] ? result[0].length : 0,
          sampleRecord: result[0] && result[0][0] ? Object.keys(result[0][0]) : 'No records'
        });
        
        if (result[0] && result[0][0]) {
          console.log('First template from GetTemplates:', result[0][0]);
        }
      } catch (error) {
        console.error('Error calling GetTemplates:', error.message);
      }
    }
    
    // 5. Test UpdateTemplate procedure if it exists
    if (procedures.some(p => p.ROUTINE_NAME === 'UpdateTemplate')) {
      console.log('\n5. UpdateTemplate procedure exists ✅');
    } else {
      console.log('\n5. ❌ UpdateTemplate procedure does NOT exist!');
      console.log('   This is the root cause of the configuration saving problem.');
    }
    
  } catch (error) {
    console.error('❌ Database debugging error:', error);
  } finally {
    await pool.end();
  }
}

debugDatabase();