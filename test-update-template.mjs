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
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

const pool = mysql.createPool(poolConfig);

async function testUpdateTemplate() {
  console.log('🔍 Testing UpdateTemplate stored procedure...');
  
  try {
    // First, get a template to test with
    console.log('\n1. Getting first template...');
    const [templates] = await pool.execute('CALL GetTemplates()');
    const templateList = templates[0];
    
    if (templateList.length === 0) {
      console.log('❌ No templates found to test with');
      return;
    }
    
    const template = templateList[0];
    console.log(`✅ Found template: ID ${template.id}, Name: "${template.name}"`);
    
    // Test configuration object
    const testConfiguration = {
      categories: [
        {
          id: 'test-category-1',
          name: 'Test Category 1',
          fields: [
            {
              name: 'test-field-1',
              dataType: 'text',
              required: true
            }
          ]
        }
      ],
      settings: {
        viewMode: 'paragraph',
        showHeaders: true
      }
    };
    
    // Prepare metadata with configuration
    let originalMetadata = {};
    if (template.metadata) {
      try {
        originalMetadata = typeof template.metadata === 'string' ? JSON.parse(template.metadata) : template.metadata;
      } catch (e) {
        console.log('Warning: Could not parse existing metadata, using empty object');
        originalMetadata = {};
      }
    }
    
    const metadata = {
      configuration: testConfiguration,
      configurationUpdatedAt: new Date().toISOString(),
      originalMetadata: originalMetadata
    };
    
    const metadataJson = JSON.stringify(metadata);
    
    console.log('\n2. Testing UpdateTemplate procedure...');
    console.log('Configuration to save:', JSON.stringify(testConfiguration, null, 2));
    
    // Test the UpdateTemplate call
    const updateCall = `CALL UpdateTemplate(${template.id}, '${template.name}', '${template.description || ''}', '${metadataJson}', ${parseFloat(template.version || 1.0) + 0.1}, 1, 'Configuration test', 1)`;
    console.log(`🔵 EXECUTING: ${updateCall}`);
    
    const [result] = await pool.execute(
      'CALL UpdateTemplate(?, ?, ?, ?, ?, ?, ?, ?)',
      [
        template.id,
        template.name,
        template.description || '',
        metadataJson,
        parseFloat(template.version || 1.0) + 0.1,
        1, // updated_by
        'Configuration test', // updated_purpose
        1  // is_active
      ]
    );
    
    console.log('✅ UpdateTemplate executed successfully!');
    console.log('Result:', result);
    
    // Verify the update by getting the template again
    console.log('\n3. Verifying configuration was saved...');
    const [verifyResult] = await pool.execute('CALL GetTemplateById(?)', [template.id]);
    const updatedTemplate = verifyResult[0][0];
    
    if (updatedTemplate && updatedTemplate.metadata) {
      const savedMetadata = JSON.parse(updatedTemplate.metadata);
      console.log('✅ Configuration saved successfully!');
      console.log('Saved configuration:', JSON.stringify(savedMetadata.configuration, null, 2));
    } else {
      console.log('❌ Configuration not found in updated template');
    }
    
  } catch (error) {
    console.error('❌ Error testing UpdateTemplate:', error);
    
    // Check if the error is about missing stored procedure
    if (error.code === 'ER_SP_DOES_NOT_EXIST') {
      console.log('\n💡 The UpdateTemplate stored procedure does not exist!');
      console.log('This explains why configuration saving is failing.');
      
      // Show available procedures
      try {
        console.log('\n🔍 Checking available stored procedures...');
        const [procedures] = await pool.execute(`
          SELECT ROUTINE_NAME, ROUTINE_TYPE 
          FROM INFORMATION_SCHEMA.ROUTINES 
          WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'
        `, [process.env.DB_NAME]);
        
        console.log('Available stored procedures:');
        procedures.forEach(proc => {
          console.log(`  - ${proc.ROUTINE_NAME}`);
        });
        
        if (procedures.length === 0) {
          console.log('  (No stored procedures found)');
        }
        
      } catch (procError) {
        console.error('Error checking procedures:', procError);
      }
    }
  } finally {
    await pool.end();
  }
}

testUpdateTemplate();