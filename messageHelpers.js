const AWS = require('aws-sdk');
const QueueUrls = require('./SQS.config.js');
const mysqlQueryHelpers = require('./mysqlQueryHelpers');

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

module.exports.sendPurchaseToCollaborativeFiltering = (purchaseId) => {
  let userId;
  let shoppingCartId;
  return mysqlQueryHelpers.findPurchaseById(purchaseId)
    .then((purchase) => {
      userId = purchase[0].user_id;
      shoppingCartId = purchase[0].shopping_cart_id;
      return mysqlQueryHelpers.sendPurchaseToCollaborativeFiltering(userId, shoppingCartId);
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

module.exports.sendUserToContentBasedFiltering = userId => (
  mysqlQueryHelpers.sendUserToContentBasedFiltering(userId)
    .then(user => (
      sendSqs(
        'user_signup',
        user,
        QueueUrls.contentBasedFilteringServiceInputUrl,
      )
    ))
);

module.exports.sendProductToContentBasedFiltering = productId => (
  mysqlQueryHelpers.sendProductToContentBasedFiltering(productId)
    .then((product) => {
      sendSqs(
        'product_registration',
        product,
        QueueUrls.contentBasedFilteringServiceInputUrl,
      );
    })
);

module.exports.sendPurchaseToContentBasedFiltering = purchaseId => (
  mysqlQueryHelpers.sendPurchaseToContentBasedFiltering(purchaseId)
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

module.exports.sendPurchaseToAnalytics = purchaseId => (
  mysqlQueryHelpers.getRecommendationTypesForAnalytics(purchaseId)
    .then((recommendationTypes) => {
      const messagesSent = [];
      for (let i = 0; i < recommendationTypes.length; i += 1) {
        messagesSent.push(sendSqs(
          'purchase',
          {
            userId: recommendationTypes[i].user_id,
            recommendationType: recommendationTypes[i].recommendation_type,
          },
          QueueUrls.analyticsInputUrl,
        ));
      }
      return Promise.all(messagesSent);
    })
);
