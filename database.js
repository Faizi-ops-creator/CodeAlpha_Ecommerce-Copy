
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Database file project ke main folder mein banegi
const db = new sqlite3.Database(
    path.join(__dirname, "store.db"),
    (err) => {
        if (err) {
            console.error("Database connection failed:", err.message);
        } else {
            console.log("SQLite database connected!");
        }
    }
);

// Database tables create karna
db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            image TEXT,
            description TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            total REAL NOT NULL,
            order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    `);

    // Sample products insert karna
    const products = [
        ["Wireless Headphones", 2500, "https://placehold.co/300x200?text=Headphones", "Wireless headphones"],
        ["Smart Watch", 4500, "https://placehold.co/300x200?text=Smart+Watch", "Smart watch"],
        ["Running Shoes", 3500, "https://placehold.co/300x200?text=Shoes", "Comfortable running shoes"],
        ["Laptop Backpack", 1800, "https://placehold.co/300x200?text=Backpack", "Laptop backpack"],
        ["Bluetooth Speaker", 2200, "https://placehold.co/300x200?text=Speaker", "Portable speaker"],
        ["Mobile Phone", 25000, "https://placehold.co/300x200?text=Mobile", "Smart mobile phone"]
    ];

    const insert = db.prepare(`
        INSERT INTO products (name, price, image, description)
        SELECT ?, ?, ?, ?
        WHERE NOT EXISTS (
            SELECT 1 FROM products WHERE name = ?
        )
    `);

    products.forEach((product) => {
        insert.run([...product, product[0]]);
    });

    insert.finalize();
});

module.exports = db;
