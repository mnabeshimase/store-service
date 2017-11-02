const MONGODB_PORT = 27017;
const assert = require('assert');
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const winston = require('winston');
const Elasticsearch = require('winston-elasticsearch');
const messageHelpers = require('./messageHelpers.js');
const responseTime = require('response-time');
const mysqlQueryHelpers = require('./mysqlQueryHelpers.js');

let db;
MongoClient.connect(`mongodb://localhost:${MONGODB_PORT}/DL`, (err, database) => {
  assert.equal(null, err);
  db = database;
});

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
  mysqlQueryHelpers.insertProduct(req.body)
    .then((product) => {
      res.end();
      return messageHelpers.sendProductToContentBasedFiltering(product.insertId);
    })
    .then(() => next());
});

app.post('/signup', (req, res, next) => {
  mysqlQueryHelpers.insertUser(req.body)
    .then(({ insertId }) => {
      res.end();
      return messageHelpers.sendUserToContentBasedFiltering(insertId);
    })
    .then(() => next());
});

app.post('/purchase', (req, res, next) => {
  let shoppingCartId;
  let purchaseId;
  // Save Shopping cart
  mysqlQueryHelpers.insertShoppingCart(req.body.user_id, req.body.subtotal)
    .then((shoppingCart) => {
      shoppingCartId = shoppingCart.insertId;
      // Save Purchase
      return mysqlQueryHelpers.insertPurchase(req.body.user_id, shoppingCartId);
    })
    .then((purchase) => {
      purchaseId = purchase.insertId;
      const reviewsAndProductsShoppingCarts = [];
      req.body.products.forEach((product) => {
        reviewsAndProductsShoppingCarts.push(mysqlQueryHelpers.insertReview(
          req.body.user_id,
          product.id,
          purchaseId,
          product.review_title,
          product.review_body,
          product.rating,
        ));
        reviewsAndProductsShoppingCarts.push(mysqlQueryHelpers.insertProductsShoppingCarts(
          product.id,
          product.quantity,
          shoppingCartId,
        ));
      });
      return Promise.all(reviewsAndProductsShoppingCarts);
    })
    .then(() => {
      res.end();
      return messageHelpers.sendPurchaseToCollaborativeFiltering(purchaseId);
    })
    .then(() => messageHelpers.sendPurchaseToContentBasedFiltering(purchaseId))
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
