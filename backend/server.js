const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const mysql = require("mysql2/promise");
const multer = require("multer");
const fs = require("fs");
const nodemailer = require("nodemailer");
const mailUser = process.env.GMAIL_USER || process.env.EMAIL_USER || "yourrealemail@gmail.com";
const mailPass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS || "abcd efgh ijkl mnop";
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: mailUser,
    pass: mailPass,
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
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const app = express();
const PORT = process.env.PORT || 8081;

// ================= UPLOADS FOLDER =================
const uploadDir = path.join(__dirname, "uploads/kyc");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const DB_NAME = "auth_db";

// ================= DATABASE CONNECTION =================
let db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: DB_NAME,
});

// ================= INIT DATABASE / TABLES =================
const ensureColumn = async (tableName, columnName, definition) => {
  const [rows] = await db.query(
    `
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [DB_NAME, tableName, columnName]
  );

  if (rows.length === 0) {
    await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
};

const ensureNotificationsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      transaction_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);
};

const ensureAppSettingsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      setting_key VARCHAR(100) NOT NULL UNIQUE,
      setting_label VARCHAR(255) NOT NULL,
      setting_value VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  const defaults = [
    ["transaction_round_limitation", "Transaction Round Limitation", "10"],
    ["money_limitation", "Money Limitation", "10000"],
    ["total_money_limitation", "Total Money Limitation", "100000"],
  ];

  for (const [settingKey, settingLabel, settingValue] of defaults) {
    await db.query(
      `
        INSERT INTO app_settings (setting_key, setting_label, setting_value)
        SELECT ?, ?, ?
        FROM DUAL
        WHERE NOT EXISTS (
          SELECT 1
          FROM app_settings
          WHERE setting_key = ?
        )
      `,
      [settingKey, settingLabel, settingValue, settingKey]
    );
  }
};

const ensureTransactionStatusColumn = async () => {
  await db.query(`
    ALTER TABLE transactions
    MODIFY COLUMN status ENUM('pending','send','failed') DEFAULT 'pending'
  `);
};

const normalizeTransactionStatus = (status) => {
  if (status === "success") {
    return "send";
  }

  return status;
};

const initDatabase = async () => {
  try {
    const serverConnection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
    });

    await serverConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await serverConnection.end();

    await db.end();
    db = mysql.createPool({
      host: "localhost",
      user: "root",
      password: "",
      database: DB_NAME,
    });

    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        phone VARCHAR(20),
        name VARCHAR(40),
        type ENUM('admin','customer') DEFAULT 'customer',
        status ENUM('active','inactive') DEFAULT 'active'
      ) ENGINE=InnoDB;
    `);

    await ensureColumn("users", "present_address", "VARCHAR(255)");
    await ensureColumn("users", "country", "VARCHAR(100)");
    await ensureColumn("users", "image", "VARCHAR(255)");
    await ensureColumn("users", "occupation", "VARCHAR(100)");

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
      ) ENGINE=InnoDB;
    `);
    await ensureColumn("kycVerification", "notes", "VARCHAR(255) NULL");

    await db.query(`
      CREATE TABLE IF NOT EXISTS receivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        number VARCHAR(20) NOT NULL,
        account_type ENUM('bkash','nagad','rocket') NOT NULL,
        status ENUM('active','inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NULL,
        receiver_id INT NULL,
        account_type ENUM('bkash','nagad','rocket') NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        notes VARCHAR(255) NULL,
        tnx_id VARCHAR(100) NULL,
        tnx_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('pending','send','success','failed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await ensureColumn("transactions", "notes", "VARCHAR(255) NULL");
    await ensureTransactionStatusColumn();

    await ensureNotificationsTable();
    await ensureAppSettingsTable();
    await ensureTransactionNotificationTrigger();

    console.log("Database initialized with InnoDB");
  } catch (err) {
    console.error("DB initialization error:", err);
  }
};

initDatabase();

const ensureTransactionNotificationTrigger = async () => {
  await ensureNotificationsTable();
  await db.query("DROP TRIGGER IF EXISTS after_transaction_status_notification");
  await db.query(`
    CREATE TRIGGER after_transaction_status_notification
    AFTER UPDATE ON transactions
    FOR EACH ROW
    BEGIN
      IF OLD.status = 'pending'
         AND NEW.status IN ('send', 'success', 'failed')
         AND NEW.customer_id IS NOT NULL
         AND OLD.status <> NEW.status THEN
        INSERT INTO notifications (user_id, transaction_id, title, message)
        SELECT
          NEW.customer_id,
          NEW.id,
          CASE
            WHEN NEW.status IN ('send', 'success') THEN 'Transaction sent successfully'
            ELSE 'Transaction failed'
          END,
          CASE
            WHEN NEW.status IN ('send', 'success') THEN CONCAT(
              'Your transaction to ',
              COALESCE((SELECT name FROM receivers WHERE id = NEW.receiver_id LIMIT 1), 'the receiver'),
              ' for ',
              FORMAT(NEW.amount, 2),
              ' has been sent successfully.'
            )
            ELSE CONCAT(
              'Your transaction to ',
              COALESCE((SELECT name FROM receivers WHERE id = NEW.receiver_id LIMIT 1), 'the receiver'),
              ' for ',
              FORMAT(NEW.amount, 2),
              ' has failed.'
            )
          END
        FROM DUAL
        WHERE NOT EXISTS (
          SELECT 1
          FROM notifications
          WHERE user_id = NEW.customer_id
            AND transaction_id = NEW.id
            AND title = CASE
              WHEN NEW.status IN ('send', 'success') THEN 'Transaction sent successfully'
              ELSE 'Transaction failed'
            END
        );
      END IF;
    END
  `);
};

const syncNotificationsForUser = async (userId) => {
  await ensureNotificationsTable();

  const [transactions] = await db.query(
    `
      SELECT
        t.id,
        t.customer_id,
        t.status,
        t.amount,
        r.name AS receiver_name
      FROM transactions t
      LEFT JOIN receivers r ON t.receiver_id = r.id
      WHERE t.customer_id = ?
        AND t.status IN ('send', 'success', 'failed')
    `,
    [userId]
  );

  for (const tx of transactions) {
    const title =
      normalizeTransactionStatus(tx.status) === "send"
        ? "Transaction sent successfully"
        : "Transaction failed";
    const message =
      normalizeTransactionStatus(tx.status) === "send"
        ? `Your transaction to ${tx.receiver_name || "the receiver"} for ${Number(tx.amount).toFixed(2)} has been sent successfully.`
        : `Your transaction to ${tx.receiver_name || "the receiver"} for ${Number(tx.amount).toFixed(2)} has failed.`;

    await db.query(
      `
        INSERT INTO notifications (user_id, transaction_id, title, message)
        SELECT ?, ?, ?, ?
        FROM DUAL
        WHERE NOT EXISTS (
          SELECT 1
          FROM notifications
          WHERE user_id = ?
            AND transaction_id = ?
            AND title = ?
        )
      `,
      [userId, tx.id, title, message, userId, tx.id, title]
    );
  }
};

const syncNotificationForTransaction = async (transactionId) => {
  await ensureNotificationsTable();

  const [rows] = await db.query(
    `
      SELECT
        t.id,
        t.customer_id,
        t.status,
        t.amount,
        r.name AS receiver_name
      FROM transactions t
      LEFT JOIN receivers r ON t.receiver_id = r.id
      WHERE t.id = ?
      LIMIT 1
    `,
    [transactionId]
  );

  if (rows.length === 0) {
    return;
  }

  const tx = rows[0];
  const normalizedStatus = normalizeTransactionStatus(tx.status);

  if (!tx.customer_id || !["send", "failed"].includes(normalizedStatus)) {
    return;
  }

  const title =
    normalizedStatus === "send"
      ? "Transaction sent successfully"
      : "Transaction failed";
  const message =
    normalizedStatus === "send"
      ? `Your transaction to ${tx.receiver_name || "the receiver"} for ${Number(tx.amount).toFixed(2)} has been sent successfully.`
      : `Your transaction to ${tx.receiver_name || "the receiver"} for ${Number(tx.amount).toFixed(2)} has failed.`;

  await db.query(
    `
      INSERT INTO notifications (user_id, transaction_id, title, message)
      SELECT ?, ?, ?, ?
      FROM DUAL
      WHERE NOT EXISTS (
        SELECT 1
        FROM notifications
        WHERE user_id = ?
          AND transaction_id = ?
          AND title = ?
      )
    `,
    [tx.customer_id, tx.id, title, message, tx.customer_id, tx.id, title]
  );
};

const createNotificationForStatusChange = async (transaction, nextStatus) => {
  const normalizedStatus = normalizeTransactionStatus(nextStatus);

  if (
    !transaction?.customer_id ||
    transaction.status !== "pending" ||
    !["send", "failed"].includes(normalizedStatus)
  ) {
    return;
  }

  const title =
    normalizedStatus === "send"
      ? "Transaction sent successfully"
      : "Transaction failed";
  const message =
    normalizedStatus === "send"
      ? `Your transaction to ${transaction.receiver_name || "the receiver"} for ${Number(transaction.amount).toFixed(2)} has been sent successfully.`
      : `Your transaction to ${transaction.receiver_name || "the receiver"} for ${Number(transaction.amount).toFixed(2)} has failed.`;

  await db.query(
    `
      INSERT INTO notifications (user_id, transaction_id, title, message)
      SELECT ?, ?, ?, ?
      FROM DUAL
      WHERE NOT EXISTS (
        SELECT 1
        FROM notifications
        WHERE user_id = ?
          AND transaction_id = ?
          AND title = ?
      )
    `,
    [
      transaction.customer_id,
      transaction.id,
      title,
      message,
      transaction.customer_id,
      transaction.id,
      title,
    ]
  );
};

const sendTransactionStatusEmail = async (transaction, nextStatus) => {
  const normalizedStatus = normalizeTransactionStatus(nextStatus);

  if (
    !transaction?.customer_email ||
    transaction.status !== "pending" ||
    !["send", "failed"].includes(normalizedStatus)
  ) {
    return;
  }

  const statusLabel = normalizedStatus === "send" ? "Sent" : "Failed";
  const subject =
    normalizedStatus === "send"
      ? "Bulk Payment Transaction Sent"
      : "Bulk Payment Transaction Failed";

  const notesText = transaction.notes?.trim() ? transaction.notes : "N/A";
  const receiverName = transaction.receiver_name || "N/A";
  const receiverNumber = transaction.receiver_number || "N/A";
  const accountType = transaction.account_type || "N/A";
  const amount = Number(transaction.amount || 0).toFixed(2);
  const transactionCode = transaction.tnx_id || `TNX${transaction.id}`;

  await transporter.sendMail({
    from: mailUser,
    to: transaction.customer_email,
    subject,
    text: [
      `Hello ${transaction.customer_name || "Customer"},`,
      "",
      `Your transaction status is now: ${statusLabel}`,
      `Transaction ID: ${transactionCode}`,
      // `Database ID: ${transaction.id}`,
      `Receiver Name: ${receiverName}`,
      `Receiver Number: ${receiverNumber}`,
      `Account Type: ${accountType}`,
      `Amount: ${amount}`,
      `Status: ${normalizedStatus}`,
      `Notes: ${notesText}`,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>${subject}</h2>
        <p>Hello ${transaction.customer_name || "Customer"},</p>
        <p>Your transaction status is now <strong>${statusLabel}</strong>.</p>
        <table style="border-collapse: collapse;">
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Transaction ID</strong></td><td>${transactionCode}</td></tr>
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Database ID</strong></td><td>${transaction.id}</td></tr>
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Receiver Name</strong></td><td>${receiverName}</td></tr>
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Receiver Number</strong></td><td>${receiverNumber}</td></tr>
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Account Type</strong></td><td>${accountType}</td></tr>
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Amount</strong></td><td>${amount}</td></tr>
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Status</strong></td><td>${normalizedStatus}</td></tr>
          <tr><td style="padding: 6px 12px 6px 0;"><strong>Notes</strong></td><td>${notesText}</td></tr>
        </table>
      </div>
    `,
  });
};

const getStaticNotifications = (userId) => [
  {
    id: `static-${userId}-1`,
    user_id: Number(userId),
    transaction_id: null,
    title: "Welcome to Bulk Payment",
    message: "Your notifications are temporarily running in static mode while database setup is being completed.",
    is_read: 0,
    transaction_status: null,
    tnx_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: `static-${userId}-2`,
    user_id: Number(userId),
    transaction_id: null,
    title: "Test notification",
    message: "This is a temporary static notification for the dashboard bell.",
    is_read: 1,
    transaction_status: null,
    tnx_id: null,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

// ================= MIDDLEWARE =================
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads/kyc", express.static(uploadDir)); // serve uploaded images
app.use("/uploads/profiles", express.static(profileDir));

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

const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

const clearExpiredOtp = (email) => {
  const savedOtp = otpStore[email];

  if (savedOtp && savedOtp.expiresAt < Date.now()) {
    delete otpStore[email];
    return null;
  }

  return savedOtp || null;
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

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        occupation: user.occupation,
        present_address: user.present_address,
        country: user.country,
        image: user.image,
        role: user.type,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

app.post("/auth/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const [rows] = await db.query("SELECT id, email FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    if (
      mailUser === "yourrealemail@gmail.com" ||
      mailPass === "abcd efgh ijkl mnop"
    ) {
      return res.status(500).json({
        error: "Email service is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to backend/.env, then restart the backend server.",
      });
    }

    const otp = generateOtp();
    otpStore[email] = {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      verified: false,
    };

    await transporter.sendMail({
      from: mailUser,
      to: email,
      subject: "Your Bulk Payment OTP Code",
      text: `Your 4-digit OTP is ${otp}. It will expire in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Bulk Payment OTP</h2>
          <p>Your 4-digit OTP is:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `,
    });

    res.json({ message: "4-digit OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP error:", err);
    const smtpHint =
      err?.code === "EAUTH"
        ? "Gmail authentication failed. Check GMAIL_USER and GMAIL_APP_PASSWORD."
        : err?.code === "EINVAL"
        ? "Email transport configuration is invalid."
        : err?.responseCode === 535
        ? "Gmail rejected the login. Use a valid Gmail App Password."
        : err?.message || "Failed to send OTP email";

    res.status(500).json({ error: smtpHint });
  }
});

app.post("/auth/verify-otp", async (req, res) => {
  const { email, otp, purpose } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    const savedOtp = clearExpiredOtp(email);

    if (!savedOtp) {
      return res.status(400).json({ error: "OTP expired or not found" });
    }

    if (savedOtp.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    otpStore[email].verified = true;

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];

    if (purpose === "login") {
      delete otpStore[email];

      const token = jwt.sign(
        { id: user.id, email: user.email, type: user.type },
        process.env.JWT_SECRET || "your_secret_key",
        { expiresIn: "1d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.json({
        message: "OTP verified and login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          occupation: user.occupation,
          present_address: user.present_address,
          country: user.country,
          image: user.image,
          role: user.type,
        },
      });
    }

    res.json({ message: "OTP matched successfully" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/auth/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: "Email and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const savedOtp = clearExpiredOtp(email);

    if (!savedOtp?.verified) {
      return res.status(400).json({ error: "Verify OTP before resetting password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [result] = await db.query("UPDATE users SET password = ? WHERE email = ?", [
      hashedPassword,
      email,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    delete otpStore[email];
    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= PROFILE =================
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, email, phone, name, type, present_address, country, image, occupation
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({
      user: {
        ...rows[0],
        role: rows[0].type,
      },
    });
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

app.put("/auth/kyc/update", authMiddleware, upload.fields([
  { name: "front_image", maxCount: 1 },
  { name: "back_image", maxCount: 1 },
]), async (req, res) => {
  try {
    const { nationality, document_type, document_number } = req.body;

    const [existingRows] = await db.query(
      `SELECT id, front_image, back_image
       FROM kycVerification
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ error: "KYC record not found" });
    }

    const existing = existingRows[0];
    const frontImage = req.files?.front_image?.[0]?.filename || existing.front_image;
    const backImage = req.files?.back_image?.[0]?.filename || existing.back_image;

    await db.query(
      `UPDATE kycVerification
       SET nationality = ?,
           document_type = ?,
           document_number = ?,
           front_image = ?,
           back_image = ?,
           status = 'pending',
           notes = NULL,
           verified_at = NULL
       WHERE id = ?`,
      [
        nationality,
        document_type,
        document_number,
        frontImage,
        backImage,
        existing.id,
      ]
    );

    const [rows] = await db.query(
      `SELECT *
       FROM kycVerification
       WHERE id = ?`,
      [existing.id]
    );

    res.json({
      message: "KYC updated successfully",
      record: rows[0] || null,
    });
  } catch (err) {
    console.error("KYC update submit error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/auth/kyc", authMiddleware, async (req, res) => {
  try {
    if (req.user.type !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const [rows] = await db.query(
      `SELECT
         k.id,
         k.user_id,
         u.name,
         u.email,
         u.phone,
         k.nationality,
         k.document_type,
         k.document_number,
         k.front_image,
         k.back_image,
         k.notes,
         k.status,
         k.created_at,
         k.verified_at
       FROM kycVerification k
       LEFT JOIN users u ON u.id = k.user_id
       ORDER BY k.created_at DESC, k.id DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error("KYC list error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.patch("/auth/kyc/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.type !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid KYC status" });
    }

    await db.query(
      `UPDATE kycVerification
       SET status = ?, notes = ?, verified_at = NOW()
       WHERE id = ?`,
      [status, notes || null, id]
    );

    const [rows] = await db.query(
      `SELECT
         k.id,
         k.user_id,
         u.name,
         u.email,
         u.phone,
         k.nationality,
         k.document_type,
         k.document_number,
         k.front_image,
         k.back_image,
         k.notes,
         k.status,
         k.created_at,
         k.verified_at
       FROM kycVerification k
       LEFT JOIN users u ON u.id = k.user_id
       WHERE k.id = ?`,
      [id]
    );

    res.json({
      message: `KYC ${status} successfully`,
      record: rows[0] || null,
    });
  } catch (err) {
    console.error("KYC update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/auth/settings", authMiddleware, async (req, res) => {
  try {
    await ensureAppSettingsTable();

    const [rows] = await db.query(
      `SELECT id, setting_key, setting_label, setting_value, updated_at
       FROM app_settings
       ORDER BY id ASC`
    );

    res.json(rows);
  } catch (err) {
    console.error("Settings fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.patch("/auth/settings/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.type !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { id } = req.params;
    const { setting_value } = req.body;

    if (setting_value === undefined || setting_value === null || setting_value === "") {
      return res.status(400).json({ error: "Setting value is required" });
    }

    await db.query(
      `UPDATE app_settings
       SET setting_value = ?
       WHERE id = ?`,
      [String(setting_value), id]
    );

    const [rows] = await db.query(
      `SELECT id, setting_key, setting_label, setting_value, updated_at
       FROM app_settings
       WHERE id = ?`,
      [id]
    );

    res.json({
      message: "Setting updated successfully",
      setting: rows[0] || null,
    });
  } catch (err) {
    console.error("Settings update error:", err);
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

    const [rows] = await db.query(
      `SELECT id, name, email, phone, type, present_address, country, occupation, image
       FROM users
       WHERE id = ?`,
      [id]
    );

    res.json({
      message: "Customer updated successfully",
      image,
      user: rows[0]
        ? {
            ...rows[0],
            role: rows[0].type,
          }
        : null,
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
app.patch("/auth/transaction/:id", async(req,res)=>{
  const {id}=req.params;
  const {status}=req.body;
  const normalizedStatus = normalizeTransactionStatus(status);

  try{
    await ensureNotificationsTable();

    const [existingRows] = await db.query(
      `SELECT
         t.*,
         u.email AS customer_email,
         u.name AS customer_name,
         r.name AS receiver_name,
         r.number AS receiver_number
       FROM transactions t
       LEFT JOIN users u ON t.customer_id = u.id
       LEFT JOIN receivers r ON t.receiver_id = r.id
       WHERE t.id = ?`,
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const existingTransaction = existingRows[0];
    let tnx_id = existingTransaction.tnx_id;

    if(normalizedStatus==="send" && !tnx_id){
      tnx_id="TNX"+Date.now();
    }

    if(normalizedStatus==="failed"){
      tnx_id=null;
    }

    await db.query("UPDATE transactions SET status=?, tnx_id=? WHERE id=?",[normalizedStatus,tnx_id,id]);

    if (existingTransaction.customer_id) {
      await createNotificationForStatusChange(existingTransaction, normalizedStatus);
      await sendTransactionStatusEmail(
        {
          ...existingTransaction,
          status: existingTransaction.status,
          tnx_id,
        },
        normalizedStatus
      );
      await syncNotificationForTransaction(id);
      await syncNotificationsForUser(existingTransaction.customer_id);
    }

    res.json({message:"Transaction updated successfully"});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Server error"});
  }
});
app.get("/auth/notifications/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    await ensureNotificationsTable();
    await syncNotificationsForUser(userId);

    const [rows] = await db.query(
      `SELECT n.*, t.status AS transaction_status, t.tnx_id
       FROM notifications n
       LEFT JOIN transactions t ON n.transaction_id = t.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC, n.id DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    if (err.code === "ER_NO_SUCH_TABLE") {
      return res.json(getStaticNotifications(userId));
    }

    res.status(500).json({ error: "Server error" });
  }
});
app.patch("/auth/notifications/:userId/read", async (req, res) => {
  const { userId } = req.params;

  try {
    await ensureNotificationsTable();
    await db.query("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0", [userId]);
    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_NO_SUCH_TABLE") {
      return res.json({ message: "Static notifications acknowledged" });
    }

    res.status(500).json({ error: "Server error" });
  }
});

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
