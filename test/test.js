const assert = require('assert');
const { expect } = require('chai');
const rp = require('request-promise');
const { MongoClient } = require('mongodb');
const mysql = require('promise-mysql');
const mysqlConfig = require('../mysql/mysql.config.js');

const SERVICESTORE_PORT = 3000;

describe('Store service api', () => {
  let db;
  let connection;
  before((done) => {
    (async () => {
      connection = await mysql.createConnection(mysqlConfig);
    })();
    MongoClient.connect('mongodb://localhost:27017/DL', (err, database) => {
      assert.equal(null, err);
      db = database;
      done();
    });
  });

  describe('GET /:productId', () => {
    it('should return status code 200 for correctly formatted request', (done) => {
      rp({
        method: 'GET',
        url: `http://localhost:${SERVICESTORE_PORT}/1?user_id=1`,
        json: {
          view_duration: 10,
        },
      })
        .on('response', (response) => {
          expect(response.statusCode).to.equal(200);
          done();
        });
    });

    it('should insert a new document into page_views collection', (done) => {
      let oldCount;
      db.collection('page_views').count()
        .then((count) => {
          oldCount = count;
        })
        .then(() => (
          rp({
            method: 'GET',
            url: `http://localhost:${SERVICESTORE_PORT}/1?user_id=1`,
            json: {
              view_duration: 10,
            },
          })
        ))
        .then(() => (db.collection('page_views').count()))
        .then((newCount) => {
          expect(newCount).to.equal(oldCount + 1);
          done();
        });
    });
  });

  describe('POST /products', () => {
    it('should return status code 200 for correctly formatted request', (done) => {
      rp({
        method: 'POST',
        url: `http://localhost:${SERVICESTORE_PORT}/products`,
        json: {
          name: 'product',
          price: 1,
          user_id: 1,
          category: 'Test category',
        },
      })
        .on('response', (response) => {
          expect(response.statusCode).to.equal(200);
          done();
        });
    });

    it('should insert a new row into products table', (done) => {
      let oldCount;
      connection.query('SELECT COUNT(*) FROM products')
        .then((count) => {
          oldCount = count[0]['COUNT(*)'];
          return rp({
            method: 'POST',
            url: `http://localhost:${SERVICESTORE_PORT}/products`,
            json: {
              name: 'another product',
              price: 1,
              user_id: 1,
              category: 'Test category',
            },
          });
        })
        .then(() => (connection.query('SELECT COUNT(*) FROM products')))
        .then((newCount) => {
          expect(newCount[0]['COUNT(*)']).to.equal(oldCount + 1);
          done();
        });
    });
  });

  describe('POST /signup', () => {
    it('should return status code 200 for correctly formatted request', (done) => {
      rp({
        method: 'POST',
        url: `http://localhost:${SERVICESTORE_PORT}/signup`,
        json: {
          age: 20,
          email: 'test@email.com',
          password: 'test password',
          first_name: 'first_name',
          last_name: 'last_name',
          street_address: 'Test address 123',
          zip_code: 123456,
          city: 'Test city',
          state: 'California',
          gender: 'male',
          marital_status: 'single',
          children: 2,
        },
      })
        .on('response', (response) => {
          expect(response.statusCode).to.equal(200);
          done();
        });
    });

    it('should insert a new row into users table', (done) => {
      let oldCount;
      connection.query('SELECT COUNT(*) FROM users')
        .then((count) => {
          oldCount = count[0]['COUNT(*)'];
          return rp({
            method: 'POST',
            url: `http://localhost:${SERVICESTORE_PORT}/signup`,
            json: {
              age: 20,
              email: 'test@email.com',
              password: 'test password',
              first_name: 'first_name',
              last_name: 'last_name',
              street_address: 'Test address 123',
              zip_code: 123456,
              city: 'Test city',
              state: 'California',
              gender: 'male',
              marital_status: 'single',
              children: 2,
            },
          });
        })
        .then(() => (connection.query('SELECT COUNT(*) FROM users')))
        .then((newCount) => {
          expect(newCount[0]['COUNT(*)']).to.equal(oldCount + 1);
          done();
        });
    });
  });

  describe('POST /purchase', () => {
    it('should return status code 200 for correctly formatted request', (done) => {
      rp({
        method: 'POST',
        url: `http://localhost:${SERVICESTORE_PORT}/purchase`,
        json: {
          user_id: 1,
          subtotal: 100,
          products: [
            {
              id: 1,
              price: 10,
              quantity: 5,
              rating: 3,
              review_title: 'Test review title',
              review_body: 'Test review body',
              category: 'Test category',
              recommendationType: 'Content-based Filtering',
            },
          ],
        },
      })
        .on('response', (response) => {
          expect(response.statusCode).to.equal(200);
          done();
        });
    });

    it('should insert a new row into reviews table for each product in shopping cart', (done) => {
      let oldCount;
      connection.query('SELECT COUNT(*) FROM reviews')
        .then((count) => {
          oldCount = count[0]['COUNT(*)'];
          return rp({
            method: 'POST',
            url: `http://localhost:${SERVICESTORE_PORT}/purchase`,
            json: {
              user_id: 1,
              subtotal: 100,
              products: [
                {
                  id: 1,
                  price: 10,
                  quantity: 5,
                  rating: 3,
                  review_title: 'Test review title',
                  review_body: 'Test review body',
                  category: 'Test category',
                  recommendationType: 'Content-based Filtering',
                },
                {
                  id: 3,
                  price: 20,
                  quantity: 5,
                  rating: 3,
                  review_title: 'Test review title 2',
                  review_body: 'Test review body 2',
                  category: 'Test category',
                  recommendationType: 'Content-based Filtering',
                },
              ],
            },
          });
        })
        .then(() => (connection.query('SELECT COUNT(*) FROM reviews')))
        .then((newCount) => {
          expect(newCount[0]['COUNT(*)']).to.equal(oldCount + 2);
          done();
        });
    });

    it('should insert a new row into purchases table', (done) => {
      let oldCount;
      connection.query('SELECT COUNT(*) FROM purchases')
        .then((count) => {
          oldCount = count[0]['COUNT(*)'];
          return rp({
            method: 'POST',
            url: `http://localhost:${SERVICESTORE_PORT}/purchase`,
            json: {
              user_id: 1,
              subtotal: 100,
              products: [
                {
                  id: 1,
                  price: 10,
                  quantity: 5,
                  rating: 3,
                  review_title: 'Test review title',
                  review_body: 'Test review body',
                  category: 'Test category',
                  recommendationType: 'Content-based Filtering',
                },
              ],
            },
          });
        })
        .then(() => (connection.query('SELECT COUNT(*) FROM purchases')))
        .then((newCount) => {
          expect(newCount[0]['COUNT(*)']).to.equal(oldCount + 1);
          done();
        });
    });
  });

  describe('POST /mouseovers', () => {
    it('should return status code 200 for correctly formatted request', (done) => {
      rp({
        method: 'POST',
        url: `http://localhost:${SERVICESTORE_PORT}/mouseovers`,
        json: {
          mouseovers: {
            1: 10,
            2: 10,
            3: 10,
          },
        },
      })
        .on('response', (response) => {
          expect(response.statusCode).to.equal(200);
          done();
        });
    });

    it('should insert a new document into mouseovers collection', (done) => {
      let oldCount;
      db.collection('mouseovers').count()
        .then((count) => {
          oldCount = count;
        })
        .then(() => (
          rp({
            method: 'POST',
            url: `http://localhost:${SERVICESTORE_PORT}/mouseovers`,
            json: {
              mouseovers: {
                1: 10,
                2: 10,
                3: 10,
              },
            },
          })
        ))
        .then(() => (db.collection('mouseovers').count()))
        .then((newCount) => {
          expect(newCount).to.equal(oldCount + 1);
          done();
        });
    });
  });
});
