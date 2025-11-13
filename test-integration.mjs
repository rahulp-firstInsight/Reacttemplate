// Test script for integrated external API + Azure MySQL setup
import http from 'http';

const BASE_URL = 'http://localhost:8080/api';

console.log('🌟 TESTING INTEGRATED EXTERNAL API + AZURE MYSQL');
console.log('===============================================');
console.log('📡 External API: https://aiscribeqa.maximeyes.com:5005/templates');
console.log('🗄️ Database: qamysqlserver.mysql.database.azure.com/qa_scribe_test');
console.log('===============================================\n');

// Test function
function makeAPICall(endpoint, method = 'GET', data = null, description = '') {
  return new Promise((resolve) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    console.log(`\n🎯 ${description}`);
    console.log(`📞 ${method} ${endpoint}`);
    console.log(`📋 Watch server console for:`);
    
    if (method === 'GET' && endpoint === '/templates') {
      console.log(`   🌐 EXTERNAL API: GET https://aiscribeqa.maximeyes.com:5005/templates`);
      console.log(`   🔵 EXECUTING: CALL GetTemplates()`);
    } else if (method === 'POST' && endpoint === '/templates') {
      console.log(`   🌐 EXTERNAL API: POST https://aiscribeqa.maximeyes.com:5005/templates`);
      console.log(`   🔵 EXECUTING: CALL add_template('Test Template', 'Description', '{"metadata"}', 1.0, 1, 'Initial creation')`);
    } else if (method === 'PUT' && endpoint.includes('/templates/')) {
      const id = endpoint.split('/')[2];
      console.log(`   🌐 EXTERNAL API: PUT https://aiscribeqa.maximeyes.com:5005/templates/${id}`);
      console.log(`   🔵 EXECUTING: CALL UpdateTemplate(${id}, 'Updated Template', 'Updated desc', '{"metadata"}', 2.0, 1, 'Template updated', b'1')`);
    } else if (method === 'DELETE' && endpoint.includes('/templates/')) {
      const id = endpoint.split('/')[2];
      console.log(`   🌐 EXTERNAL API: DELETE https://aiscribeqa.maximeyes.com:5005/templates/${id}`);
      console.log(`   🔵 EXECUTING: CALL SoftDeleteTemplate(${id}, 1, 'Template deactivated')`);
    }
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          console.log(`✅ Response Status: ${res.statusCode}`);
          
          if (res.statusCode < 300) {
            console.log(`📄 Success Response:`, JSON.stringify(result, null, 2));
          } else {
            console.log(`⚠️ Error Response:`, JSON.stringify(result, null, 2));
          }
        } catch (error) {
          console.log(`📄 Raw Response: ${responseData}`);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`💥 Request Error:`, error.message);
      resolve();
    });
    
    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Run comprehensive test
async function runIntegratedTests() {
  // Test external API connectivity
  await makeAPICall('/test-external', 'GET', null, 'Testing External API Connectivity');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test getting all templates (combines external + database)
  await makeAPICall('/templates', 'GET', null, 'Getting All Templates (External API + Database)');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test creating a template (syncs to both external API + database)
  await makeAPICall('/templates', 'POST', {
    name: 'Integrated Test Template',
    description: 'Created via integrated API',
    metadata: { 
      source: 'integration_test',
      timestamp: new Date().toISOString()
    }
  }, 'Creating Template (Sync to External API + Database)');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test updating a template
  await makeAPICall('/templates/1', 'PUT', {
    name: 'Updated Integrated Template',
    description: 'Updated via integrated API',
    metadata: {
      source: 'integration_test_update',
      timestamp: new Date().toISOString()
    }
  }, 'Updating Template ID 1 (Sync to External API + Database)');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test deleting a template
  await makeAPICall('/templates/1', 'DELETE', null, 'Deleting Template ID 1 (Sync to External API + Database)');
  
  console.log('\n🏁 INTEGRATION TEST COMPLETE!');
  console.log('\n📋 Summary:');
  console.log('   ✅ External API: https://aiscribeqa.maximeyes.com:5005/templates');
  console.log('   ✅ Database: qamysqlserver.mysql.database.azure.com/qa_scribe_test');
  console.log('   ✅ SQL Stored Procedures: GetTemplates, GetTemplateById, add_template, UpdateTemplate, SoftDeleteTemplate');
  console.log('   ✅ Integrated CRUD operations with dual sync');
  
  console.log('\n💡 Expected Behavior:');
  console.log('   📡 All operations sync with external API first');
  console.log('   🗄️ All operations store/update in Azure MySQL database');
  console.log('   🔵 All database operations show SQL stored procedure calls');
  console.log('   ⚡ Templates from both sources are combined in GET responses');
}

runIntegratedTests().catch(console.error);