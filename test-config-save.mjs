import fetch from 'node-fetch';

async function testConfigurationSave() {
  console.log('🔍 Testing configuration save endpoint...');
  
  const templateId = 1; // Use template ID 1 from our debug output
  
  const testConfiguration = {
    categories: [
      {
        id: 'test-category-1',
        name: 'Medical History',
        fields: [
          {
            name: 'chief_complaint',
            dataType: 'text',
            required: true,
            label: 'Chief Complaint'
          },
          {
            name: 'duration',
            dataType: 'text', 
            required: false,
            label: 'Duration'
          }
        ]
      },
      {
        id: 'test-category-2',
        name: 'Physical Examination',
        fields: [
          {
            name: 'vital_signs',
            dataType: 'text',
            required: true,
            label: 'Vital Signs'
          }
        ]
      }
    ],
    settings: {
      viewMode: 'paragraph',
      showHeaders: true,
      showHPIBullets: false
    }
  };
  
  try {
    console.log(`📤 Sending configuration to template ID ${templateId}...`);
    console.log('Configuration data:', JSON.stringify(testConfiguration, null, 2));
    
    const response = await fetch(`http://localhost:8080/api/templates/${templateId}/configuration`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        configuration: testConfiguration
      }),
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}: ${responseText}`);
      return;
    }
    
    console.log('✅ Configuration saved successfully!');
    console.log('Response:', responseText);
    
    // Now verify it was saved by getting the configuration back
    console.log('\n🔍 Verifying saved configuration...');
    const getResponse = await fetch(`http://localhost:8080/api/templates/${templateId}/configuration`);
    
    if (getResponse.ok) {
      const savedConfig = await getResponse.json();
      console.log('✅ Retrieved saved configuration:');
      console.log(JSON.stringify(savedConfig, null, 2));
    } else {
      console.error('❌ Failed to retrieve saved configuration');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running on port 8080');
    }
  }
}

testConfigurationSave();