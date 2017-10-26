const { expect } = require('chai');
const rp = require('request-promise');

const SERVICESTORE_PORT = 3000;

describe('Store service api', () => {
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
            },
          ],
        },
      })
        .on('response', (response) => {
          expect(response.statusCode).to.equal(200);
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
  });
});
