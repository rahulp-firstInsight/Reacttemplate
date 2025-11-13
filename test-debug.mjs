import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/debug/tables',
  method: 'GET',
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

req.end();