/* eslint-disable camelcase */
const Express = require('express');
const Paginate = require('../helper/paginate');
const admin = require('../connection/firebaseAdmin');

const router = Express.Router();
const cartDB = admin.firestore().collection('cart');
const orderDB = admin.firestore().collection('orders');
const productDB = admin.firestore().collection('products');

router.post('/', async (req, res) => {
  const { message, user } = req.body.data;

  try {
    admin.firestore().runTransaction(async (tx) => {
      const productIdList = [];
      const { carts } = (await tx.get(cartDB)).docs[0].data();
      carts.forEach((item) => productIdList.push(item.product_id));

      const productTable = {};
      const products = await productDB.where('id', 'in', productIdList).get();
      products.forEach((product) => {
        productTable[product.data().id] = product.data();
      });

      const detailCarts = carts.map((el) => ({
        ...el,
        product: productTable[el.product_id],
      }));

      let total = 0;
      detailCarts.forEach((cart) => {
        total += (cart.qty * cart.product.price);
      });

      const newOrderRef = orderDB.doc();

      tx.set(newOrderRef, {
        create_at: new Date().getTime(),
        id: newOrderRef.id,
        is_paid: false,
        products: [...detailCarts],
        message,
        total,
        user,
      });
    });

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: '建立訂單失敗',
    });
  }
});

router.get('/', async (req, res) => {
  const orderList = [];

  try {
    if (!req.query.page) throw new Error();
    const ordersSnapshot = (await orderDB.get()).docs;
    ordersSnapshot.forEach((order) => orderList.push(order.data()));

    const { pageContent, pagination } = Paginate(orderList, req.query.page);

    res.json({
      success: true,
      orders: pageContent,
      pagination,
    });
  } catch (error) {
    res.json({
      success: false,
      message: '頁面不存在',
    });
  }
});

router.get('/:order_id', async (req, res) => {
  const { order_id } = req.params;
  try {
    const order = (await orderDB.where('id', '==', order_id).get()).docs[0].data();

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: '訂單不存在',
    });
  }
});

module.exports = router;
