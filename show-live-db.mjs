// Simple script to show live database content using the same connection logic as server
import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Use exact same config as server.js
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306,
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function showDatabase() {
  console.log('🌟 ====================================');
  console.log('📊 LIVE AZURE DATABASE CONTENT');
  console.log('🌟 ====================================');
  
  let pool;
  try {
    // Create connection pool (same as server)
    pool = mysql.createPool(dbConfig);
    
    console.log(`🌐 Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`👤 User: ${dbConfig.user}`);
    console.log(`🗄️ Database: ${dbConfig.database}`);
    console.log('');

    // Test connection
    const connection = await pool.getConnection();
    const [testResult] = await connection.execute('SELECT 1 as test');
    console.log('✅ Connection successful!');
    connection.release();
    console.log('');

    // Show templates with full details
    console.log('🏥 TEMPLATES TABLE:');
    console.log('==================');
    const [templates] = await pool.execute('SELECT * FROM templates ORDER BY template_id');
    
    if (templates.length === 0) {
      console.log('❌ No templates found');
    } else {
      templates.forEach((template, index) => {
        console.log(`\n📄 Template ${index + 1}:`);
        console.log(`   🆔 ID: ${template.template_id}`);
        console.log(`   📝 Name: ${template.template_name}`);
        console.log(`   🏷️ Domain: ${template.domain_name}`);
        console.log(`   📋 Description: ${template.description || 'N/A'}`);
        console.log(`   📅 Created: ${template.created_at}`);
        console.log(`   🔄 Updated: ${template.updated_at}`);
        
        if (template.metadata) {
          console.log(`   📊 Has Configuration: YES (${template.metadata.length} chars)`);
          try {
            const config = JSON.parse(template.metadata);
            if (config.sections) {
              console.log(`   📂 Sections: ${config.sections.length}`);
            }
          } catch (e) {
            console.log(`   ⚠️ Configuration parse error`);
          }
        } else {
          console.log(`   📊 Has Configuration: NO`);
        }
      });
    }

    console.log('\n🏷️ DOMAINS TABLE:');
    console.log('=================');
    const [domains] = await pool.execute('SELECT * FROM domains ORDER BY domain_id');
    
    domains.forEach((domain, index) => {
      console.log(`${index + 1}. 🏷️ ${domain.domain_name} (ID: ${domain.domain_id})`);
    });

    console.log('\n📊 SUMMARY:');
    console.log('===========');
    console.log(`📋 Total Templates: ${templates.length}`);
    console.log(`🏷️ Total Domains: ${domains.length}`);
    
    console.log('\n✅ Live database content displayed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error(`🔍 Error Code: ${error.code}`);
    }
  } finally {
    if (pool) {
      await pool.end();
      console.log('🔌 Connection pool closed');
    }
  }
}

showDatabase();