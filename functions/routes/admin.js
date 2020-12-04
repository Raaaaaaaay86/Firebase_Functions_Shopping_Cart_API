const Express = require('express');

const router = Express.Router();

router.get('/test', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
