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

async function showConfigurationLocation() {
  console.log('📍 Showing where configuration is stored in Azure MySQL database...');
  
  try {
    // Show database and table info
    console.log('\n🏥 DATABASE INFORMATION:');
    console.log(`   Server: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   Table: templates`);
    console.log(`   Column: metadata (JSON type)`);
    
    // Show the exact SQL query to view configurations
    console.log('\n📝 SQL QUERY TO VIEW CONFIGURATIONS:');
    console.log(`   SELECT template_id, name, 
          JSON_EXTRACT(metadata, '$.configuration') as configuration,
          JSON_EXTRACT(metadata, '$.configurationUpdatedAt') as config_updated
   FROM templates 
   WHERE JSON_EXTRACT(metadata, '$.configuration') IS NOT NULL;`);
    
    // Execute and show actual data
    console.log('\n🔍 CURRENT CONFIGURATIONS IN DATABASE:');
    const [configs] = await pool.execute(`
      SELECT 
        template_id,
        name,
        JSON_EXTRACT(metadata, '$.configuration') as configuration,
        JSON_EXTRACT(metadata, '$.configurationUpdatedAt') as config_updated,
        updated_at
      FROM templates 
      WHERE JSON_EXTRACT(metadata, '$.configuration') IS NOT NULL
      ORDER BY template_id
    `);
    
    configs.forEach(config => {
      console.log(`\n📋 Template ID: ${config.template_id}`);
      console.log(`   Name: ${config.name}`);
      console.log(`   Config Updated: ${config.config_updated}`);
      console.log(`   Last DB Update: ${config.updated_at}`);
      
      if (config.configuration) {
        try {
          const configObj = JSON.parse(config.configuration);
          console.log(`   Configuration Preview:`);
          console.log(`     - Version: ${configObj.version || 'Not set'}`);
          console.log(`     - View Mode: ${configObj.viewMode || 'Not set'}`);
          console.log(`     - Show Headers: ${configObj.showHeaders || 'Not set'}`);
          console.log(`     - Sections: ${configObj.sections ? configObj.sections.length : 0}`);
          
          if (configObj.sections && configObj.sections.length > 0) {
            configObj.sections.forEach((section, index) => {
              console.log(`       ${index + 1}. ${section.name} (${section.fields ? section.fields.length : 0} fields)`);
            });
          }
          
          if (configObj.categories && configObj.categories.length > 0) {
            console.log(`     - Categories: ${configObj.categories.length}`);
            configObj.categories.forEach((category, index) => {
              console.log(`       ${index + 1}. ${category.name} (${category.fields ? category.fields.length : 0} fields)`);
            });
          }
        } catch (error) {
          console.log(`   ❌ Configuration parse error: ${error.message}`);
        }
      }
    });
    
    // Show how to access via MySQL Workbench or other tools
    console.log('\n🛠️  HOW TO VIEW IN MYSQL WORKBENCH:');
    console.log('   1. Connect to: qamysqlserver.mysql.database.azure.com:3306');
    console.log('   2. Database: qa_scribe_test');  
    console.log('   3. Username: mysql_admin');
    console.log('   4. Run this query:');
    console.log('      SELECT template_id, name, metadata FROM templates WHERE template_id = 1;');
    console.log('   5. Look at the "metadata" column - it contains the JSON configuration');
    
    // Show raw metadata for template 1
    console.log('\n📄 RAW METADATA FOR TEMPLATE 1:');
    const [rawData] = await pool.execute(`
      SELECT template_id, name, metadata 
      FROM templates 
      WHERE template_id = 1
    `);
    
    if (rawData.length > 0) {
      const template = rawData[0];
      console.log(`Template: ${template.name}`);
      console.log(`Raw JSON metadata:`);
      
      const metadataStr = JSON.stringify(template.metadata, null, 2);
      // Show first 20 lines
      const lines = metadataStr.split('\n').slice(0, 20);
      console.log(lines.join('\n'));
      
      if (metadataStr.split('\n').length > 20) {
        console.log('... (truncated, full JSON is longer)');
      }
    }
    
  } catch (error) {
    console.error('❌ Error accessing database:', error);
  } finally {
    await pool.end();
  }
}

showConfigurationLocation();