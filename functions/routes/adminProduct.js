/* eslint-disable no-restricted-syntax */
/* eslint-disable camelcase */
const Express = require('express');

const { Storage } = require('@google-cloud/storage');

const UUID = require('uuid-v4');
const os = require('os');
const fs = require('fs');
const path = require('path');
const Busboy = require('busboy');

const admin = require('../connection/firebaseAdmin');

const gcconfig = {
  projectId: 'shop-admin-3bc87',
  keyFilename: './ServiceKey.json',
};
const storage = new Storage(gcconfig);

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
      success: true,
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
      success: true,
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
      success: true,
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

router.get('/all', async (req, res) => {
  const returnList = [];
  const productSnapshot = (await productDB.get()).docs;

  productSnapshot.forEach((item) => returnList.push(item.data()));

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

router.post('/uploadImage', async (req, res) => {
  try {
    const busboy = new Busboy({ headers: req.headers });
    const uuid = UUID();
    let upload = {};
    console.log('uuuid', uuid);

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      console.log(`File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`);
      const filePath = path.join(os.tmpdir(), filename);
      upload = { file: filename, type: mimetype, path: filePath };
      console.log(filePath);
      file.pipe(fs.createWriteStream(filePath));
    });

    busboy.on('finish', async () => {
      const bucket = storage.bucket('shop-admin-3bc87.appspot.com');
      bucket.upload(
        upload.path,
        {
          uploadType: 'media',
          metadata: {
            metadata: {
              contentType: upload.type,
              firebaseStorageDownloadTokens: uuid,
            },
          },
        },
        (err, uploadedFile) => {
          if (!err) {
            res.json({
              success: true,
              imageUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(uploadedFile.name)}?alt=media&token=${uuid}`,
            });
          } else {
            throw new Error();
          }
        },
      );
    });

    busboy.end(req.rawBody);
  } catch (error) {
    console.log(error);
    res.json({ success: false });
  }
});

module.exports = router;
