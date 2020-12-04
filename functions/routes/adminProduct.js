/* eslint-disable no-restricted-syntax */
/* eslint-disable camelcase */
const { raw } = require('express');
const { query } = require('express');
const Express = require('express');
const admin = require('../connection/firebaseAdmin');
const Paginate = require('../helper/paginate');

const router = Express.Router(); // path: '/product'
const productDB = admin.firestore().collection('products');

let productList = [];
let productsLoaded = false;

const updateProductList = async () => {
  try {
    if (!productsLoaded) {
      productList = [];
      const querySnapshot = await productDB.get();
      // console.log('[MESSAGE] Updating product list...')

      querySnapshot.forEach((doc) => productList.push(doc.data()));
      productsLoaded = true;

      // console.log(`[MESSAGE] Total products: ${productList.length}`);
    }
    return Promise.resolve(true);
  } catch (error) {
    return Promise.reject(error);
  }
};
updateProductList();

router.post('/', async (req, res) => {
  const { data } = req.body;
  const productRef = productDB.doc();

  try {
    await productRef
      .set({ id: productRef.id, ...data });

    productList.push({ id: productRef, ...data });

    res.json({
      succuss: true,
      message: '已建立產品',
      id: productRef.id,
    });
  } catch (error) {
    res.json({
      success: false,
      message: '建立失敗，請重新嘗試',
    });
  }
});

router.put('/:id', async ({ body: { data }, params: { id } }, res) => {
  const productDocRef = productDB.doc(id);

  try {
    await productDocRef.update(data);

    for (let product of productList) {
      if (product.id === id) {
        product = data;
        break;
      }
    }

    res.json({
      succuss: true,
      message: '已更新產品',
      id,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: '更新失敗，請重新嘗試',
    });
  }
});

router.delete('/:id', async ({ params: { id } }, res) => {
  const productDocRef = productDB.doc(id);

  try {
    await productDocRef.delete();

    let index = 0;
    for (const product of productList) {
      if (product.id === id) {
        productList.splice(index, 1);
        break;
      }
      index += 1;
    }

    res.json({
      succuss: true,
      message: '已刪除產品',
      id,
    });
  } catch (error) {
    res.json({
      success: false,
      message: '刪除失敗，請重新嘗試',
    });
  }
});

router.get('/all', (req, res) => {
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
});

router.get('/', async (req, res) => {
  try {
    const queryPage = parseInt(req.query.page, 10);
    const startAt = 0 + ((queryPage - 1) * 12);
    const endAt = 11 + ((queryPage - 1) * 12);
    const total_pages = Math.ceil(productList.length / 12);

    if (queryPage < 1 || queryPage > total_pages) throw new Error();

    res.json({
      success: true,
      products: productList.slice(startAt, endAt + 1),
      pagination: {
        total_pages,
        current_page: queryPage,
        has_pre: queryPage !== 1,
        has_next: queryPage !== total_pages,
        category: null,
      },
    });
  } catch (error) {
    res.json({
      succuss: false,
    });
  }
});

module.exports = router;
