import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  },
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

async function showLiveDatabase() {
  let connection;
  
  try {
    console.log('🌟 ====================================');
    console.log('📊 LIVE DATABASE VIEWER');
    console.log('🌟 ====================================');
    console.log(`🌐 Connecting to: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`🗄️ Database: ${dbConfig.database}`);
    console.log(`👤 User: ${dbConfig.user}`);
    console.log('');

    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to live database!');
    console.log('');

    // Show all tables
    console.log('📋 DATABASE TABLES:');
    console.log('==================');
    const [tables] = await connection.execute('SHOW TABLES');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${Object.values(table)[0]}`);
    });
    console.log('');

    // Show templates table content
    console.log('🏥 TEMPLATES TABLE:');
    console.log('==================');
    const [templates] = await connection.execute('SELECT * FROM templates');
    
    if (templates.length === 0) {
      console.log('❌ No templates found in database');
    } else {
      templates.forEach((template, index) => {
        console.log(`\n📄 Template ${index + 1}:`);
        console.log(`   ID: ${template.template_id}`);
        console.log(`   Name: ${template.template_name}`);
        console.log(`   Domain: ${template.domain_name}`);
        console.log(`   Description: ${template.description || 'N/A'}`);
        console.log(`   Created: ${template.created_at}`);
        console.log(`   Updated: ${template.updated_at}`);
        
        // Show metadata if exists
        if (template.metadata) {
          console.log(`   📊 Configuration: ${template.metadata.length} characters`);
          try {
            const config = JSON.parse(template.metadata);
            if (config.sections) {
              console.log(`   📝 Sections: ${config.sections.length}`);
              let totalFields = 0;
              config.sections.forEach(section => {
                totalFields += section.fields ? section.fields.length : 0;
                if (section.subsections) {
                  section.subsections.forEach(sub => {
                    totalFields += sub.fields ? sub.fields.length : 0;
                  });
                }
              });
              console.log(`   🔢 Total Fields: ${totalFields}`);
            }
          } catch (e) {
            console.log(`   ⚠️ Metadata parsing error: ${e.message}`);
          }
        }
      });
    }

    console.log('');

    // Show domains table content
    console.log('🏷️ DOMAINS TABLE:');
    console.log('=================');
    const [domains] = await connection.execute('SELECT * FROM domains');
    
    if (domains.length === 0) {
      console.log('❌ No domains found in database');
    } else {
      domains.forEach((domain, index) => {
        console.log(`${index + 1}. ${domain.domain_name} (ID: ${domain.domain_id})`);
      });
    }

    console.log('');

    // Show database stats
    console.log('📊 DATABASE STATISTICS:');
    console.log('======================');
    console.log(`📋 Total Tables: ${tables.length}`);
    console.log(`🏥 Total Templates: ${templates.length}`);
    console.log(`🏷️ Total Domains: ${domains.length}`);
    
    // Show database size
    const [sizeInfo] = await connection.execute(`
      SELECT 
        table_schema as 'Database',
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as 'Size (MB)'
      FROM information_schema.tables 
      WHERE table_schema = ?
      GROUP BY table_schema
    `, [dbConfig.database]);
    
    if (sizeInfo.length > 0) {
      console.log(`💾 Database Size: ${sizeInfo[0]['Size (MB)']} MB`);
    }

    console.log('');
    console.log('🌟 ====================================');
    console.log('✅ Live database content displayed!');
    console.log('🌟 ====================================');

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('🔍 Error details:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the database viewer
showLiveDatabase();