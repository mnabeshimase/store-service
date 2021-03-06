const mysql = require('promise-mysql');
const mysqlConfig = process.env.NODE_ENV === 'production' ?
  require('./mysql/mysql.config_prod.js') :
  require('./mysql/mysql.config.js');

let connection;

(function conenctMySQL() {
  mysql.createConnection(mysqlConfig)
    .then((conn) => { connection = conn; })
    .catch(() => {
      console.log('Connecting to MySQL server');
      setTimeout(conenctMySQL, 1000);
    });
}());

module.exports.countUsers = () => (connection.query('SELECT COUNT(*) FROM users').catch(() => countUsers()));

module.exports.insertProduct = set => (connection.query('INSERT INTO products SET ?', set).catch(() => insertProduct(set)));

module.exports.insertUser = set => (connection.query('INSERT INTO users SET ?', set).catch(() => insertUser(set)));

module.exports.insertShoppingCart = (userId, subtotal) => (
  connection.query('INSERT INTO shopping_carts SET ?', { user_id: userId, subtotal })
    .catch(() => insertShoppingCart(userId, subtotal))
);

module.exports.insertPurchase = (userId, shoppingCartId) => (
  connection.query('INSERT INTO purchases SET ?', { user_id: userId, shopping_cart_id: shoppingCartId })
    .catch(() => insertPurchase(userId, shoppingCartId))
);

module.exports.insertReview = (userId, productId, purchaseId, title, review, rating) => (
  connection.query('INSERT INTO reviews SET ?', {
    user_id: userId,
    product_id: productId,
    purchase_id: purchaseId,
    title,
    review,
    rating,
  })
    .catch(() => insertReview(userId, productId, purchasId, title, review, rating))
);

module.exports.insertProductsShoppingCarts =
(productId, quantity, shoppingCartId, recommendationType) => (
  connection.query('INSERT INTO products_shopping_carts SET ?', {
    product_id: productId,
    shopping_cart_id: shoppingCartId,
    quantity,
    recommendation_type: recommendationType,
  }).catch(() => insertProductsShoppingCarts(productId, quantity, shoppingCartId, recommendationType))
);

module.exports.sendPurchaseToContentBasedFiltering = purchaseId => (
  connection.query(`SELECT shopping_carts.user_id, products_shopping_carts.product_id
  FROM shopping_carts INNER JOIN products_shopping_carts
  WHERE products_shopping_carts. shopping_cart_id = shopping_carts.id
  AND shopping_carts.id IN (
    SELECT shopping_cart_id
    FROM purchases
    WHERE id = ${purchaseId}
  )`).catch(() => ())
);

module.exports.sendProductToContentBasedFiltering = productId => (
  connection.query(`SELECT * FROM products WHERE id = ${productId}`)
);

module.exports.sendUserToContentBasedFiltering = userId => (
  connection.query(`SELECT id AS user_id, age, street_address, zip_code, city, state, gender, marital_status, children
    FROM users
    WHERE id = ${userId};
  `)
);

module.exports.findPurchaseById = purchaseId => (
  connection.query(`SELECT user_id, shopping_cart_id FROM purchases WHERE id = ${purchaseId}`)
);

module.exports.sendPurchaseToCollaborativeFiltering = (userId, shoppingCartId) => (
  connection.query(`SELECT products.id AS product_id, products.category, reviews.rating
    FROM products INNER JOIN reviews
    WHERE products.id = reviews.product_id
    AND reviews.user_id  = ${userId}
    AND products.id IN (
      SELECT products_shopping_carts.product_id
      FROM products_shopping_carts
      WHERE shopping_cart_id = ${shoppingCartId}
    )`)
);

module.exports.getRecommendationTypesForAnalytics = purchaseId => (
  connection.query(`SELECT purchases.user_id, products_shopping_carts.recommendation_type
  FROM purchases INNER JOIN shopping_carts INNER JOIN products_shopping_carts
  WHERE purchases.id = ${purchaseId}
  AND purchases.shopping_cart_id = shopping_carts.id
  AND shopping_carts.id = products_shopping_carts.shopping_cart_id`)
);
