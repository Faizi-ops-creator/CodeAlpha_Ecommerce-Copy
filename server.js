
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const db = require("./database");

const app = express();

app.use(cors());
app.use(express.json());

// Get all products
app.get("/api/products", (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Products load failed" });
        }
        res.json(rows);
    });
});

// User Registration
app.post("/api/register", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Please fill all fields" });
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: "Password must be at least 6 characters"
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword],
            function(err) {
                if (err) {
                    if (err.message.includes("UNIQUE")) {
                        return res.status(409).json({
                            message: "Email already registered"
                        });
                    }
                    return res.status(500).json({
                        message: "Registration failed"
                    });
                }

                res.status(201).json({
                    message: "Registration successful!",
                    userId: this.lastID
                });
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
});

// User Login
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password required"
        });
    }

    db.get(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, user) => {
            if (err) {
                return res.status(500).json({ message: "Login failed" });
            }

            if (!user) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }

            try {
                const isMatch = await bcrypt.compare(password, user.password);

                if (!isMatch) {
                    return res.status(401).json({
                        message: "Invalid email or password"
                    });
                }

                const token = jwt.sign(
                    { id: user.id, email: user.email },
                    process.env.JWT_SECRET,
                    { expiresIn: "1d" }
                );

                res.json({
                    message: "Login successful!",
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    }
                });
            } catch (error) {
                res.status(500).json({ message: "Login failed" });
            }
        }
    );
});

 // Verify Login Token
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Please login first"
        });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                message: "Invalid or expired token"
            });
        }

        req.user = decoded;
        next();
    });
}


// Place Order API
app.post("/api/orders", verifyToken, async (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            message: "Your cart is empty"
        });
    }

    try {
        let total = 0;
        const orderItems = [];

        // Database se product prices check karna
        for (const item of items) {
            const product = await new Promise((resolve, reject) => {
                db.get(
                    "SELECT id, price FROM products WHERE id = ?",
                    [item.productId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!product || !Number.isInteger(item.quantity) || item.quantity < 1) {
                return res.status(400).json({
                    message: "Invalid product or quantity"
                });
            }

            total += product.price * item.quantity;

            orderItems.push({
                productId: product.id,
                quantity: item.quantity,
                price: product.price
            });
        }

        // Order database mein save karna
        db.run(
            "INSERT INTO orders (user_id, total) VALUES (?, ?)",
            [req.user.id, total],
            function(err) {
                if (err) {
                    return res.status(500).json({
                        message: "Order save failed"
                    });
                }

                const orderId = this.lastID;

                const statement = db.prepare(
                    "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)"
                );

                orderItems.forEach(item => {
                    statement.run(
                        orderId,
                        item.productId,
                        item.quantity,
                        item.price
                    );
                });

                statement.finalize((err) => {
                    if (err) {
                        return res.status(500).json({
                            message: "Order items save failed"
                        });
                    }

                    res.status(201).json({
                        message: "Order placed successfully!",
                        orderId,
                        total
                    });
                });
            }
        );

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong"
        });
    }
});


// Serve frontend
app.use(express.static("public"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
