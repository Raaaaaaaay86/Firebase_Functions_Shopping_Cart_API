const Express = require('express');
const admin = require('../connection/firebaseAdmin');
const Paginate = require('../helper/paginate');

const router = Express.Router();
const couponDB = admin.firestore().collection('coupons');

router.post('/', async (req, res) => {
  const { data } = req.body;
  try {
    const couponRef = await couponDB.doc();

    await couponRef.set({
      ...data,
      id: couponRef.id,
    });

    res.json({
      success: true,
      message: '已建立優惠券',
    });
  } catch (error) {
    res.json({
      success: false,
      message: '建立失敗，請重新嘗試',
    });
  }
});

router.put('/:id', async (req, res) => {
  const { data } = req.body;
  try {
    await admin.firestore().runTransaction(async (tx) => {
      const updateCoupon = await tx.get(couponDB.doc(req.params.id));
      if (!updateCoupon.data()) return Promise.reject(new Error());
      tx.update(couponDB.doc(req.params.id), data);
      return Promise.resolve(true);
    });

    res.json({
      success: true,
      message: '修改成功',
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: '修改失敗，請重新嘗試',
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await admin.firestore().runTransaction(async (tx) => {
      const deleteCoupon = await tx.get(couponDB.doc(req.params.id));
      if (!deleteCoupon.data()) return Promise.reject(new Error());
      tx.delete(couponDB.doc(req.params.id));
      return Promise.resolve(true);
    });

    res.json({
      success: true,
      message: '已刪除優惠券',
    });
  } catch ({ message }) {
    res.json({
      success: false,
      message: '刪除失敗，請重新嘗試',
    });
  }
});

router.get('/', async (req, res) => {
  const { page } = req.query;
  try {
    const couponList = (await couponDB.get()).docs;

    const { pageContent, pagination } = Paginate(couponList, page);

    const returnList = [];
    pageContent.forEach((item) => returnList.push(item.data()));

    res.json({
      success: true,
      coupons: returnList,
      pagination,
    });
  } catch (error) {
    res.json({
      success: false,
      message: '頁面不存在',
    });
  }
});

module.exports = router;
