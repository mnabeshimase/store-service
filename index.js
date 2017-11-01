const MONGODB_PORT = 27017;
const assert = require('assert');
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const mysql = require('promise-mysql');
const mysqlConfig = require('./mysql/mysql.config.js');
const winston = require('winston');
const Elasticsearch = require('winston-elasticsearch');
const messageHelpers = require('./messageHelpers.js');
const responseTime = require('response-time');

let connection;

let db;
MongoClient.connect(`mongodb://localhost:${MONGODB_PORT}/DL`, (err, database) => {
  assert.equal(null, err);
  db = database;
});

(async () => {
  connection = await mysql.createConnection(mysqlConfig);
})();

const logger = new winston.Logger({
  transports: [
    new Elasticsearch({}),
  ],
});

const app = express();
app.use(bodyParser.json());
app.use(responseTime());

app.get('/:productId', (req, res, next) => {
  const collection = db.collection('page_views');
  collection.insert({
    product_id: req.params.productId,
    user_id: req.query.user_id,
    view_duration: req.body.view_duration,
  })
    .then((pageView) => {
      res.end();
      return messageHelpers
        .sendPageViewToContentBasedFiltering(collection, pageView.insertedIds[0]);
    })
    .then(() => next());
});

app.post('/products', (req, res, next) => {
  connection.query('INSERT INTO products SET ?', req.body)
    .then((product) => {
      res.end();
      return messageHelpers.sendProductToContentBasedFiltering(connection, product.insertId);
    })
    .then(() => next());
});

app.post('/signup', (req, res, next) => {
  connection.query('INSERT INTO users SET ?', req.body)
    .then(({ insertId }) => {
      res.end();
      return messageHelpers.sendUserToContentBasedFiltering(connection, insertId);
    })
    .then(() => next());
});

app.post('/purchase', (req, res, next) => {
  let shoppingCartId;
  let purchaseId;
  // Save Shopping cart
  connection.query('INSERT INTO shopping_carts SET ?', {
    user_id: req.body.user_id,
    subtotal: req.body.subtotal,
  })
    .then((shoppingCart) => {
      shoppingCartId = shoppingCart.insertId;
      // Save Purchase
      return connection.query('INSERT INTO purchases SET ?', {
        user_id: req.body.user_id,
        shopping_cart_id: shoppingCartId,
      });
    })
    .then((purchase) => {
      purchaseId = purchase.insertId;
      const reviewsAndProductsShoppingCarts = [];
      req.body.products.forEach((product) => {
        reviewsAndProductsShoppingCarts.push(connection.query('INSERT INTO reviews SET ?', {
          user_id: req.body.user_id,
          product_id: product.id,
          purchase_id: purchaseId,
          title: product.review_title,
          review: product.review_body,
          rating: product.rating,
        }));
        reviewsAndProductsShoppingCarts.push(connection.query('INSERT INTO products_shopping_carts SET ?', {
          product_id: product.id,
          quantity: product.quantity,
          shopping_cart_id: shoppingCartId,
        }));
      });
      return Promise.all(reviewsAndProductsShoppingCarts);
    })
    .then(() => {
      res.end();
      return messageHelpers.sendPurchaseToCollaborativeFiltering(connection, purchaseId);
    })
    .then(() => messageHelpers.sendPurchaseToContentBasedFiltering(connection, purchaseId))
    .then(() => next());
});

app.post('/mouseovers', (req, res, next) => {
  const collection = db.collection('mouseovers');
  collection.insert({
    mouseovers: req.body,
  })
    .then((mouseovers) => {
      res.end();
      return messageHelpers
        .sendMouseoversToContentBasedFiltering(collection, mouseovers.insertedIds[0]);
    })
    .then(() => next());
});

app.use(({
  body, headers, method, url,
}, res) => {
  logger.log('info', 'http request', {
    body,
    headers,
    method,
    url,
    responseTime: +(res.header()._headers['x-response-time'].slice(0, -2)),
  });
});

app.listen(3000); // Listening on port 3000
