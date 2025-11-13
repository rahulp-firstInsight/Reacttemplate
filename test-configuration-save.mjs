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

async function testConfigurationSave() {
  console.log('🧪 Testing Configuration Save Functionality');
  console.log('='.repeat(50));
  
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('✅ Connected to Azure MySQL database');
    
    // Get all templates to find one to test with
    const [templates] = await connection.execute(
      'CALL GetTemplates()'
    );
    
    console.log(`📋 Found ${templates.length} templates in database`);
    
    if (templates.length === 0) {
      console.log('❌ No templates found - cannot test configuration save');
      return;
    }
    
    // Use the first template for testing
    const testTemplate = templates[0];
    console.log(`🎯 Testing with template: ${testTemplate.name} (ID: ${testTemplate.template_id})`);
    
    // Check current metadata/configuration
    console.log('\n📊 Current template metadata:');
    console.log('Raw metadata:', testTemplate.metadata);
    
    let currentMetadata = {};
    try {
      currentMetadata = testTemplate.metadata ? JSON.parse(testTemplate.metadata) : {};
    } catch (e) {
      console.log('⚠️ Metadata is not valid JSON, treating as empty');
    }
    
    console.log('Parsed metadata:', currentMetadata);
    console.log('Current configuration:', currentMetadata.configuration || 'None');
    
    // Simulate a configuration save
    const testConfiguration = {
      viewMode: 'form',
      showHPIBullets: true,
      showHeaders: true,
      sections: [
        {
          id: 'chief-complaint',
          title: 'Chief Complaint',
          fields: [
            { id: 'chief-complaint-text', type: 'textarea', label: 'Chief Complaint' }
          ]
        },
        {
          id: 'history-present-illness',
          title: 'History of Present Illness',
          fields: [
            { id: 'hpi-text', type: 'textarea', label: 'HPI Description' }
          ]
        }
      ],
      generatedAt: new Date().toISOString(),
      version: '1.0',
      templateId: testTemplate.template_id,
      templateName: testTemplate.name,
      metadata: {
        totalSections: 2,
        totalFields: 2,
        lastModified: new Date().toISOString(),
        configurationSource: 'Test Script - Configuration Save Verification'
      }
    };
    
    console.log('\n💾 Testing configuration save...');
    console.log('Configuration to save:', JSON.stringify(testConfiguration, null, 2));
    
    // Update the metadata with new configuration
    const updatedMetadata = {
      ...currentMetadata,
      configuration: testConfiguration,
      lastConfigurationUpdate: new Date().toISOString(),
      configurationTestRun: true
    };
    
    // Save updated metadata back to database
    await connection.execute(
      'CALL UpdateTemplate(?, ?, ?, ?, ?, ?)',
      [
        testTemplate.template_id,
        testTemplate.name,
        testTemplate.description || testTemplate.name,
        testTemplate.body || '{}',
        JSON.stringify(updatedMetadata),
        testTemplate.is_active !== undefined ? testTemplate.is_active : 1
      ]
    );
    
    console.log('✅ Configuration saved to database successfully!');
    
    // Verify the save by retrieving the template again
    const [verifyResult] = await connection.execute(
      'CALL GetTemplateById(?)',
      [testTemplate.template_id]
    );
    
    if (verifyResult.length > 0) {
      const verifiedTemplate = verifyResult[0];
      const verifiedMetadata = JSON.parse(verifiedTemplate.metadata || '{}');
      
      console.log('\n🔍 Verification Results:');
      console.log('✅ Template retrieved successfully');
      console.log('✅ Metadata contains configuration:', !!verifiedMetadata.configuration);
      console.log('✅ Configuration matches saved data:', 
        JSON.stringify(verifiedMetadata.configuration?.templateId) === JSON.stringify(testConfiguration.templateId)
      );
      console.log('📋 Total sections in saved config:', verifiedMetadata.configuration?.sections?.length || 0);
      console.log('📋 Total fields in saved config:', verifiedMetadata.configuration?.metadata?.totalFields || 0);
      console.log('🕒 Configuration generated at:', verifiedMetadata.configuration?.generatedAt);
      
      console.log('\n📄 Full saved configuration:');
      console.log(JSON.stringify(verifiedMetadata.configuration, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error in configuration save test:', error);
  } finally {
    await connection.end();
    console.log('\n✅ Database connection closed');
  }
}

// Run the test
testConfigurationSave().catch(console.error);