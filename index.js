const MONGODB_PORT = 27017;
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const mysql = require('mysql');
const mysqlConfig = require('./mysql/mysql.config.js');
const assert = require('assert');
const winston = require('winston');
const Elasticsearch = require('winston-elasticsearch');


let db;
MongoClient.connect(`mongodb://localhost:${MONGODB_PORT}/DL`, (err, database) => {
  assert.equal(null, err);
  db = database;
});

const connection = mysql.createConnection(mysqlConfig);
connection.connect();

const logger = new winston.Logger({
  transports: [
    new Elasticsearch({}),
  ],
});

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
  }, () => {
    res.end();
  });
});

app.post('/products', (req, res) => {
  connection.query('INSERT INTO products SET ?', req.body, () => {
    res.end();
  });
});

app.post('/signup', (req, res) => {
  connection.query('INSERT INTO users SET ?', req.body, () => {
    res.end();
  });
});

app.post('/purchase', (req, res) => {
  // Save Shopping cart
  connection.query('INSERT INTO shopping_carts SET ?', {
    user_id: req.body.user_id,
    subtotal: req.body.subtotal,
  }, (err, results) => {
    // Save Purchase
    connection.query('INSERT INTO purchases SET ?', {
      user_id: req.body.user_id,
      shopping_cart_id: results.insertId,
    }, () => {
      // Save reviews
      let savedReviews = 0;
      // Save products and shopping_carts join table
      let savedProductsShoppingCarts = 0;

      req.body.products.forEach((product) => {
        connection.query('INSERT INTO reviews SET ?', {
          user_id: req.body.user_id,
          product_id: product.id,
          title: product.review_title,
          review: product.review_body,
          rating: product.rating,
        }, () => {
          savedReviews += 1;
          if (savedReviews === req.body.products.length &&
          savedProductsShoppingCarts === req.body.products.length) {
            res.end();
          }
        });
        connection.query('INSERT INTO products_shopping_carts SET ?', {
          product_id: product.id,
          quantity: product.quantity,
          shopping_cart_id: results.insertId,
        }, () => {
          savedProductsShoppingCarts += 1;
          if (savedProductsShoppingCarts === req.body.products.length &&
          savedReviews === req.body.products.length) {
            res.end();
          }
        });
      });
    });
  });
});

app.post('/mouseovers', (req, res) => {
  const collection = db.collection('mouseovers');
  collection.insert({
    mouseovers: req.body,
  }, () => {
    res.end();
  });
});

app.listen(3000); // Listening on port 3000
