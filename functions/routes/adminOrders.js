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

router.get('/all', async (req, res) => {
  const returnList = [];
  const orderSnapshot = (await orderDB.get()).docs;

  orderSnapshot.forEach((item) => returnList.push(item.data()));

  res.json({
    success: true,
    products: [...returnList],
    pagination: {
      total_pages: 1,
      current_page: 1,
      has_pre: false,
      has_next: false,
      category: null,
    },
  });
});

module.exports = router;
