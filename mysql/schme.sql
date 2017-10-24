/* Execute this file by using: mysql -u <USER> -p < schema.sql */
USE dl;

DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS products_shopping_carts;
DROP TABLE IF EXISTS shopping_carts;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id BIGINT unsigned NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(64),
  last_name VARCHAR(64),
  age TINYINT unsigned,
  email VARCHAR(255),
  password VARCHAR(255),
  street_address VARCHAR(128),
  zip_code VARCHAR(32),
  city VARCHAR(64),
  state VARCHAR(64),
  gender VARCHAR(32),
  marital_status VARCHAR(16),
  children TINYINT unsigned,
  PRIMARY KEY (id)
);

CREATE TABLE products (
  id BIGINT unsigned NOT NULL AUTO_INCREMENT,
  name VARCHAR(255),
  price DECIMAL(16, 2),
  user_id BIGINT unsigned NOT NULL,
  category VARCHAR(255),
  ratings_avg TINYINT unsigned,
  FOREIGN KEY (user_id) REFERENCES users (id),
  PRIMARY KEY (id)
);


CREATE TABLE reviews (
  id BIGINT unsigned NOT NULL AUTO_INCREMENT,
  user_id BIGINT unsigned NOT NULL,
  product_id BIGINT unsigned NOT NULL,
  rating TINYINT unsigned,
  title VARCHAR(255),
  review VARCHAR(4095),
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (product_id) REFERENCES products (id),
  PRIMARY KEY (id)
);

CREATE TABLE shopping_carts (
  id BIGINT unsigned NOT NULL AUTO_INCREMENT,
  user_id BIGINT unsigned NOT NULL,
  subtotal DECIMAL(16, 2),
  FOREIGN KEY (user_id) REFERENCES users (id),
  PRIMARY KEY (id)
);

CREATE TABLE products_shopping_carts (
  id BIGINT unsigned NOT NULL AUTO_INCREMENT,
  product_id BIGINT unsigned NOT NULL,
  shopping_cart_id BIGINT unsigned NOT NULL,
  quantity SMALLINT unsigned,
  FOREIGN KEY (product_id) REFERENCES products (id),
  FOREIGN KEY (shopping_cart_id) REFERENCES shopping_carts (id),
  PRIMARY KEY (id)
);

CREATE TABLE purchases (
  id BIGINT unsigned NOT NULL AUTO_INCREMENT,
  user_id BIGINT unsigned NOT NULL,
  shopping_cart_id BIGINT unsigned NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (shopping_cart_id) REFERENCES shopping_carts (id),
  PRIMARY KEY (id)
);
