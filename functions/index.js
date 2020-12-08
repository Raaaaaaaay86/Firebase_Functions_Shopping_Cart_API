const functions = require('firebase-functions');
const Express = require('express');
const session = require('express-session');
const cors = require('cors');

const app = Express();
app.use(cors({
  origin: [
    '*',
    'https://ray-nuxt-shop.herokuapp.com',
    'http://127.0.0.1:3000',
    'http://localhost:3000',
  ],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  credentials: true,
}));
// app.use(cors());
// app.options('*', cors());
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));
app.use(session({
  secret: 'testSecret',
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 100 * 1000 },
}));
console.log('[MESSAGE] Server init....');

const AuthRouter = require('./routes/auth');
const AdminRouter = require('./routes/admin');
const AdminProductRouter = require('./routes/adminProduct');
const AdminCouponRouter = require('./routes/adminCoupon');
const AdminOrderRouter = require('./routes/adminOrders');
const ProductRouter = require('./routes/products');
const CartRouter = require('./routes/cart');
const OrderRouter = require('./routes/order');
const PayRouter = require('./routes/pay');
const CouponRouter = require('./routes/coupon');
const checkTokenMiddleware = require('./middleware/checkToken');

app.use('/auth', AuthRouter);
app.use('/admin', AdminRouter);
app.use('/admin/product', AdminProductRouter);
app.use('/admin/coupon', AdminCouponRouter);
app.use('/admin/order', AdminOrderRouter);
app.use('/products', ProductRouter);
app.use('/cart', CartRouter);
app.use('/order', OrderRouter);
app.use('/pay', PayRouter);
app.use('/coupon', CouponRouter);

exports.app = functions.https.onRequest(app);
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// })
