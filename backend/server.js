require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 8081;

/* ================= DATABASE CONNECTION ================= */
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "auth_db",
});

/* ================= AUTOMATIC TABLE / COLUMN CHECK ================= */
const initDatabase = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
         id INT AUTO_INCREMENT PRIMARY KEY,
         email VARCHAR(100) UNIQUE,
         password VARCHAR(255),
         phone VARCHAR(20),
         name VARCHAR(40),
         type ENUM('admin','customer') DEFAULT 'customer',
         status ENUM('active','inactive') DEFAULT 'active'
      )
    `);

    console.log("Users table ready");

    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS status ENUM('active','inactive') DEFAULT 'active'
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS receivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        number VARCHAR(20) NOT NULL,
        account_type ENUM('bkash','nagad','rocket') NOT NULL,
        status ENUM('active','inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Receivers table ready");
     await db.query(`
      CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    customer_id INT NULL,
    receiver_id INT NULL,

    amount DECIMAL(10,2) NOT NULL,

    tnx_id VARCHAR(100) NULL,

    tnx_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    status ENUM('pending','success','failed') DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (receiver_id) REFERENCES receivers(id) ON DELETE SET NULL
);
    `);

    console.log("Transactions table ready");
  
  }
   catch (err) {
    console.error("DB initialization error:", err);
  }
};

initDatabase();

/* ================= MIDDLEWARE ================= */
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ================= AUTH MIDDLEWARE ================= */
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key"
    );

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

/* ================= REGISTER ================= */
app.post("/auth/register", async (req, res) => {
  const { email, password, phone, name } = req.body;

  if (!email || !password || !phone || !name) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
    return res
      .status(400)
      .json({ error: "Password must contain upper and lower case letters" });
  }

  if (!/^\+?\d{10,15}$/.test(phone)) {
    return res.status(400).json({ error: "Invalid phone number" });
  }

  try {
    const [existing] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0)
      return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (email, password, phone, name,type,status) VALUES (?, ?, ?, ?,?,?)",
      [email, hashedPassword, phone, name, "customer", "active"]
    );

    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= LOGIN ================= */
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "All fields required" });

  try {
    // 1. Check if user exists
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0)
      return res.status(400).json({ error: "User not found" });

    const user = rows[0];

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Invalid password" });

    // 3. Generate JWT token including role
    const token = jwt.sign(
      { id: user.id, email: user.email, type: user.type }, // type is the role
      process.env.JWT_SECRET || "your_secret_key",
      { expiresIn: "1d" }
    );

    // 4. Set cookie for authentication
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // 5. Return user info including role to frontend
    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.type 
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= LOGOUT ================= */
app.post("/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

/* ================= PROTECTED PROFILE ================= */
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, email, phone FROM users WHERE id = ?",
      [req.user.id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= TEST ROUTE ================= */
app.get("/", (req, res) => {
  res.send("Server is running on port " + PORT);
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/* ================= GET ALL CUSTOMERS ================= */
app.get("/auth/customers", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, phone, status, type FROM users WHERE type = 'customer'"
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= DELETE CUSTOMER ================= */
app.delete("/auth/customer/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= UPDATE CUSTOMER ================= */
app.patch("/auth/customer/:id", async (req, res) => {
  const { id } = req.params;
  const { name, status, phone } = req.body;

  try {
    await db.query(
      "UPDATE users SET name=?,status=?, phone=? WHERE id=?",
      [name, status, phone, id]
    );

    res.json({ message: "Customer updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= GET ALL RECEIVERS ================= */
app.get("/auth/receivers", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, number, account_type, status, created_at FROM receivers"
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= ADD RECEIVER ================= */
app.post("/auth/receiver", async (req, res) => {
  const { name, number, account_type, status } = req.body;

  try {
    await db.query(
      "INSERT INTO receivers (name, number, account_type, status) VALUES (?, ?, ?, ?)",
      [name, number, account_type, status || "active"]
    );

    res.json({ message: "Receiver added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= UPDATE RECEIVER ================= */
app.patch("/auth/receiver/:id", async (req, res) => {
  const { id } = req.params;
  const { name, number, account_type, status } = req.body;

  try {
    await db.query(
      "UPDATE receivers SET name=?, number=?, account_type=?, status=? WHERE id=?",
      [name, number, account_type, status, id]
    );

    res.json({ message: "Receiver updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= DELETE RECEIVER ================= */
app.delete("/auth/receiver/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM receivers WHERE id = ?", [id]);

    res.json({ message: "Receiver deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/auth/transactions", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM transactions ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
/* ================= CREATE TRANSACTION ================= */
app.post("/auth/transaction", async (req, res) => {
  let { customer_id, receiver_id, account_type, amount } = req.body;

  if (!customer_id || !receiver_id || !account_type || !amount) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const tnx_id = "TNX" + Date.now();

    // Convert IDs to numbers
    customer_id = parseInt(customer_id);
    receiver_id = parseInt(receiver_id);

    const [result] = await db.query(
      `INSERT INTO transactions 
       (customer_id, receiver_id, account_type, amount, tnx_id, status, tnx_time)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, receiver_id, account_type, amount, tnx_id, "pending", new Date()]
    );

    res.json({ message: "Transaction created successfully", id: result.insertId });
  } catch (err) {
    console.error("Transaction creation error:", err);
    res.status(500).json({ error: "Server error" });
  }
});