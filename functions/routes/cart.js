/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
const Express = require('express');
const admin = require('../connection/firebaseAdmin');
const generateId = require('../helper/generateId');

const router = Express.Router(); // path:'/login'
const cartDB = admin.firestore().collection('cart');
const productDB = admin.firestore().collection('products');

router.post('/', async (req, res) => {
  const { product_id } = req.body.data;
  const qty = parseInt(req.body.data.qty, 10);
  const uuid = generateId();

  try {
    await admin.firestore().runTransaction(async (tx) => {
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
        cart[index].qty = parseInt(cart[index].qty, 10) + qty;
      } else {
        cart.push({ product_id, qty, id: uuid });
      }

      tx.set(cartDB.doc(cartId), { carts: cart });
    });

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

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await admin.firestore().runTransaction(async (tx) => {
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
    const cartDocList = (await cartDB.get()).docs;
    let final_total = 0;
    let origin_total = 0;
    let cartList = [];

    console.log((await cartDB.get()).docs.length);

    if (cartDocList.length !== 0) {
      const { carts, coupon_enabled, coupon } = cartDocList[0].data();
      const productTable = {};

      const productIdList = [];
      carts.forEach((cart) => productIdList.push(cart.product_id));
      console.log(productIdList);

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
    }

    res.json({
      success: true,
      data: {
        carts: cartList,
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
