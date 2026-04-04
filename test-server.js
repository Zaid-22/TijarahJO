const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 5033,
  path: '/api/v1/chat/download-image?conversationId=5&url=%2Fuploads%2Fchat-images%2F2026.webp&sig=ABCD',
  method: 'GET'
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d));
});

req.on('error', e => console.error(`problem with request: ${e.message}`));
req.end();
