import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: 'qamysqlserver.mysql.database.azure.com',
  user: 'mysql_admin',
  password: 'Maxim@2024',
  database: 'qa_scribe_test',
  port: 3306,
  ssl: {
    rejectUnauthorized: false
  }
};

async function checkDatabaseMetadata() {
  console.log('🔍 CHECKING DATABASE METADATA DIRECTLY');
  console.log('='.repeat(50));
  
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Query template directly from database to see raw metadata
    const [rows] = await connection.execute(
      'SELECT template_id, name, metadata FROM templates WHERE template_id = 1'
    );
    
    if (rows.length === 0) {
      console.log('❌ No template with ID 1 found');
      return;
    }
    
    const template = rows[0];
    console.log('📋 Raw database record:');
    console.log('- Template ID:', template.template_id);
    console.log('- Name:', template.name);
    console.log('- Metadata (raw):', template.metadata);
    console.log('- Metadata type:', typeof template.metadata);
    console.log('- Metadata length:', template.metadata ? template.metadata.length : 'null');
    
    // Try to parse metadata
    if (template.metadata) {
      try {
        const parsed = JSON.parse(template.metadata);
        console.log('✅ Parsed metadata:', parsed);
        console.log('🔍 Configuration exists in metadata:', !!parsed.configuration);
        if (parsed.configuration) {
          console.log('📄 Configuration details:', JSON.stringify(parsed.configuration, null, 2));
        }
      } catch (error) {
        console.log('❌ Failed to parse metadata:', error.message);
      }
    } else {
      console.log('⚠️ Metadata is null or empty');
    }
    
    // Also test the stored procedure
    console.log('\n🔧 Testing GetTemplateById stored procedure...');
    const [spResult] = await connection.execute('CALL GetTemplateById(?)', [1]);
    const spTemplate = spResult[0][0];
    
    if (spTemplate) {
      console.log('📋 Stored procedure result:');
      console.log('- Template ID:', spTemplate.template_id);
      console.log('- Name:', spTemplate.name);
      console.log('- Metadata (SP):', spTemplate.metadata);
      console.log('- Metadata type (SP):', typeof spTemplate.metadata);
    }
    
  } catch (error) {
    console.error('❌ Database query error:', error);
  } finally {
    await connection.end();
  }
}

checkDatabaseMetadata().catch(console.error);