const admin = require('../connection/firebaseAdmin');

const checkToken = async (req, res, next) => {
  const { idToken } = req.session;
  try {
    await admin.auth().verifyIdToken(idToken);
    return next();
  } catch (error) {
    console.log(error);
    return res.json({
      status: false,
      message: 'Please sign in',
    });
  }
};

module.exports = checkToken;
