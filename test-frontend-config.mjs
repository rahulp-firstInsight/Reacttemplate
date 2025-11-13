// Simple test to see what the frontend is actually sending
const testFrontendConfig = () => {
  console.log('🧪 Testing Frontend Configuration Save Process');
  console.log('='.repeat(50));
  
  // Simulate what the frontend should send
  const testConfig = {
    viewMode: 'form',
    showHPIBullets: true,
    showHeaders: true,
    sections: [
      {
        id: 'chief-complaint',
        name: 'Chief Complaint',
        fields: []
      }
    ],
    generatedAt: new Date().toISOString(),
    version: '1.0',
    templateId: '1',
    templateName: 'Test Template',
    metadata: {
      totalSections: 1,
      totalFields: 0,
      lastModified: new Date().toISOString(),
      configurationSource: 'Frontend Test'
    }
  };
  
  console.log('📤 Configuration to send:');
  console.log(JSON.stringify({ configuration: testConfig }, null, 2));
  
  // Test the actual fetch call that the frontend makes
  fetch('http://localhost:8080/api/templates/1/configuration', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      configuration: testConfig
    })
  })
  .then(response => {
    console.log('📥 Response status:', response.status, response.statusText);
    return response.json();
  })
  .then(result => {
    console.log('✅ Server response:', result);
    
    // Now test if we can retrieve it
    return fetch('http://localhost:8080/api/templates/1');
  })
  .then(response => response.json())
  .then(template => {
    console.log('🔍 Template after save:');
    console.log('- Name:', template.name);
    console.log('- Has metadata:', !!template.metadata);
    console.log('- Metadata:', template.metadata);
    
    // Test the configuration endpoint
    return fetch('http://localhost:8080/api/templates/1/configuration');
  })
  .then(response => response.json())
  .then(config => {
    console.log('📋 Direct configuration endpoint:');
    console.log(JSON.stringify(config, null, 2));
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  });
};

testFrontendConfig();