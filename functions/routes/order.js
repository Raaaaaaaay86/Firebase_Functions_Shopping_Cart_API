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
  const newOrderRef = orderDB.doc();
  const productTable = {};
  let origin_total = 0;
  let final_total = 0;
  let cartList = [];

  try {
    await admin.firestore().runTransaction(async (tx) => {
      const productIdList = [];
      const { carts, coupon, coupon_enabled } = (await tx.get(cartDB)).docs[0].data();
      carts.forEach((item) => productIdList.push(item.product_id));

      const products = await productDB.where('id', 'in', productIdList).get();
      products.forEach((product) => {
        productTable[product.data().id] = product.data();
      });

      cartList = carts.map((cartInfo) => ({
        ...cartInfo,
        product: productTable[cartInfo.product_id],
      }));

      cartList.forEach((cart) => {
        origin_total += (cart.qty * cart.product.price);
      });

      cartList.forEach((cart) => {
        if (coupon_enabled) {
          final_total += (cart.qty * Math.round(cart.product.price * (coupon.percent / 100)));
        } else {
          final_total = origin_total;
        }
      });

      tx.set(newOrderRef, {
        create_at: new Date().getTime(),
        products: [...cartList],
        id: newOrderRef.id,
        is_paid: false,
        origin_total,
        final_total,
        message,
        user,
      });
    });

    res.json({
      success: true,
      orderId: newOrderRef.id,
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
