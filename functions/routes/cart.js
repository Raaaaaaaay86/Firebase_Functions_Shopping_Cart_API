/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
const Express = require('express');
const admin = require('../connection/firebaseAdmin');
const generateId = require('../helper/generateId');

const router = Express.Router(); // path:'/login'
const cartDB = admin.firestore().collection('cart');
const productDB = admin.firestore().collection('products');

router.post('/', async (req, res) => {
  const { product_id, qty } = req.body.data;
  const uuid = generateId();

  admin.firestore().runTransaction(async (tx) => {
    const querySnapshot = await cartDB.get();
    const cartRef = cartDB.doc();

    if (querySnapshot.empty) {
      tx.set(cartRef, { carts: [{ product_id, qty, id: uuid }] });
      return;
    }

    const cart = querySnapshot.docs[0].data().carts;
    const cartId = querySnapshot.docs[0].id;
    const index = cart.findIndex((product) => product.product_id === product_id);

    if (index !== -1) {
      cart[index].qty += qty;
    } else {
      cart.push({ product_id, qty, id: uuid });
    }

    tx.set(cartDB.doc(cartId), { carts: cart });
  });

  try {
    res.json({
      success: true,
      message: '已加入購物車',
      id: uuid,
    });
  } catch (error) {
    res.json({
      success: false,
      message: '加入購物車失敗，請重新嘗試',
    });
  }
});

router.delete('/', (req, res) => {
  const { id } = req.body;
  try {
    admin.firestore().runTransaction(async (tx) => {
      const cart = (await cartDB.get()).docs[0].data().carts;
      const cartId = (await cartDB.get()).docs[0].id;

      for (let i = 0; i < cart.length; i += 1) {
        if (cart[i].id === id) {
          cart.splice(i, 1);
        }
      }
      tx.update(cartDB.doc(cartId), { carts: cart });
    });

    res.json({
      success: true,
      message: '刪除成功',
    });
  } catch (error) {
    res.json({
      success: false,
      message: '刪除失敗，請重新嘗試',
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const { carts, coupon_enabled, coupon } = (await cartDB.get()).docs[0].data();
    const productTable = {};

    const productIdList = [];
    carts.forEach((cart) => productIdList.push(cart.product_id));

    const products = await productDB.where('id', 'in', productIdList).get();
    products.forEach((product) => {
      productTable[product.data().id] = product.data();
    });

    const data = carts.map((cartInfo) => ({
      ...cartInfo,
      product: productTable[cartInfo.product_id],
    }));

    let origin_total = 0;
    data.forEach((cart) => {
      origin_total += (cart.qty * cart.product.price);
    });

    let final_total = 0;
    data.forEach((cart) => {
      if (coupon_enabled) {
        final_total += (cart.qty * Math.round(cart.product.price * (coupon.percent / 100)));
      } else {
        final_total = origin_total;
      }
    });

    res.json({
      success: true,
      data: {
        carts: data,
      },
      origin_total,
      final_total,
    });
  } catch (error) {
    console.log(error);
    res.json({
      sussess: false,
    });
  }
});

module.exports = router;
