CREATE DATABASE IF NOT EXISTS users_db;
CREATE DATABASE IF NOT EXISTS products_db;
CREATE DATABASE IF NOT EXISTS orders_db;

-- ── Users ──────────────────────────────────────────────────────────
USE users_db;
CREATE TABLE IF NOT EXISTS users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(100),
    last_name     VARCHAR(100),
    role          ENUM('customer','admin') DEFAULT 'customer',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Products ───────────────────────────────────────────────────────
USE products_db;
CREATE TABLE IF NOT EXISTS categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(500),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    price       DECIMAL(10,2) NOT NULL,
    stock       INT DEFAULT 0,
    sku         VARCHAR(100) UNIQUE NOT NULL,
    category_id INT,
    image_url   VARCHAR(500),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Seed categories
INSERT IGNORE INTO categories (name, slug, description) VALUES
    ('Electronics',  'electronics',  'Phones, laptops, gadgets'),
    ('Clothing',     'clothing',     'Shirts, pants, shoes'),
    ('Books',        'books',        'Fiction, non-fiction, technical'),
    ('Home & Garden','home-garden',  'Furniture, tools, decor'),
    ('Sports',       'sports',       'Equipment, clothing, accessories');

-- ── Orders ─────────────────────────────────────────────────────────
USE orders_db;
CREATE TABLE IF NOT EXISTS orders (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    status      ENUM('PENDING','CONFIRMED','SHIPPED','DELIVERED','CANCELLED') DEFAULT 'PENDING',
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes       VARCHAR(500),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    order_id    INT NOT NULL,
    product_id  INT NOT NULL,
    quantity    INT NOT NULL,
    unit_price  DECIMAL(10,2) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ── Cart ───────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS cart_db;
USE cart_db;
CREATE TABLE IF NOT EXISTS cart_items (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    product_id  INT NOT NULL,
    quantity    INT NOT NULL DEFAULT 1,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_cart_item (user_id, product_id)
);

-- ── Payments ───────────────────────────────────────────────────────
USE orders_db;
CREATE TABLE IF NOT EXISTS payments (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    order_id       INT NOT NULL,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    amount         DECIMAL(10,2) NOT NULL,
    method         ENUM('CREDIT_CARD','DEBIT_CARD','PAYPAL','BANK_TRANSFER') DEFAULT 'CREDIT_CARD',
    status         ENUM('COMPLETED','FAILED','PENDING','REFUNDED') DEFAULT 'PENDING',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Shipments ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipments (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    order_id          INT NOT NULL,
    tracking_number   VARCHAR(50) UNIQUE NOT NULL,
    carrier           VARCHAR(50),
    status            ENUM('PROCESSING','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED') DEFAULT 'PROCESSING',
    address           VARCHAR(255),
    city              VARCHAR(100),
    country           VARCHAR(100),
    postal_code       VARCHAR(20),
    estimated_delivery DATE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── Notifications ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    type       VARCHAR(50) NOT NULL,
    recipient  VARCHAR(255) NOT NULL,
    subject    VARCHAR(255),
    message    TEXT NOT NULL,
    status     ENUM('SENT','FAILED','PENDING') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
