const Express = require('express');
const firebase = require('../connection/firebaseSDK');
const admin = require('../connection/firebaseAdmin');

const router = Express.Router(); // path:'/login'
const auth = firebase.auth();

router.post('/', async (req, res) => {
  const { email, password } = req.body;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    req.session.idToken = await auth.currentUser.getIdToken(true);

    res.json({
      success: true,
      message: 'Signed in successfully',
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Sign in failed. Please check your Email or Password.',
    });
  }
});

router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  try {
    const { user } = await auth.signInWithEmailAndPassword(email, password);

    req.session.uid = user.uid;
    req.session.idToken = await auth.currentUser.getIdToken(true);

    res.json({
      success: true,
      message: 'Sign in successfully',
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Sign in failed. Please check your Email or Password.',
    });
  }
});

router.post('/signout', async (req, res) => {
  try {
    console.log(req.session.uid);
    await admin.auth().revokeRefreshTokens(req.session.uid);
    req.session.destroy();
    res.json({
      success: true,
      message: 'Sign out successfully',
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: 'Already Sign out.',
    });
  }
});

module.exports = router;
