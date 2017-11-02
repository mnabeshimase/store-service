const mysql = require('promise-mysql');
const mysqlConfig = require('./mysql/mysql.config.js');

let connection;

(async () => {
  connection = await mysql.createConnection(mysqlConfig);
})();

module.exports.insertProduct = set => (connection.query('INSERT INTO products SET ?', set));

module.exports.insertUser = set => (connection.query('INSERT INTO users SET ?', set));

module.exports.insertShoppingCart = (userId, subtotal) => (
  connection.query('INSERT INTO shopping_carts SET ?', { user_id: userId, subtotal })
);

module.exports.insertPurchase = (userId, shoppingCartId) => (
  connection.query('INSERT INTO purchases SET ?', { user_id: userId, shopping_cart_id: shoppingCartId })
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
);

module.exports.insertProductsShoppingCarts = (productId, quantity, shoppingCartId) => (
  connection.query('INSERT INTO products_shopping_carts SET ?', {
    product_id: productId,
    shopping_cart_id: shoppingCartId,
    quantity,
  })
);

module.exports.sendPurchaseToContentBasedFiltering = purchaseId => (
  connection.query(`SELECT shopping_carts.user_id, products_shopping_carts.product_id
  FROM shopping_carts INNER JOIN products_shopping_carts
  WHERE products_shopping_carts. shopping_cart_id = shopping_carts.id
  AND shopping_carts.id IN (
    SELECT shopping_cart_id
    FROM purchases
    WHERE id = ${purchaseId}
  )`)
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
