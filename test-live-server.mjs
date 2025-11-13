// Test script for Live Server API endpoints
import http from 'http';

const BASE_URL = 'http://localhost:8080/api';

console.log('🧪 Testing Live Server API Endpoints');
console.log('=====================================');

// Test function with error handling
function testEndpoint(endpoint, method = 'GET', data = null) {
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
    
    console.log(`\n🔍 Testing: ${method} ${endpoint}`);
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ Status: ${res.statusCode}`);
            console.log(`📄 Response:`, JSON.stringify(result, null, 2));
          } else {
            console.log(`❌ Status: ${res.statusCode}`);
            console.log(`⚠️ Error:`, JSON.stringify(result, null, 2));
          }
        } catch (error) {
          console.log(`📄 Raw Response: ${data}`);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`💥 Network Error:`, error.message);
      resolve();
    });
    
    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Run tests
async function runTests() {
  // Basic tests (non-database)
  await testEndpoint('/simple');
  
  // Database-dependent tests
  await testEndpoint('/health');
  await testEndpoint('/templates');
  await testEndpoint('/debug/tables');
  
  // Test creating a template
  await testEndpoint('/templates', 'POST', {
    name: 'Test Template',
    description: 'A test template created via API',
    metadata: {
      createdBy: 'API Test',
      timestamp: new Date().toISOString()
    }
  });
  
  console.log('\n🏁 Testing Complete!');
}

runTests().catch(console.error);