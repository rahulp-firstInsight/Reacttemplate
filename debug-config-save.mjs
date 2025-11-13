// Debug configuration save issues
console.log('🔧 DEBUG: Configuration Save Issue Analysis');
console.log('='.repeat(50));

// Test 1: Check if server is responding
async function testServerHealth() {
  try {
    console.log('📡 Testing server connectivity...');
    const response = await fetch('http://localhost:8080/api/health');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server is healthy:', data);
    } else {
      console.log('❌ Server health check failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Server connection failed:', error.message);
  }
}

// Test 2: Check template existence
async function testTemplateExists() {
  try {
    console.log('📋 Checking if template ID 1 exists...');
    const response = await fetch('http://localhost:8080/api/templates/1');
    if (response.ok) {
      const template = await response.json();
      console.log('✅ Template found:', template.name);
      console.log('📊 Template metadata exists:', !!template.metadata);
      if (template.metadata) {
        console.log('🔍 Metadata content:', template.metadata);
      }
    } else {
      console.log('❌ Template not found:', response.status);
    }
  } catch (error) {
    console.log('❌ Error fetching template:', error.message);
  }
}

// Test 3: Test configuration save with detailed logging
async function testConfigurationSave() {
  try {
    console.log('💾 Testing configuration save...');
    
    const testConfig = {
      configuration: {
        viewMode: 'form',
        showHPIBullets: true,
        showHeaders: true,
        sections: [
          {
            id: 'debug-section',
            title: 'Debug Section',
            fields: [
              { id: 'debug-field', type: 'text', label: 'Debug Field' }
            ]
          }
        ],
        generatedAt: new Date().toISOString(),
        version: '1.0',
        debugTest: true
      }
    };
    
    console.log('📤 Sending config:', JSON.stringify(testConfig, null, 2));
    
    const response = await fetch('http://localhost:8080/api/templates/1/configuration', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testConfig)
    });
    
    console.log('📥 Response status:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Save response:', result);
      
      // Immediately check if it was saved
      console.log('🔍 Verifying save...');
      const verifyResponse = await fetch('http://localhost:8080/api/templates/1');
      if (verifyResponse.ok) {
        const verifyTemplate = await verifyResponse.json();
        console.log('📋 Template after save:', {
          name: verifyTemplate.name,
          hasMetadata: !!verifyTemplate.metadata,
          metadata: verifyTemplate.metadata
        });
        
        if (verifyTemplate.metadata && verifyTemplate.metadata.configuration) {
          console.log('✅ Configuration found in metadata!');
          console.log('🎯 Saved configuration:', verifyTemplate.metadata.configuration);
        } else {
          console.log('❌ Configuration NOT found in metadata');
        }
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Save failed:', errorText);
    }
  } catch (error) {
    console.log('❌ Error in configuration save test:', error.message);
  }
}

// Test 4: Check the specific configuration endpoint
async function testConfigurationEndpoint() {
  try {
    console.log('🔗 Testing configuration endpoint directly...');
    const response = await fetch('http://localhost:8080/api/templates/1/configuration');
    if (response.ok) {
      const config = await response.json();
      console.log('✅ Configuration endpoint response:', config);
    } else {
      console.log('❌ Configuration endpoint failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Configuration endpoint error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting debug tests...\n');
  
  await testServerHealth();
  console.log('');
  
  await testTemplateExists();
  console.log('');
  
  await testConfigurationSave();
  console.log('');
  
  await testConfigurationEndpoint();
  console.log('');
  
  console.log('🏁 Debug tests completed!');
}

runAllTests().catch(console.error);