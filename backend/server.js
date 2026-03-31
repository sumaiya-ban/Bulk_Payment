require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const mysql = require("mysql2/promise");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "yourrealemail@gmail.com",
    pass: "abcd efgh ijkl mnop",
  },
  
});
const profileDir = path.join(__dirname, "uploads/profiles");
if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profileDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const uploadProfile = multer({ storage: profileStorage });

// temporary OTP store (use DB in production)
const otpStore = {};
const app = express();
const PORT = process.env.PORT || 8081;

// ================= UPLOADS FOLDER =================
const uploadDir = path.join(__dirname, "uploads/kyc");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ================= DATABASE CONNECTION =================
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "auth_db",
});

// ================= INIT DATABASE / TABLES =================
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
await db.query(`
  ALTER TABLE users
  ADD COLUMN present_address VARCHAR(255),
  ADD COLUMN country VARCHAR(100),
  ADD COLUMN image VARCHAR(255),
  ADD COLUMN occupation VARCHAR(100)
`);
    await db.query(`
      CREATE TABLE IF NOT EXISTS kycVerification (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        nationality VARCHAR(50) NOT NULL,
        document_type ENUM('nid','passport','driving_license') NOT NULL,
        document_number VARCHAR(50) NOT NULL,
        front_image VARCHAR(255) NOT NULL,
        back_image VARCHAR(255) NOT NULL,
        status ENUM('pending','approved','rejected') DEFAULT 'pending',
        verified_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
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

    await db.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NULL,
        receiver_id INT NULL,
        account_type ENUM('bkash','nagad','rocket') NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        tnx_id VARCHAR(100) NULL,
        tnx_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('pending','send','failed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Database initialized successfully");
  } catch (err) {
    console.error("DB initialization error:", err);
  }
};

initDatabase();

// ================= MIDDLEWARE =================
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads/kyc", express.static(uploadDir)); // serve uploaded images

// ================= AUTH MIDDLEWARE =================
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ================= MULTER SETUP =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ================= AUTH ROUTES =================
app.post("/auth/register", async (req, res) => {
  const { email, password, phone, name } = req.body;
  if (!email || !password || !phone || !name) return res.status(400).json({ error: "All fields are required" });

  if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: "Invalid email format" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) return res.status(400).json({ error: "Password must contain upper and lower case letters" });
  if (!/^\+?\d{10,15}$/.test(phone)) return res.status(400).json({ error: "Invalid phone number" });

  try {
    const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query("INSERT INTO users (email, password, phone, name,type,status) VALUES (?, ?, ?, ?, ?, ?)", [email, hashedPassword, phone, name, "customer", "active"]);

    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "All fields required" });

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(400).json({ error: "User not found" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id, email: user.email, type: user.type }, process.env.JWT_SECRET || "your_secret_key", { expiresIn: "1d" });
    res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "strict", maxAge: 24*60*60*1000 });

    res.json({ message: "Login successful", user: { id: user.id, name: user.name, email: user.email, role: user.type } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

// ================= PROFILE =================
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, email, phone, name FROM users WHERE id = ?", [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= KYC ROUTE =================
app.post("/auth/kyc", authMiddleware, upload.fields([
  { name: "front_image", maxCount: 1 },
  { name: "back_image", maxCount: 1 },
]), async (req, res) => {
  try {
    const { nationality, document_type, document_number } = req.body;

    if (!req.files.front_image || !req.files.back_image) return res.status(400).json({ error: "Both front and back images are required" });

    const front = req.files.front_image[0].filename;
    const back = req.files.back_image[0].filename;

    await db.query(
      `INSERT INTO kycVerification (user_id, nationality, document_type, document_number, front_image, back_image)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, nationality, document_type, document_number, front, back]
    );

    res.json({ message: "KYC submitted successfully" });
  } catch (err) {
    console.error("KYC submit error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= OTHER ROUTES =================
app.get("/auth/customers", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, name, email, phone, status, type FROM users WHERE type='customer'");
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});
app.delete("/auth/customer/:id", async (req, res) => {
  const { id } = req.params;
  try { await db.query("DELETE FROM users WHERE id=?", [id]); res.json({ message: "Customer deleted successfully" }); }
  catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});
app.patch("/auth/customer/:id", uploadProfile.single("image"), async (req, res) => {
  const { id } = req.params;

  const {
    name,
    phone,
    present_address,
    country,
    occupation
  } = req.body;

  const image = req.file ? req.file.filename : null;

  try {
    await db.query(
      `UPDATE users 
       SET name=?, phone=?, present_address=?, country=?, occupation=?, image=IFNULL(?, image)
       WHERE id=?`,
      [name, phone, present_address, country, occupation, image, id]
    );

   res.json({
  message: "Customer updated successfully",
  image: image 
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Receivers
app.get("/auth/receivers", async (req,res)=>{try{const [rows]=await db.query("SELECT * FROM receivers"); res.json(rows);}catch(err){console.error(err);res.status(500).json({error:"Server error"});}});
app.post("/auth/receiver", async(req,res)=>{const {name,number,account_type,status}=req.body; try{await db.query("INSERT INTO receivers (name,number,account_type,status) VALUES (?,?,?,?)",[name,number,account_type,status||"active"]);res.json({message:"Receiver added successfully"});}catch(err){console.error(err);res.status(500).json({error:"Server error"});}});
app.patch("/auth/receiver/:id", async(req,res)=>{const {id}=req.params; const {name,number,account_type,status}=req.body; try{await db.query("UPDATE receivers SET name=?,number=?,account_type=?,status=? WHERE id=?",[name,number,account_type,status,id]);res.json({message:"Receiver updated successfully"});}catch(err){console.error(err);res.status(500).json({error:"Server error"});}});
app.delete("/auth/receiver/:id", async(req,res)=>{const {id}=req.params; try{await db.query("DELETE FROM receivers WHERE id=?",[id]);res.json({message:"Receiver deleted successfully"});}catch(err){console.error(err);res.status(500).json({error:"Server error"});}});

// Transactions
app.get("/auth/transactions", async(req,res)=>{try{const [rows]=await db.query(`SELECT t.*, u.name AS customer_name, r.name AS receiver_name, r.number AS receiver_number FROM transactions t LEFT JOIN users u ON t.customer_id=u.id LEFT JOIN receivers r ON t.receiver_id=r.id ORDER BY t.id DESC`);res.json(rows);}catch(err){console.error(err);res.status(500).json({error:"Server error"});}});
app.get("/auth/transactions/:userId", async(req,res)=>{const {userId}=req.params; const [rows]=await db.query(`SELECT t.*, u.name AS customer_name, r.name AS receiver_name, r.number AS receiver_number FROM transactions t LEFT JOIN users u ON t.customer_id=u.id LEFT JOIN receivers r ON t.receiver_id=r.id WHERE t.customer_id=? ORDER BY t.id DESC`,[userId]);res.json(rows);});
app.patch("/auth/transaction/:id", async(req,res)=>{const {id}=req.params; const {status}=req.body; try{let tnx_id=null; if(status==="send"){tnx_id="TNX"+Date.now();} await db.query("UPDATE transactions SET status=?, tnx_id=? WHERE id=?",[status,tnx_id,id]);res.json({message:"Transaction updated successfully"});}catch(err){console.error(err);res.status(500).json({error:"Server error"});}});

// ================= TEST ROUTE =================
app.get("/", (req,res)=>{res.send("Server is running on port "+PORT);});

// ================= START SERVER =================
app.listen(PORT, ()=>{console.log(`Server running on port ${PORT}`);});
// Get KYC by user
app.get("/auth/kyc/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT * FROM kycVerification WHERE user_id = ? ORDER BY id DESC LIMIT 1",
      [userId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
// Create a new transaction
app.post("/auth/transaction", async (req, res) => {
  const { customer_id, receiver_id, new_receiver, account_type, amount } = req.body;

  if (!customer_id || !account_type || !amount || (!receiver_id && !new_receiver)) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    let receiverId = receiver_id;

    // If it's a new receiver, insert it into receivers table
    if (!receiver_id && new_receiver) {
      const [result] = await db.query(
        "INSERT INTO receivers (name, number, account_type, status) VALUES (?, ?, ?, ?)",
        [new_receiver, new_receiver, account_type, "active"]
      );
      receiverId = result.insertId;
    }

    // Insert transaction
    const [tx] = await db.query(
      "INSERT INTO transactions (customer_id, receiver_id, account_type, amount, status) VALUES (?, ?, ?, ?, ?)",
      [customer_id, receiverId, account_type, amount, "pending"]
    );

    res.json({ message: "Transaction created successfully", transactionId: tx.insertId });
  } catch (err) {
    console.error("Transaction creation error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/auth/send-otp", async (req, res) => {
  const { email } = req.body;

  console.log("Sending OTP to:", email);

  if (!email) return res.status(400).json({ error: "Email required" });

  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[email] = otp;

  try {
    await transporter.sendMail({
      from: "yourrealemail@gmail.com", // ✅ SAME as auth.user
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`,
    });

    console.log("OTP SENT:", otp);

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("MAIL ERROR:", err); // 👈 CHECK THIS
    res.status(500).json({ error: "OTP send failed" });
  }
});
app.post("/auth/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword)
    return res.status(400).json({ error: "All fields required" });

  try {
    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query("UPDATE users SET password=? WHERE email=?", [
      hashed,
      email,
    ]);

    delete otpStore[email]; // clear OTP

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/auth/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!otpStore[email]) {
    return res.status(400).json({ error: "OTP not found" });
  }

  if (Number(otpStore[email]) !== Number(otp)) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  res.json({ message: "OTP verified successfully" });
});
