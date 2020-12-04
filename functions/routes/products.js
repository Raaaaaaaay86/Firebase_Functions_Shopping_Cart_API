/* eslint-disable camelcase */
const Express = require('express');
const admin = require('../connection/firebaseAdmin');
const Paginate = require('../helper/paginate');

const router = Express.Router(); // path: '/product'
const productDB = admin.firestore().collection('products');

router.get('/all', async (req, res) => {
  try {
    const querySnapshot = await productDB.get();
    const productList = [];

    querySnapshot.forEach((doc) => productList.push(doc.data()));

    res.json({
      success: true,
      products: [...productList],
      pagination: {
        total_pages: 1,
        current_page: 1,
        has_pre: false,
        has_next: false,
        category: null,
      },
    });
  } catch (error) {
    res.json({ success: false });
  }
});

router.get('/', async (req, res) => {
  try {
    let querySnapshot;
    const productList = [];

    if (!req.query.cat) {
      querySnapshot = await productDB.get();
    } else {
      querySnapshot = await productDB.where('category', '==', req.query.cat).get();
    }

    querySnapshot.forEach((doc) => productList.push(doc.data()));

    const { pageContent, pagination } = Paginate(productList, req.query.page);

    res.json({
      success: true,
      products: pageContent,
      pagination,
    });
  } catch (error) {
    res.json({
      succuss: false,
      message: '頁面不存在',
    });
  }
});

module.exports = router;