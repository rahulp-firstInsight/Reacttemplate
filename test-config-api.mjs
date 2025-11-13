// Simple test to verify configuration save endpoint
const testConfigurationAPI = async () => {
  console.log('🧪 Testing Configuration Save API Endpoint');
  console.log('='.repeat(50));
  
  try {
    // Test configuration data
    const testConfig = {
      configuration: {
        viewMode: 'form',
        showHPIBullets: true,
        showHeaders: true,
        sections: [
          {
            id: 'test-section',
            title: 'Test Section',
            fields: [
              { id: 'test-field', type: 'text', label: 'Test Field' }
            ]
          }
        ],
        generatedAt: new Date().toISOString(),
        version: '1.0',
        templateId: '1',
        templateName: 'Test Configuration Save',
        metadata: {
          totalSections: 1,
          totalFields: 1,
          lastModified: new Date().toISOString(),
          configurationSource: 'API Test Script'
        }
      }
    };
    
    console.log('📤 Sending configuration to endpoint...');
    console.log('URL: http://localhost:8080/api/templates/1/configuration');
    console.log('Method: PUT');
    console.log('Data:', JSON.stringify(testConfig, null, 2));
    
    const response = await fetch('http://localhost:8080/api/templates/1/configuration', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testConfig)
    });
    
    console.log(`📥 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Configuration saved successfully!');
    console.log('📋 Server response:', result);
    
    // Now verify by fetching the template
    console.log('\n🔍 Verifying configuration was saved...');
    const verifyResponse = await fetch('http://localhost:8080/api/templates/1');
    const template = await verifyResponse.json();
    
    console.log('📋 Template metadata:', template.metadata);
    
    if (template.metadata && template.metadata.configuration) {
      console.log('✅ Configuration found in template metadata!');
      console.log('📄 Saved configuration:');
      console.log(JSON.stringify(template.metadata.configuration, null, 2));
    } else {
      console.log('❌ Configuration not found in template metadata');
    }
    
  } catch (error) {
    console.error('❌ Error testing configuration API:', error);
  }
};

testConfigurationAPI();