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

async function checkDatabaseConfiguration() {
  console.log('🔍 Checking configuration in live database...');
  
  try {
    // 1. Check raw metadata in templates table
    console.log('\n1. Checking raw metadata in templates table...');
    const [rawTemplates] = await pool.execute(`
      SELECT template_id, name, metadata, updated_at, updated_purpose 
      FROM templates 
      WHERE template_id IN (1, 2, 3) 
      ORDER BY template_id
    `);
    
    console.log('Raw database records:');
    rawTemplates.forEach(template => {
      console.log(`\n📋 Template ID: ${template.template_id}`);
      console.log(`   Name: ${template.name}`);
      console.log(`   Updated: ${template.updated_at}`);
      console.log(`   Purpose: ${template.updated_purpose}`);
      console.log(`   Metadata exists: ${template.metadata ? 'Yes' : 'No'}`);
      
      if (template.metadata) {
        try {
          const metadata = typeof template.metadata === 'string' 
            ? JSON.parse(template.metadata) 
            : template.metadata;
          
          console.log(`   Configuration exists: ${metadata.configuration ? 'Yes' : 'No'}`);
          
          if (metadata.configuration) {
            console.log(`   Categories: ${metadata.configuration.categories ? metadata.configuration.categories.length : 0}`);
            console.log(`   Config updated: ${metadata.configurationUpdatedAt || 'Not set'}`);
          }
          
          // Show first few lines of metadata
          const metadataStr = JSON.stringify(metadata, null, 2);
          const lines = metadataStr.split('\n').slice(0, 10);
          console.log(`   Metadata preview:\n${lines.join('\n')}...`);
          
        } catch (error) {
          console.log(`   ❌ Metadata parse error: ${error.message}`);
          console.log(`   Raw metadata: ${template.metadata.toString().substring(0, 100)}...`);
        }
      }
    });
    
    // 2. Test GetTemplateById stored procedure
    console.log('\n2. Testing GetTemplateById stored procedure...');
    const [procResult] = await pool.execute('CALL GetTemplateById(?)', [1]);
    const procTemplate = procResult[0][0];
    
    if (procTemplate) {
      console.log(`\n📋 Stored Procedure Result for Template 1:`);
      console.log(`   Name: ${procTemplate.name}`);
      console.log(`   Metadata type: ${typeof procTemplate.metadata}`);
      
      if (procTemplate.metadata) {
        try {
          const metadata = typeof procTemplate.metadata === 'string' 
            ? JSON.parse(procTemplate.metadata) 
            : procTemplate.metadata;
          
          console.log(`   Configuration exists: ${metadata.configuration ? 'Yes' : 'No'}`);
          if (metadata.configuration && metadata.configuration.categories) {
            console.log(`   Categories found: ${metadata.configuration.categories.length}`);
            metadata.configuration.categories.forEach((cat, index) => {
              console.log(`     ${index + 1}. ${cat.name} (${cat.fields ? cat.fields.length : 0} fields)`);
            });
          }
        } catch (error) {
          console.log(`   ❌ Procedure metadata parse error: ${error.message}`);
        }
      }
    }
    
    // 3. Check recent UPDATE operations
    console.log('\n3. Checking recent update history...');
    const [updates] = await pool.execute(`
      SELECT template_id, name, updated_at, updated_purpose, updated_by
      FROM templates 
      WHERE updated_purpose LIKE '%Configuration%' 
      ORDER BY updated_at DESC 
      LIMIT 5
    `);
    
    console.log('Recent configuration updates:');
    updates.forEach(update => {
      console.log(`   ${update.updated_at}: Template ${update.template_id} - ${update.updated_purpose}`);
    });
    
  } catch (error) {
    console.error('❌ Database check error:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseConfiguration();