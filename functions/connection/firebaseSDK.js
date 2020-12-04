const Firebase = require('firebase');
require('dotenv').config();

Firebase.initializeApp({
  apiKey: process.env.APIKEY,
  authDomain: process.env.AUTHDOMAIN,
  projectId: process.env.PROJECTID,
  storageBucket: process.env.STORAGEBUCKET,
  databaseURL: process.env.DATABASEURL,
  appId: process.env.APPID,
  messagingSenderId: process.env.MESSAGINGSENDERID,
});

// if (!env.production) {
Firebase.auth().useEmulator('http://localhost:9099/');
// }

module.exports = Firebase;
