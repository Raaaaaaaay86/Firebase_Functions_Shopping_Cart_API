const Express = require('express');
const admin = require('../connection/firebaseAdmin');

const router = Express.Router();
const orderDB = admin.firestore().collection('orders');

router.post('/:order_id', async (req, res) => {
  const { order_id } = req.params;
  try {
    await admin.firestore().runTransaction(async (tx) => {
      const order = (await orderDB.where('id', '==', order_id).get()).docs[0].data();

      if (order.is_paid) throw new Error('paid');
      order.is_paid = true;

      tx.update(orderDB.doc(order.id), order);
    });

    res.json({
      success: true,
      message: '付款成功',
    });
  } catch (error) {
    let message = '付款失敗請重新嘗試';
    if (error.message === 'paid') message = '此訂單已付款';
    res.json({
      success: false,
      message,
    });
  }
});

module.exports = router;
