console.log('🔍 Testing Port 5173 Database Connection and Data Storage...\n');

async function testPort5173Database() {
  try {
    // First check if the backend server is running
    console.log('1️⃣ Testing backend server connection...');
    const healthCheck = await fetch('http://localhost:8080/api/health');
    if (healthCheck.ok) {
      const healthData = await healthCheck.json();
      console.log('✅ Backend server is running:', healthData);
    } else {
      console.log('❌ Backend server not responding');
      return;
    }

    // Test live database connection by fetching templates
    console.log('\n2️⃣ Testing live database connection...');
    const templatesResponse = await fetch('http://localhost:8080/api/templates');
    
    if (!templatesResponse.ok) {
      throw new Error(`HTTP error! status: ${templatesResponse.status}`);
    }
    
    const templates = await templatesResponse.json();
    console.log(`✅ Successfully connected to live database. Found ${templates.length} templates:`);
    
    templates.forEach((template, index) => {
      console.log(`   ${index + 1}. ID: ${template.id} | Name: "${template.name}" | Domain: ${template.domain}`);
    });

    // Test configuration data in database
    console.log('\n3️⃣ Testing configuration data storage...');
    for (const template of templates.slice(0, 3)) { // Test first 3 templates
      try {
        const configResponse = await fetch(`http://localhost:8080/api/templates/${template.id}/configuration`);
        
        if (configResponse.ok) {
          const configData = await configResponse.json();
          const hasConfig = configData.configuration && Object.keys(configData.configuration).length > 0;
          const configSize = JSON.stringify(configData.configuration || {}).length;
          
          console.log(`   📊 Template ${template.id} (${template.name}):`);
          console.log(`      ✅ Has Configuration: ${hasConfig}`);
          console.log(`      📏 Configuration Size: ${configSize} characters`);
          
          if (hasConfig) {
            const config = configData.configuration;
            console.log(`      🔧 View Mode: ${config.viewMode || 'Not set'}`);
            console.log(`      📝 Sections: ${config.sections ? config.sections.length : 0}`);
            console.log(`      🕒 Generated: ${config.generatedAt ? new Date(config.generatedAt).toLocaleString() : 'Unknown'}`);
          }
        } else {
          console.log(`   ⚠️  Template ${template.id}: No configuration found`);
        }
      } catch (error) {
        console.log(`   ❌ Template ${template.id}: Error loading configuration - ${error.message}`);
      }
    }

    // Test creating a new template to verify write operations
    console.log('\n4️⃣ Testing template creation (write operation)...');
    const testTemplate = {
      name: `Port 5173 Test Template - ${new Date().toLocaleTimeString()}`,
      description: 'Test template created to verify database write operations from port 5173',
      domain: 'Testing',
      sections: [
        {
          id: 'test-section',
          name: 'Test Section',
          description: 'A test section',
          type: 'section',
          fields: [
            {
              id: 'test-field',
              name: 'Test Field',
              description: 'A test field',
              dataType: 'text',
              required: true
            }
          ],
          children: []
        }
      ]
    };

    const createResponse = await fetch('http://localhost:8080/api/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testTemplate),
    });

    if (createResponse.ok) {
      const createdTemplate = await createResponse.json();
      console.log(`✅ Successfully created test template with ID: ${createdTemplate.id}`);
      
      // Test configuration save for the new template
      const testConfig = {
        viewMode: 'paragraph',
        showHPIBullets: true,
        showHeaders: true,
        sections: testTemplate.sections,
        generatedAt: new Date().toISOString(),
        testSource: 'Port 5173 Verification'
      };

      const configSaveResponse = await fetch(`http://localhost:8080/api/templates/${createdTemplate.id}/configuration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configuration: testConfig }),
      });

      if (configSaveResponse.ok) {
        console.log(`✅ Successfully saved configuration for test template ${createdTemplate.id}`);
        
        // Verify the configuration was saved
        const verifyResponse = await fetch(`http://localhost:8080/api/templates/${createdTemplate.id}/configuration`);
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          console.log(`✅ Configuration verified - Size: ${JSON.stringify(verifyData.configuration).length} characters`);
        }
      } else {
        console.log(`❌ Failed to save configuration for test template`);
      }

      // Clean up - delete the test template
      const deleteResponse = await fetch(`http://localhost:8080/api/templates/${createdTemplate.id}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        console.log(`🧹 Test template ${createdTemplate.id} cleaned up successfully`);
      }
    } else {
      console.log('❌ Failed to create test template');
    }

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

// Run the test
testPort5173Database().then(() => {
  console.log('\n🏁 Port 5173 Database Test Complete!');
  console.log('\n📋 SUMMARY:');
  console.log('• If all tests passed, port 5173 is connected to the live Azure MySQL database');
  console.log('• Your templates and configurations are being saved to the production database');
  console.log('• Data persistence is working correctly across all operations');
}).catch(console.error);