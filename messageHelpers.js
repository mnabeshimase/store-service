const AWS = require('aws-sdk');
const QueueUrls = require('./SQS.config.js');

AWS.config.loadFromPath('./config.json');
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

const sendSqs = (message, body, QueueUrl) => {
  const params = {
    MessageAttributes: {
      messageType: {
        DataType: 'String',
        StringValue: message,
      },
    },
    MessageBody: JSON.stringify(body),
    QueueUrl,
  };
  return new Promise((resolve, reject) => {
    sqs.sendMessage(params, (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data.MessageId);
      }
    });
  });
};

module.exports.sendPurchaseToCollaborativeFiltering = (connection, purchaseId) => {
  let userId;
  let shoppingCartId;
  return connection.query(`SELECT user_id, shopping_cart_id FROM purchases WHERE id = ${purchaseId}`)
    .then((purchase) => {
      userId = purchase[0].user_id;
      shoppingCartId = purchase[0].shopping_cart_id;
      return connection.query(`SELECT products.id AS product_id, products.category, reviews.rating
        FROM products INNER JOIN reviews
        WHERE products.id = reviews.product_id
        AND reviews.user_id  = ${userId}
        AND products.id IN (
          SELECT products_shopping_carts.product_id
          FROM products_shopping_carts
          WHERE shopping_cart_id = ${shoppingCartId}
        )`);
    })
    .then(items => (
      sendSqs(
        'purchase',
        {
          user_id: userId,
          shopping_cart: items,
        },
        QueueUrls.collaborativeFilteringServiceInputUrl,
      )
    ));
};

module.exports.sendUserToContentBasedFiltering = (connection, userId) => (
  connection.query(`SELECT id AS user_id, age, street_address, zip_code, city, state, gender, marital_status, children
    FROM users
    WHERE id = ${userId};
  `)
    .then(user => (
      sendSqs(
        'user_signup',
        user,
        QueueUrls.contentBasedFilteringServiceInputUrl,
      )
    ))
);

module.exports.sendProductToContentBasedFiltering = (connection, productId) => (
  connection.query(`SELECT * FROM products WHERE id = ${productId}`)
    .then((product) => {
      sendSqs(
        'product_registration',
        product,
        QueueUrls.contentBasedFilteringServiceInputUrl,
      );
    })
);

module.exports.sendPurchaseToContentBasedFiltering = (connection, purchaseId) => (
  connection.query(`SELECT shopping_carts.user_id, products_shopping_carts.product_id
  FROM shopping_carts INNER JOIN products_shopping_carts
  WHERE products_shopping_carts. shopping_cart_id = shopping_carts.id
  AND shopping_carts.id IN (
    SELECT shopping_cart_id
    FROM purchases
    WHERE id = ${purchaseId}
  )`)
    .then((items) => {
      const itemsSent = [];
      for (let i = 0; i < items.length; i += 1) {
        itemsSent.push(sendSqs(
          'purchase',
          items[i],
          QueueUrls.contentBasedFilteringServiceInputUrl,
        ));
      }
      return Promise.all(itemsSent);
    })
);

module.exports.sendPageViewToContentBasedFiltering = (collection, pageViewId) => (
  collection.findOne({ _id: pageViewId })
    .then(pageView => (
      sendSqs(
        'page_view',
        pageView,
        QueueUrls.contentBasedFilteringServiceInputUrl,
      )
    ))
);

module.exports.sendMouseoversToContentBasedFiltering = (collection, mouseoversId) => (
  collection.findOne({ _id: mouseoversId })
    .then(mouseovers => (
      sendSqs(
        'page_view',
        mouseovers,
        QueueUrls.contentBasedFilteringServiceInputUrl,
      )
    ))
);
