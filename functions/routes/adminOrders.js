const Express = require('express');
const admin = require('../connection/firebaseAdmin');
const Paginate = require('../helper/paginate');

const router = Express.Router();
const orderDB = admin.firestore().collection('orders');

router.get('/', async (req, res) => {
  const { pageContent, pagination } = Paginate(
    (await orderDB.get()).docs, // input List
    req.query.page, // requesting page
  );

  const orderList = [];
  pageContent.forEach((order) => orderList.push(order.data()));

  try {
    res.json({
      success: true,
      orders: orderList,
      pagination,
    });
  } catch (error) {
    res.json({
      success: false,
      message: '此頁面不存在',
    });
  }
});

module.exports = router;
