const mysql = require('promise-mysql');
const AWS = require('aws-sdk');

const QueueUrl = 'https://sqs.us-east-1.amazonaws.com/448913324891/CollaborativeFilteringServiceInput';

AWS.config.loadFromPath('./config.json');
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

const sendToCollaborativeFiltering = (connection, purchaseId) => {
  // let userId;
  // let shoppinCartId;
  return connection.query(`SELECT user_id, shopping_cart_id FROM purchases WHERE id = ${purchaseId}`)
    .then((purchase) => {
      console.log('here', purchase);
    });
  //
  // SELECT products.id, products.category, reviews.rating
  // FROM products INNER JOIN reviews
  // WHERE products.id = reviews.product_id
  // AND reviews.user_id  = 320
  // AND products.id IN (
  // 	SELECT products_shopping_carts.product_id
  // 	FROM products_shopping_carts
  // 	WHERE shopping_cart_id = 1
  // );
};

// const params = {
//   MessageAttributes: {
//     messageType: {
//       DataType: 'String',
//       StringValue: 'Purchase',
//     },
//   },
//   MessageBody: {
//     userId: req.body.user_id,
//     shoppingCart: req.body.products,
//   },
//   QueueUrl,
// };
//
// sqs.sendMessage(params, (error, data) => {
//   if (error) {
//     console.log('Error', error);
//   } else {
//     console.log('Success', data.MessageId);
//   }
// });

module.exports.sendToCollaborativeFiltering = sendToCollaborativeFiltering;
