const crypto = require('crypto');

const secret = "SuperSecretSecureDevelopmentKey123!@#";
const sha256 = crypto.createHash('sha256').update(secret).digest();

const conversationId = 5; // Guessing a conversation ID doesn't matter for 404 test if we bypass db. Wait! Does backend check DB for ConversationId? No!
const storedPath = "/uploads/chat-images/20260404092650397_f38822499dc749c2aaafde7ca321812f.webp";

const hmac = crypto.createHmac('sha256', sha256);
hmac.update(`${conversationId}:${storedPath}`);
const signatureBytes = hmac.digest();
const signature = signatureBytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

const encodedUrl = encodeURIComponent(storedPath);
const downloadUrl = `http://localhost:5033/api/v1/chat/download-image?conversationId=${conversationId}&url=${encodedUrl}&sig=${signature}`;

console.log("Fetching:", downloadUrl);

fetch(downloadUrl)
  .then(res => {
    console.log("Status:", res.status, res.statusText);
    return res.text();
  })
  .then(text => console.log("Response:", text.substring(0, 100)))
  .catch(err => console.error(err));
