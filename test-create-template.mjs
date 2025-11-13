import http from 'http';

const data = JSON.stringify({
  name: "Test Template",
  description: "A test template created via API",
  metadata: {
    sections: [
      { name: "Chief Complaint", fields: [] },
      { name: "HPI", fields: [] }
    ],
    createdVia: "API"
  }
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/templates',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('BODY:', body);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('Problem with request:', e.message);
  process.exit(1);
});

req.write(data);
req.end();