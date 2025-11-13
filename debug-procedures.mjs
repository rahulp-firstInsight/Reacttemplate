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

async function debugStoredProcedures() {
  console.log('🔍 Debugging stored procedure parameters...');
  
  try {
    // 1. Check UpdateTemplate procedure parameters
    console.log('\n1. UpdateTemplate procedure parameters:');
    const [updateParams] = await pool.execute(`
      SELECT PARAMETER_NAME, DATA_TYPE, PARAMETER_MODE 
      FROM INFORMATION_SCHEMA.PARAMETERS 
      WHERE SPECIFIC_SCHEMA = ? AND SPECIFIC_NAME = 'UpdateTemplate'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);
    
    updateParams.forEach((param, index) => {
      console.log(`  ${index + 1}. ${param.PARAMETER_NAME}: ${param.DATA_TYPE} (${param.PARAMETER_MODE})`);
    });
    
    // 2. Test direct table access with correct column name
    console.log('\n2. Testing templates table with correct column name...');
    const [directTemplates] = await pool.execute('SELECT template_id, name, description, version, metadata FROM templates LIMIT 3');
    console.log('Direct table query result:');
    directTemplates.forEach((template, index) => {
      console.log(`  Template ${index + 1}:`);
      console.log(`    ID: ${template.template_id}`);
      console.log(`    Name: ${template.name}`);
      console.log(`    Version: ${template.version}`);
      console.log(`    Metadata exists: ${template.metadata ? 'Yes' : 'No'}`);
    });
    
    // 3. Test GetTemplates procedure structure
    console.log('\n3. Testing GetTemplates result structure...');
    const [result] = await pool.execute('CALL GetTemplates()');
    if (result[0] && result[0][0]) {
      console.log('GetTemplates returns these fields:');
      Object.keys(result[0][0]).forEach((key, index) => {
        console.log(`  ${index + 1}. ${key}: ${result[0][0][key]}`);
      });
    }
    
    // 4. Test a simple update to see the procedure signature
    if (directTemplates.length > 0) {
      const testTemplate = directTemplates[0];
      console.log(`\n4. Testing UpdateTemplate with template ID ${testTemplate.template_id}...`);
      
      const testMetadata = JSON.stringify({
        testConfiguration: {
          categories: [{ name: 'Test Category' }]
        },
        testTimestamp: new Date().toISOString()
      });
      
      try {
        const [updateResult] = await pool.execute(
          'CALL UpdateTemplate(?, ?, ?, ?, ?, ?, ?, ?)',
          [
            testTemplate.template_id,  // Use template_id, not id
            testTemplate.name,
            testTemplate.description || '',
            testMetadata,
            parseFloat(testTemplate.version || 1.0) + 0.01,
            1, // updated_by
            'Debug test update',
            1  // is_active
          ]
        );
        
        console.log('✅ UpdateTemplate executed successfully!');
        console.log('Update result:', updateResult);
        
      } catch (updateError) {
        console.error('❌ UpdateTemplate failed:', updateError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await pool.end();
  }
}

debugStoredProcedures();