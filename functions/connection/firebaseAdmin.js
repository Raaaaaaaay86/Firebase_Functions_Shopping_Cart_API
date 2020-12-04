const admin = require('firebase-admin');
const serviceKey = require('../ServiceKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceKey),
});

module.exports = admin;
