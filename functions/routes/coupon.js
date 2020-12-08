const Express = require('express');
const admin = require('../connection/firebaseAdmin');

const router = Express.Router();
const cartDB = admin.firestore().collection('cart');
const couponDB = admin.firestore().collection('coupons');

router.post('/', async (req, res) => {
  const { code } = req.body.data;
  try {
    await admin.firestore().runTransaction(async (tx) => {
      const couponList = (await tx.get(couponDB)).docs;
      const cartId = (await tx.get(cartDB)).docs[0].id;
      let coupon = null;

      for (let i = 0; i < couponList.length; i += 1) {
        if (couponList[i].data().code === code) {
          coupon = couponList[i].data();
          break;
        }
      }

      if (!coupon) return Promise.reject(new Error());

      tx.update(cartDB.doc(cartId), { coupon, coupon_enabled: true });
      return Promise.resolve(true);
    });

    res.json({
      success: true,
      message: '已套用優惠券',
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: '套用失敗, 請重新嘗試',
    });
  }
});

module.exports = router;
