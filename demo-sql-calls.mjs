// Demo script to show SQL stored procedure calls
import http from 'http';

const BASE_URL = 'http://localhost:8080/api';

console.log('🎯 DEMONSTRATING SQL STORED PROCEDURE CALLS');
console.log('=============================================');

// Test function
function makeAPICall(endpoint, method = 'GET', data = null) {
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
    
    console.log(`\n🎬 Making ${method} request to ${endpoint}`);
    console.log(`📋 Watch the server console for SQL calls...`);
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📤 API Response Status: ${res.statusCode}`);
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`💥 API Error:`, error.message);
      resolve();
    });
    
    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Run demonstration
async function demonstrateSQL() {
  console.log(`\n🔍 When you call GET /api/templates, you should see:`);
  console.log(`   🔵 EXECUTING: CALL GetTemplates()`);
  await makeAPICall('/templates');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(`\n🔍 When you call GET /api/templates/1, you should see:`);
  console.log(`   🔵 EXECUTING: CALL GetTemplateById(1)`);
  await makeAPICall('/templates/1');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(`\n🔍 When you POST a new template, you should see:`);
  console.log(`   🔵 EXECUTING: CALL add_template('Demo Template', 'Demo description', '{"createdAt":"..."}', 1.0, 1, 'Initial creation')`);
  await makeAPICall('/templates', 'POST', {
    name: 'Demo Template',
    description: 'Demo description for testing',
    metadata: { demo: true }
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(`\n🔍 When you PUT to update template 1, you should see:`);
  console.log(`   🔵 EXECUTING: CALL UpdateTemplate(1, 'Updated Template', 'Updated description', '{"fields":["updated"]}', 2.0, 1, 'Template updated', b'1')`);
  await makeAPICall('/templates/1', 'PUT', {
    name: 'Updated Template',
    description: 'Updated description',
    metadata: { fields: ['updated'] }
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(`\n🔍 When you DELETE template 1, you should see:`);
  console.log(`   🔵 EXECUTING: CALL SoftDeleteTemplate(1, 1, 'Template deactivated')`);
  await makeAPICall('/templates/1', 'DELETE');
  
  console.log('\n🎉 Demo complete! Check your server console to see all the SQL calls.');
  console.log('\n📝 NOTE: These calls will timeout due to database firewall,');
  console.log('   but you can still see the SQL statements being logged!');
}

demonstrateSQL().catch(console.error);