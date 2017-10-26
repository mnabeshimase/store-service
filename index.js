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
const AWS = require('aws-sdk');

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

AWS.config.loadFromPath('./config.json');
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

const app = express();
app.use(bodyParser.json());
app.use((req, res, next) => {
  logger.log('info', 'http request', { headers: req.headers, body: req.body });
  next();
});

app.get('/:productId', (req, res) => {
  const collection = db.collection('page_views');
  collection.insert({
    product_id: req.params.productId,
    user_id: req.query.user_id,
    view_duration: req.body.view_duration,
  })
    .then(() => {
      res.end();
    });
});

app.post('/products', (req, res) => {
  connection.query('INSERT INTO products SET ?', req.body)
    .then(() => {
      res.end();
    });
});

app.post('/signup', (req, res) => {
  connection.query('INSERT INTO users SET ?', req.body)
    .then(() => {
      res.end();
    });
});

app.post('/purchase', (req, res) => {
  let shoppingCartId;
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
      const reviewsAndProductsShoppingCarts = [];
      req.body.products.forEach((product) => {
        reviewsAndProductsShoppingCarts.push(connection.query('INSERT INTO reviews SET ?', {
          user_id: req.body.user_id,
          product_id: product.id,
          purchase_id: purchase.insertId,
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
    .then(() => res.end());
});

app.post('/mouseovers', (req, res) => {
  const collection = db.collection('mouseovers');
  collection.insert({
    mouseovers: req.body,
  })
    .then(() => {
      res.end();
    });
});

app.listen(3000); // Listening on port 3000
