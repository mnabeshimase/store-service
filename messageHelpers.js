const AWS = require('aws-sdk');

AWS.config.loadFromPath('./config.json');
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });
const QueueUrl = 'https://sqs.us-east-1.amazonaws.com/448913324891/CollaborativeFilteringServiceInput';


const sendPurchaseToCollaborativeFiltering = (connection, purchaseId) => {
  let userId;
  let shoppingCartId;
  return connection.query(`SELECT user_id, shopping_cart_id FROM purchases WHERE id = ${purchaseId}`)
    .then((purchase) => {
      userId = purchase[0].user_id;
      shoppingCartId = purchase[0].shopping_cart_id;
      return connection.query(`SELECT products.id, products.category, reviews.rating
        FROM products INNER JOIN reviews
        WHERE products.id = reviews.product_id
        AND reviews.user_id  = ${userId}
        AND products.id IN (
        SELECT products_shopping_carts.product_id
        FROM products_shopping_carts
        WHERE shopping_cart_id = ${shoppingCartId}
        )`);
    })
    .then((items) => {
      const params = {
        MessageAttributes: {
          messageType: {
            DataType: 'String',
            StringValue: 'Purchase',
          },
        },
        MessageBody: JSON.stringify({
          user_id: userId,
          shopping_cart: items,
        }),
        QueueUrl,
      };
      sqs.sendMessage(params, (error, data) => {
        if (error) {
          console.log('Error', error);
        } else {
          console.log('Success', data.MessageId);
        }
      });
    });
};

module.exports.sendPurchaseToCollaborativeFiltering = sendPurchaseToCollaborativeFiltering;
