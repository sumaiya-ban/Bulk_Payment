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
const axios = require("axios");
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
const serviceIconDir = path.join(__dirname, "uploads/services");
if (!fs.existsSync(serviceIconDir)) fs.mkdirSync(serviceIconDir, { recursive: true });
const partnersIconDir = path.join(__dirname, "uploads/partners");
if (!fs.existsSync(partnersIconDir)) fs.mkdirSync(partnersIconDir, { recursive: true });
const heroLogoDir = path.join(__dirname, "uploads/hero");
if (!fs.existsSync(heroLogoDir)) fs.mkdirSync(heroLogoDir, { recursive: true });

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profileDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const uploadProfile = multer({ storage: profileStorage });

const serviceIconStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, serviceIconDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const uploadServiceIcon = multer({ storage: serviceIconStorage });

const partnersIconStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, partnersIconDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const uploadPartnersIcon = multer({ storage: partnersIconStorage });

const heroLogoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, heroLogoDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const uploadHeroLogo = multer({ storage: heroLogoStorage });

// temporary OTP store (use DB in production)
const otpStore = {};
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const app = express();
const PORT = process.env.PORT || 8081;
const FRONTEND_URL = (process.env.FRONTEND_URL).replace(/\/+$/, "");
const BKASH_BASE_URL = (process.env.BKASH_BASE_URL || "https://tokenized.sandbox.bka.sh/v1.2.0-beta").replace(/\/+$/, "");
const BKASH_CALLBACK_URL = process.env.BKASH_CALLBACK_URL || `http://localhost:${PORT}/auth/bkash/callback`;

// ================= UPLOADS FOLDER =================
const uploadDir = path.join(__dirname, "uploads/kyc");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const DB_NAME = "auth_db";

// ================= DATABASE CONNECTION =================
let db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || DB_NAME,
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

    // ✅ NEW CHARGE SETTINGS
  ["transaction_fee_type", "Transaction Fee Type (percent/fixed)", "percent"],
  ["transaction_fee_value", "Transaction Fee Value", "2"],
    ["url", "URL", ""],
    ["api_key", "API Key", ""],
  ["senderid", "Sender ID", ""],
  ["number", "Phone Number", ""],
  ["message", "Message Content", ""],
  ["gmail", "API Gmail",""],
  ["app_password","App Password",""],
  ["otp_type","OTP Type","sms"],
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
const ensureHeroSectionTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS hero_section (
      id INT PRIMARY KEY AUTO_INCREMENT,
      logo VARCHAR(500),
      badge_text VARCHAR(255),
      title VARCHAR(255),
      highlight_text VARCHAR(255),
      description TEXT,

      primary_button_text VARCHAR(100),
      primary_button_link VARCHAR(255),
      secondary_button_text VARCHAR(100),
      secondary_button_link VARCHAR(255),

      stat1_value VARCHAR(50),
      stat1_label VARCHAR(100),
      stat2_value VARCHAR(50),
      stat2_label VARCHAR(100),
      stat3_value VARCHAR(50),
      stat3_label VARCHAR(100),

      card_amount VARCHAR(50),
      card_recipients VARCHAR(100),
      card_status VARCHAR(100),
      card_verified VARCHAR(100)
    )
  `);

  await ensureColumn("hero_section", "logo", "VARCHAR(500)");

  await db.query(`
    INSERT INTO hero_section (id, logo, badge_text, title, highlight_text, description,
      primary_button_text, primary_button_link,
      secondary_button_text, secondary_button_link,
      stat1_value, stat1_label,
      stat2_value, stat2_label,
      stat3_value, stat3_label,
      card_amount, card_recipients, card_status, card_verified)

    SELECT 1,
      '',
      'Trusted by 10,000+ businesses',
      'Send Bulk Payments',
      'Instantly',
      'Process thousands of payments in a single click.',
      'Start Free Trial',
      '#contact',
      'Learn More',
      '#services',
      '$2B+','Processed',
      '150+','Countries',
      '99.9%','Uptime',
      '$48,250.00',
      '1,240 recipients',
      'Processing',
      'Verified'

    WHERE NOT EXISTS (
      SELECT 1 FROM hero_section WHERE id = 1
    )
  `);
};

const ensureServicesSectionTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS services_section (
      id INT PRIMARY KEY AUTO_INCREMENT,
      badge_text VARCHAR(255),
      title VARCHAR(255),
      description TEXT,
      service1_icon VARCHAR(500),
      service1_title VARCHAR(255),
      service1_description TEXT,
      service2_icon VARCHAR(500),
      service2_title VARCHAR(255),
      service2_description TEXT,
      service3_icon VARCHAR(500),
      service3_title VARCHAR(255),
      service3_description TEXT,
      service4_icon VARCHAR(500),
      service4_title VARCHAR(255),
      service4_description TEXT,
      service5_icon VARCHAR(500),
      service5_title VARCHAR(255),
      service5_description TEXT,
      service6_icon VARCHAR(500),
      service6_title VARCHAR(255),
      service6_description TEXT
    ) ENGINE=InnoDB;
  `);

  await Promise.all(
    [1, 2, 3, 4, 5, 6].map((num) =>
      db.query(`ALTER TABLE services_section MODIFY COLUMN service${num}_icon VARCHAR(500)`)
    )
  );

  await db.query(`
    INSERT INTO services_section (
      id, badge_text, title, description,
      service1_icon, service1_title, service1_description,
      service2_icon, service2_title, service2_description,
      service3_icon, service3_title, service3_description,
      service4_icon, service4_title, service4_description,
      service5_icon, service5_title, service5_description,
      service6_icon, service6_title, service6_description
    )
    SELECT 1,
      'Our Services',
      'Everything You Need for Bulk Payments',
      'A complete suite of tools to manage, automate, and scale your payment operations.',
      'CARD', 'Mass Payouts', 'Send payments to thousands of recipients simultaneously with just one upload.',
      'USERS', 'Payroll Processing', 'Automate salary disbursements for your entire workforce effortlessly.',
      'CHART', 'Real-Time Analytics', 'Track every transaction with detailed dashboards and instant reporting.',
      'CLOCK', 'Scheduled Payments', 'Set up recurring payments and schedule future transactions with ease.',
      'SHIELD', 'Fraud Protection', 'Advanced fraud detection keeps every transaction secure.',
      'GLOBE', 'Multi-Currency', 'Pay anyone, anywhere in the world with automatic currency conversion.'
    WHERE NOT EXISTS (SELECT 1 FROM services_section WHERE id = 1)
  `);
};

const ensureTransactionSectionTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS transaction_section (
      id INT PRIMARY KEY AUTO_INCREMENT,
      badge_text VARCHAR(255),
      title VARCHAR(255),
      description TEXT,
      feature1 VARCHAR(255),
      feature2 VARCHAR(255),
      feature3 VARCHAR(255),
      feature4 VARCHAR(255),
      feature5 VARCHAR(255),
      feature6 VARCHAR(255),
      card_title VARCHAR(255),
      card_badge_text VARCHAR(100),
      tx1_name VARCHAR(255),
      tx1_amount VARCHAR(100),
      tx1_status VARCHAR(100),
      tx1_count VARCHAR(100),
      tx2_name VARCHAR(255),
      tx2_amount VARCHAR(100),
      tx2_status VARCHAR(100),
      tx2_count VARCHAR(100),
      tx3_name VARCHAR(255),
      tx3_amount VARCHAR(100),
      tx3_status VARCHAR(100),
      tx3_count VARCHAR(100),
      tx4_name VARCHAR(255),
      tx4_amount VARCHAR(100),
      tx4_status VARCHAR(100),
      tx4_count VARCHAR(100)
    ) ENGINE=InnoDB;
  `);

  await db.query(`
    INSERT INTO transaction_section (
      id, badge_text, title, description,
      feature1, feature2, feature3, feature4, feature5, feature6,
      card_title, card_badge_text,
      tx1_name, tx1_amount, tx1_status, tx1_count,
      tx2_name, tx2_amount, tx2_status, tx2_count,
      tx3_name, tx3_amount, tx3_status, tx3_count,
      tx4_name, tx4_amount, tx4_status, tx4_count
    )
    SELECT 1,
      'Transactions',
      'Seamless Transaction Processing',
      'From a single payment to millions, our platform handles it all. Upload your payment file, review, approve, and watch it happen.',
      'CSV and API batch upload support',
      'Instant settlement to 150+ countries',
      'Real-time transaction tracking',
      'Automatic reconciliation reports',
      'Multi-level approval workflows',
      'Webhook notifications for every event',
      'Recent Transactions',
      'Live',
      'Payroll - March', '$124,500', 'Completed', '320 recipients',
      'Vendor Payments', '$45,230', 'Processing', '48 recipients',
      'Refunds Batch', '$8,920', 'Completed', '156 recipients',
      'Contractor Payout', '$67,100', 'Scheduled', '89 recipients'
    WHERE NOT EXISTS (SELECT 1 FROM transaction_section WHERE id = 1)
  `);
};

const ensurePartnersSectionTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS partners_section (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255),
      partner1_name VARCHAR(100),
      partner1_logo VARCHAR(500),
      partner2_name VARCHAR(100),
      partner2_logo VARCHAR(500),
      partner3_name VARCHAR(100),
      partner3_logo VARCHAR(500),
      partner4_name VARCHAR(100),
      partner4_logo VARCHAR(500),
      partner5_name VARCHAR(100),
      partner5_logo VARCHAR(500),
      partner6_name VARCHAR(100),
      partner6_logo VARCHAR(500)
    ) ENGINE=InnoDB;
  `);

  await ensureColumn("partners_section", "partner4_name", "VARCHAR(100)");
  await ensureColumn("partners_section", "partner4_logo", "VARCHAR(500)");
  await ensureColumn("partners_section", "partner5_name", "VARCHAR(100)");
  await ensureColumn("partners_section", "partner5_logo", "VARCHAR(500)");
  await ensureColumn("partners_section", "partner6_name", "VARCHAR(100)");
  await ensureColumn("partners_section", "partner6_logo", "VARCHAR(500)");

  await db.query(`
    INSERT INTO partners_section (
      id, title,
      partner1_name, partner1_logo,
      partner2_name, partner2_logo,
      partner3_name, partner3_logo
    )
    SELECT 1,
      'Trusted by Industry Leaders',
      'Bkash', 'https://download.logo.wine/logo/BKash/BKash-Logo.wine.png',
      'Nagad', 'https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png',
      'Rocket', 'https://download.logo.wine/logo/Dutch-Bangla_Bank_Rocket/Dutch-Bangla_Bank_Rocket-Logo.wine.png'
    WHERE NOT EXISTS (SELECT 1 FROM partners_section WHERE id = 1)
  `);
};

const ensureFooterSectionTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS footer_section (
      id INT PRIMARY KEY AUTO_INCREMENT,
      brand_text VARCHAR(100),
      description TEXT,
      product_title VARCHAR(100),
      product_link1_label VARCHAR(100),
      product_link1_href VARCHAR(255),
      product_link2_label VARCHAR(100),
      product_link2_href VARCHAR(255),
      product_link3_label VARCHAR(100),
      product_link3_href VARCHAR(255),
      product_link4_label VARCHAR(100),
      product_link4_href VARCHAR(255),
      company_title VARCHAR(100),
      company_link1_label VARCHAR(100),
      company_link1_href VARCHAR(255),
      company_link2_label VARCHAR(100),
      company_link2_href VARCHAR(255),
      company_link3_label VARCHAR(100),
      company_link3_href VARCHAR(255),
      company_link4_label VARCHAR(100),
      company_link4_href VARCHAR(255),
      legal_title VARCHAR(100),
      legal_link1_label VARCHAR(100),
      legal_link1_href VARCHAR(255),
      legal_link2_label VARCHAR(100),
      legal_link2_href VARCHAR(255),
      legal_link3_label VARCHAR(100),
      legal_link3_href VARCHAR(255),
      copyright_text VARCHAR(255)
    ) ENGINE=InnoDB;
  `);

  await db.query(`
    INSERT INTO footer_section (
      id, brand_text, description,
      product_title, product_link1_label, product_link1_href, product_link2_label, product_link2_href,
      product_link3_label, product_link3_href, product_link4_label, product_link4_href,
      company_title, company_link1_label, company_link1_href, company_link2_label, company_link2_href,
      company_link3_label, company_link3_href, company_link4_label, company_link4_href,
      legal_title, legal_link1_label, legal_link1_href, legal_link2_label, legal_link2_href,
      legal_link3_label, legal_link3_href, copyright_text
    )
    SELECT 1,
      'BulkPay',
      'The modern platform for bulk payments. Fast, secure, global.',
      'Product', 'Services', '#services', 'Transactions', '#transaction', 'Pricing', '#', 'API Docs', '#',
      'Company', 'About', '#', 'Partners', '#partners', 'Careers', '#', 'Contact', '#contact',
      'Legal', 'Privacy Policy', '#', 'Terms of Service', '#', 'Compliance', '#',
      'Copyright 2026 BulkPay. All rights reserved.'
    WHERE NOT EXISTS (SELECT 1 FROM footer_section WHERE id = 1)
  `);
};

const ensureLandingCmsTables = async () => {
  await ensureHeroSectionTable();
  await ensureServicesSectionTable();
  await ensureTransactionSectionTable();
  await ensurePartnersSectionTable();
  await ensureFooterSectionTable();
};
const ensureContactsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);
};
const ensureSupportChatTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS support_conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_user_id INT NULL,
      customer_name VARCHAR(100) NOT NULL,
      customer_email VARCHAR(100) NOT NULL,
      status ENUM('open','closed') DEFAULT 'open',
      last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS support_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      conversation_id INT NOT NULL,
      sender_role ENUM('admin','customer') NOT NULL,
      sender_name VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES support_conversations(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);
};
const initDB = async () => {
  try {
    await ensureNotificationsTable();
    await ensureContactsTable();
    await ensureSupportChatTables();
    await ensureAppSettingsTable();
    await ensureLandingCmsTables();

    console.log("✅ Database ready");
  } catch (error) {
    console.error("❌ Error initializing DB:", error);
  }
};

initDB();
// ✅ NEW FUNCTION
const findSupportConversation = async ({ customerUserId, customerEmail, includeClosed = false }) => {
  const filters = [];
  const params = [];

  if (customerUserId) {
    filters.push("customer_user_id = ?");
    params.push(customerUserId);
  } else if (customerEmail) {
    filters.push("customer_email = ?");
    params.push(customerEmail);
  }

  if (filters.length === 0) {
    return null;
  }

  if (!includeClosed) {
    filters.push("status = 'open'");
  }

  const [rows] = await db.query(
    `
      SELECT *
      FROM support_conversations
      WHERE ${filters.join(" AND ")}
      ORDER BY last_message_at DESC, id DESC
      LIMIT 1
    `,
    params
  );

  return rows[0] || null;
};

const createSupportMessage = async ({ conversationId, senderRole, senderName, message }) => {
  const trimmedMessage = String(message || "").trim();

  if (!trimmedMessage) {
    throw new Error("Message is required");
  }

  await db.query(
    `
      INSERT INTO support_messages (conversation_id, sender_role, sender_name, message)
      VALUES (?, ?, ?, ?)
    `,
    [conversationId, senderRole, senderName, trimmedMessage]
  );

  await db.query(
    `
      UPDATE support_conversations
      SET last_message_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [conversationId]
  );
};

const getSettingsByKeys = async (keys = []) => {
  if (!Array.isArray(keys) || keys.length === 0) {
    return {};
  }

  const placeholders = keys.map(() => "?").join(", ");
  const [rows] = await db.query(
    `SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN (${placeholders})`,
    keys
  );

  const result = {};
  rows.forEach((row) => {
    result[row.setting_key] = row.setting_value;
  });

  return result;
};

const getSettingValueByKeys = async (keys = []) => {
  const settings = await getSettingsByKeys(keys);

  for (const key of keys) {
    const value = settings[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return null;
};

const getNumericSettingValue = async (keys = []) => {
  await ensureAppSettingsTable();
  const rawValue = await getSettingValueByKeys(keys);
  const numericValue = Number(rawValue);

  return Number.isFinite(numericValue) ? numericValue : null;
};

const ensureTransactionStatusColumn = async () => {
  await db.query(`
    ALTER TABLE transactions
    MODIFY COLUMN status ENUM('pending','send','success','failed') DEFAULT 'pending'
  `);
};

const ensureUserStatusColumn = async () => {
  await db.query(`
    ALTER TABLE users
    MODIFY COLUMN status ENUM('active','inactive') DEFAULT 'active'
  `);
};

const normalizeTransactionStatus = (status) => {
  if (status === "success") {
    return "send";
  }

  return status;
};

const getBkashConfig = () => {
  const config = {
    baseUrl: BKASH_BASE_URL,
    username: process.env.BKASH_USERNAME || "",
    password: process.env.BKASH_PASSWORD || "",
    appKey: process.env.BKASH_APP_KEY || "",
    appSecret: process.env.BKASH_APP_SECRET || "",
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing bKash configuration: ${missing.join(", ")}`);
  }

  return config;
};

const buildBkashHeaders = ({ token, appKey, extraHeaders = {} }) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(token ? { Authorization: token } : {}),
  ...(appKey ? { "X-App-Key": appKey, "App-Key": appKey } : {}),
  ...extraHeaders,
});

const bkashApiRequest = async (endpoint, { method = "POST", token, body, extraHeaders = {} } = {}) => {
  const { baseUrl, appKey } = getBkashConfig();
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await axios({
      url,
      method,
      headers: buildBkashHeaders({ token, appKey, extraHeaders }),
      data: body,
      responseType: "json",
      timeout: 30000,
    });

    const data = response.data || {};

    if (response.status >= 400 || data.errorCode || (data.statusCode && data.statusCode !== "0000")) {
      const message =
        data.errorMessage ||
        data.statusMessage ||
        `bKash request failed with HTTP ${response.status}`;
      throw new Error(message);
    }

    return data;
  } catch (error) {
    if (error.response && error.response.data) {
      const errData = error.response.data;
      const message =
        errData.errorMessage ||
        errData.statusMessage ||
        errData.error ||
        `bKash request failed with HTTP ${error.response.status}`;
      throw new Error(message);
    }

    throw new Error(error.message || "bKash request failed");
  }
};

const grantBkashToken = async () => {
  const { username, password, appKey, appSecret } = getBkashConfig();

  return bkashApiRequest("/tokenized/checkout/token/grant", {
    extraHeaders: {
      username,
      password,
    },
    body: {
      app_key: appKey,
      app_secret: appSecret,
    },
  });
};

const createBkashPayment = async (token, payload) =>
  bkashApiRequest("/tokenized/checkout/create", {
    token,
    body: payload,
  });

const executeBkashPayment = async (token, paymentID) =>
  bkashApiRequest("/tokenized/checkout/execute", {
    token,
    body: { paymentID },
  });

const queryBkashPayment = async (token, paymentID) =>
  bkashApiRequest("/tokenized/checkout/payment/status", {
    token,
    body: { paymentID },
  });

// SSLCommerz Configuration & Helpers
const SSLCOMMERZ_STORE_ID =
  process.env.SSLCOMMERZ_STORE_ID || "testbox";

const SSLCOMMERZ_STORE_PASSWORD =
  process.env.SSLCOMMERZ_STORE_PASSWORD || "qwerty";

const SSLCOMMERZ_API_URL = (
  process.env.SSLCOMMERZ_API_URL ||
  "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
).replace(/\/+$/, "");

const initiateSSLCommerzPayment = async (transactionData) => {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("[SSLCommerz] PAYMENT INITIATION");
    console.log("=".repeat(60));

    // ✅ SAFE & VALID PAYLOAD
    const payload = {
      store_id: SSLCOMMERZ_STORE_ID,
      store_passwd: SSLCOMMERZ_STORE_PASSWORD,

      total_amount: Number(transactionData.amount) || 10,
      currency: "BDT",

      // ✅ ALWAYS UNIQUE
      tran_id: `TXN-${Date.now()}`,

      success_url: transactionData.successUrl,
      fail_url: transactionData.failUrl || transactionData.successUrl,
      cancel_url: transactionData.cancelUrl,

      // ✅ SAFE FALLBACK VALUES
      cus_name: transactionData.customerName || "Test User",
      cus_email: transactionData.customerEmail || "test@gmail.com",
      cus_phone: transactionData.customerPhone || "01700000000",

      cus_add1: "Dhaka",
      cus_city: "Dhaka",
      cus_state: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",

      shipping_method: "NO",
      product_name: "Transaction Payment",
      product_category: "Payment",
      product_profile: "general",
    };

    console.log("[SSLCommerz] Payload:", {
      ...payload,
      store_passwd: "***HIDDEN***",
    });

    // ✅ CONVERT TO URL-ENCODED
    const formDataString = Object.keys(payload)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(payload[key])}`
      )
      .join("&");

    const response = await axios.post(
      SSLCOMMERZ_API_URL,
      formDataString,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 15000,
      }
    );

    console.log("[SSLCommerz] RESPONSE:", response.data);

    // ✅ FIXED STATUS CHECK (IMPORTANT)
    if (response.data?.status?.toLowerCase() !== "success") {
      const errorDetail =
        response.data?.failedreason ||
        response.data?.reason ||
        JSON.stringify(response.data);

      throw new Error(errorDetail);
    }

    // ✅ EXTRACT PAYMENT URL (VERY IMPORTANT)
// ✅ EXTRACT PAYMENT URL (SAFE VERSION)
const paymentUrl =
  response.data?.GatewayPageURL ||
  response.data?.gatewayPageURL ||
  response.data?.redirectGatewayURL ||
  response.data?.redirect_url ||
  response.data?.gw_page_url ||
  response.data?.url;

console.log("[SSLCommerz] FULL RESPONSE:", response.data);

if (!paymentUrl) {
  throw new Error(
    "No payment URL returned from SSLCommerz. Check store credentials or sandbox mode."
  );
}
    console.log("[SSLCommerz] Redirect URL:", paymentUrl);

    // ✅ RETURN CLEAN RESPONSE
    return {
      success: true,
      paymentUrl,
      fullResponse: response.data,
    };
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("[SSLCommerz] ERROR:");
    console.error(error.response?.data || error.message);
    console.error("=".repeat(60) + "\n");

    throw new Error(
      `Failed to initiate SSLCommerz payment: ${
        error.response?.data?.failedreason ||
        error.message
      }`
    );
  }
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

    await ensureUserStatusColumn();
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
    await ensureColumn("transactions", "fee", "DECIMAL(10,2) NOT NULL DEFAULT 0.00");
    await ensureColumn("transactions", "total_amount", "DECIMAL(10,2) NOT NULL DEFAULT 0.00");
    await ensureTransactionStatusColumn();

    await ensureNotificationsTable();
    await ensureAppSettingsTable();
    await ensureSupportChatTables();
    await ensureLandingCmsTables();
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

const createNotificationForAdminsOnTransactionRequest = async (transactionId) => {
  await ensureNotificationsTable();

  const [transactionRows] = await db.query(
    `
      SELECT
        t.id,
        t.amount,
        t.customer_id,
        u.name AS customer_name,
        r.name AS receiver_name
      FROM transactions t
      LEFT JOIN users u ON t.customer_id = u.id
      LEFT JOIN receivers r ON t.receiver_id = r.id
      WHERE t.id = ?
      LIMIT 1
    `,
    [transactionId]
  );

  if (transactionRows.length === 0) {
    return;
  }

  const transaction = transactionRows[0];
  const [adminRows] = await db.query(
    `
      SELECT id
      FROM users
      WHERE type = 'admin'
        AND status = 'active'
    `
  );

  const title = "New transaction request";
  const message = `${transaction.customer_name || "A customer"} requested a transaction to ${
    transaction.receiver_name || "the receiver"
  } for ${Number(transaction.amount || 0).toFixed(2)}.`;

  for (const admin of adminRows) {
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
      [admin.id, transaction.id, title, message, admin.id, transaction.id, title]
    );
  }
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
app.use("/uploads/services", express.static(serviceIconDir));
app.use("/uploads/partners", express.static(partnersIconDir));
app.use("/uploads/hero", express.static(heroLogoDir));

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

  if (!email || !password || !phone || !name) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
    return res.status(400).json({
      error: "Password must contain upper and lower case letters",
    });
  }

  if (!/^\+?\d{10,15}$/.test(phone)) {
    return res.status(400).json({ error: "Invalid phone number" });
  }

  try {
    // 🔥 GET OTP TYPE (IMPORTANT FIX)
    const [settings] = await db.query(
      "SELECT setting_value FROM app_settings WHERE setting_key = 'otp_type'"
    );

    const otpType = settings[0]?.setting_value || "email";

    // 🔥 DETERMINE KEY (MUST MATCH send-otp + verify-otp)
    const key = otpType === "sms" ? phone : email;

    // 🔥 CHECK OTP
    const savedOtp = otpStore[key];

    if (!savedOtp) {
      return res.status(400).json({
        error: "Please request OTP first",
      });
    }

    if (!savedOtp.verified) {
      return res.status(400).json({
        error: "Please verify OTP before registration",
      });
    }

    if (Date.now() > savedOtp.expiresAt) {
      return res.status(400).json({
        error: "OTP expired",
      });
    }

    // 🔥 CHECK EXISTING USER
    const [existing] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // 🔒 HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ INSERT USER
    await db.query(
      "INSERT INTO users (email, password, phone, name, type, status) VALUES (?, ?, ?, ?, ?, ?)",
      [email, hashedPassword, phone, name, "customer", "active"]
    );

    // 🧹 CLEAN OTP
    delete otpStore[key];

    return res.json({
      message: "User registered successfully",
    });

  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Server error" });
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
  const { email, phone, purpose } = req.body;

  try {
    // 🔥 GET OTP TYPE
    const [settings] = await db.query(
      "SELECT setting_value FROM app_settings WHERE setting_key = 'otp_type'"
    );

    const otpType = settings[0]?.setting_value || "email";

    // ✅ VALIDATION
    if (otpType === "sms" && !phone) {
      return res.status(400).json({ error: "Phone required" });
    }

    if (otpType === "email" && !email) {
      return res.status(400).json({ error: "Email required" });
    }

    // 🔥 USER CHECK (register only)
    if (email) {
      const [users] = await db.query(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );

      if (purpose === "register" && users.length > 0) {
        return res.status(400).json({ error: "User already exists" });
      }

      if (purpose === "forgot" && users.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
    }

    // ✅ KEY (IMPORTANT FIX)
    const key = otpType === "sms" ? phone : email;

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    otpStore[key] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      verified: false,
    };

    console.log("OTP SENT:", otp, "KEY:", key);

    // 📧 EMAIL OTP
    if (otpType === "email") {
      await transporter.sendMail({
        from: mailUser,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is ${otp}`,
      });
    }

    // 📱 SMS OTP
    if (otpType === "sms") {
      const qs = require("querystring");

      const formattedNumber = phone.startsWith("880")
        ? phone
        : `880${phone.replace(/^0/, "")}`;

      await axios.post(
        "http://bulksmsbd.net/api/smsapi",
        qs.stringify({
          api_key: "YOUR_API_KEY",
          senderid: "YOUR_SENDER_ID",
          number: formattedNumber,
          message: `Your OTP is ${otp}`,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
    }

    res.json({ message: `OTP sent via ${otpType}` });

  } catch (err) {
    console.error("OTP send error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/auth/verify-otp", async (req, res) => {
  const { email, phone, otp, purpose } = req.body;

  try {
    // 🔥 GET OTP TYPE
    const [settings] = await db.query(
      "SELECT setting_value FROM app_settings WHERE setting_key = 'otp_type'"
    );

    const otpType = settings[0]?.setting_value || "email";

    // ✅ SAME KEY LOGIC AS SEND OTP
    const key = otpType === "sms" ? phone : email;

    if (!key || !otp) {
      return res.status(400).json({ error: "Key and OTP required" });
    }

    const savedOtp = otpStore[key];

    console.log("DEBUG OTP:", {
      key,
      sent: savedOtp?.otp,
      received: otp,
    });

    if (!savedOtp) {
      return res.status(400).json({ error: "OTP not found or expired" });
    }

    // 🔥 FORCE STRING MATCH (VERY IMPORTANT)
    if (String(savedOtp.otp) !== String(otp)) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // mark verified
    otpStore[key].verified = true;

    return res.json({
      message: "OTP verified successfully",
    });

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
app.patch("/auth/settings/key/:key", authMiddleware, async (req, res) => {
  try {
    if (req.user.type !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { key } = req.params;
    const { setting_value } = req.body;

    if (setting_value === undefined || setting_value === null) {
      return res.status(400).json({ error: "Setting value is required" });
    }

    await db.query(
      `UPDATE app_settings
       SET setting_value = ?
       WHERE setting_key = ?`,
      [String(setting_value), key]
    );

    const [rows] = await db.query(
      `SELECT id, setting_key, setting_label, setting_value, updated_at
       FROM app_settings
       WHERE setting_key = ?`,
      [key]
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
    status,
    present_address,
    country,
    occupation
  } = req.body;

  const image = req.file ? req.file.filename : null;

  try {
    await db.query(
      `UPDATE users 
       SET name=?, phone=?, status=?, present_address=?, country=?, occupation=?, image=IFNULL(?, image)
       WHERE id=?`,
      [name, phone, status || "active", present_address, country, occupation, image, id]
    );

    const [rows] = await db.query(
      `SELECT id, name, email, phone, status, type, present_address, country, occupation, image
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
const getTransactionWithParties = async (transactionId) => {
  const [existingRows] = await db.query(
    `SELECT
       t.*,
       u.email AS customer_email,
       u.name AS customer_name,
       u.phone AS customer_phone,
       r.name AS receiver_name,
       r.number AS receiver_number
     FROM transactions t
     LEFT JOIN users u ON t.customer_id = u.id
     LEFT JOIN receivers r ON t.receiver_id = r.id
     WHERE t.id = ?`,
    [transactionId]
  );

  return existingRows[0] || null;
};

const updateTransactionStatusRecord = async (transactionId, status, notes, providedTransactionCode = null) => {
  const normalizedStatus = normalizeTransactionStatus(status);
  const existingTransaction = await getTransactionWithParties(transactionId);

  if (!existingTransaction) {
    const error = new Error("Transaction not found");
    error.statusCode = 404;
    throw error;
  }

  let tnx_id = existingTransaction.tnx_id;

  if (providedTransactionCode) {
    tnx_id = providedTransactionCode;
  } else if (normalizedStatus === "send" && !tnx_id) {
    tnx_id = "TNX" + Date.now();
  }

  if (normalizedStatus === "failed") {
    tnx_id = null;
  }

  const nextNotes =
    notes === undefined ? existingTransaction.notes : String(notes).trim() || null;

  await db.query(
    "UPDATE transactions SET status=?, tnx_id=?, notes=? WHERE id=?",
    [normalizedStatus, tnx_id, nextNotes, transactionId]
  );

  if (existingTransaction.customer_id) {
    await createNotificationForStatusChange(existingTransaction, normalizedStatus);
    await sendTransactionStatusEmail(
      {
        ...existingTransaction,
        status: existingTransaction.status,
        tnx_id,
        notes: nextNotes,
      },
      normalizedStatus
    );
    await syncNotificationForTransaction(transactionId);
    await syncNotificationsForUser(existingTransaction.customer_id);
  }

  return {
    ...existingTransaction,
    status: normalizedStatus,
    tnx_id,
    notes: nextNotes,
  };
};

app.get("/auth/transactions", async(req,res)=>{try{const [rows]=await db.query(`SELECT t.*, u.name AS customer_name, u.phone AS customer_phone, r.name AS receiver_name, r.number AS receiver_number FROM transactions t LEFT JOIN users u ON t.customer_id=u.id LEFT JOIN receivers r ON t.receiver_id=r.id ORDER BY t.id DESC`);res.json(rows);}catch(err){console.error(err);res.status(500).json({error:"Server error"});}});
app.get("/auth/transactions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    const filters = ["t.customer_id = ?"];
    const params = [userId];

    if (status) {
      filters.push("t.status = ?");
      params.push(status);
    }

    const [rows] = await db.query(
      `SELECT t.*, u.name AS customer_name, u.phone AS customer_phone, r.name AS receiver_name, r.number AS receiver_number
       FROM transactions t
       LEFT JOIN users u ON t.customer_id = u.id
       LEFT JOIN receivers r ON t.receiver_id = r.id
       WHERE ${filters.join(" AND ")}
       ORDER BY t.id DESC`,
      params
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});
app.patch("/auth/transaction/:id", async(req,res)=>{
  const {id}=req.params;
  const {status, notes}=req.body;

  try{
    await ensureNotificationsTable();
    await updateTransactionStatusRecord(id, status, notes);
    res.json({message:"Transaction updated successfully"});
  }catch(err){
    console.error(err);
    res.status(err.statusCode || 500).json({error:err.message || "Server error"});
  }
});
app.post("/auth/bkash/payment/:id/start", async (req, res) => {
  const { id } = req.params;

  try {
    const transaction = await getTransactionWithParties(id);

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.account_type !== "bkash") {
      return res.status(400).json({ error: "This transaction is not configured for bKash payment." });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({ error: "Only pending transactions can be paid with bKash." });
    }

    const tokenData = await grantBkashToken();
    const callbackUrl = new URL(BKASH_CALLBACK_URL);
    callbackUrl.searchParams.set("transactionId", String(transaction.id));

    const createResponse = await createBkashPayment(tokenData.id_token, {
      mode: "0011",
      payerReference: transaction.customer_phone || "",
      callbackURL: callbackUrl.toString(),
      amount: String(Number(transaction.amount || 0)),
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: `TX-${transaction.id}-${Date.now()}`,
    });

    res.json({
      paymentID: createResponse.paymentID,
      bkashURL: createResponse.bkashURL,
      callbackURL: createResponse.callbackURL,
      transactionStatus: createResponse.transactionStatus,
    });
  } catch (err) {
    console.error("bKash start payment error:", err);
    res.status(500).json({ error: err.message || "Failed to start bKash payment" });
  }
});

app.post("/auth/sslcommerz/payment/:id/start", async (req, res) => {
  const { id } = req.params;

  try {
    console.log("\n=== SSLCommerz Payment Initiation Started ===");
    console.log("Transaction ID:", id);

    // Validate transaction
    const transaction = await getTransactionWithParties(id);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({ error: "Only pending transactions can be processed" });
    }

    console.log("Transaction found:", {
      id: transaction.id,
      amount: transaction.amount,
      customerName: transaction.customer_name,
      customerPhone: transaction.customer_phone,
    });

    // Prepare payment data
    const successUrl = process.env.SSLCOMMERZ_SUCCESS_URL || `${FRONTEND_URL}/dashboard/transactions?gateway=sslcommerz&status=success`;
    const failUrl = process.env.SSLCOMMERZ_FAIL_URL || `${FRONTEND_URL}/dashboard/transactions?gateway=sslcommerz&status=fail`;
    const cancelUrl = process.env.SSLCOMMERZ_CANCEL_URL || `${FRONTEND_URL}/dashboard/transactions?gateway=sslcommerz&status=cancel`;

    const paymentData = {
      invoiceNo: `TX-${transaction.id}-${Date.now()}`,
      customerName: transaction.customer_name || "Customer",
      customerPhone: transaction.customer_phone || "01700000000",
      customerEmail: transaction.customer_email || "customer@example.com",
      amount: String(Math.round(Number(transaction.amount) * 100) / 100),
      successUrl,
      failUrl,
      cancelUrl,
    };

    console.log("Payment Data:", paymentData);

    let paymentResponse;
    try {
      paymentResponse = await initiateSSLCommerzPayment(paymentData);
      console.log("✓ Payment initiated successfully");
    } catch (paymentError) {
      console.error("✗ Payment initiation failed:", paymentError.message);
      return res.status(500).json({ error: paymentError.message });
    }

    // Extract gateway URL
    console.log("\n--- Extracting Gateway URL ---");
    const gatewayUrl = paymentResponse?.GatewayPageURL || paymentResponse?.gw_pageURL || paymentResponse?.redirect_url;

    if (!gatewayUrl) {
      console.error("✗ No gateway URL found in response:", paymentResponse);
      return res.status(500).json({
        error: "No payment gateway URL returned",
        availableFields: Object.keys(paymentResponse || {}),
      });
    }

    console.log("✓ Gateway URL extracted:", gatewayUrl);
    console.log("=== SSLCommerz Payment Initiation Complete ===\n");

    res.json({ paymentUrl: gatewayUrl });
  } catch (err) {
    console.error("\n✗ Unhandled Error:", err.message);
    res.status(500).json({ error: err.message || "Payment initiation failed" });
  }
});



app.get("/auth/bkash/callback", async (req, res) => {
  const { paymentID, status, transactionId } = req.query;
  const redirectUrl = new URL(`${FRONTEND_URL}/dashboard/transactions`);

  if (!paymentID) {
    redirectUrl.searchParams.set("gateway", "bkash");
    redirectUrl.searchParams.set("paymentStatus", "error");
    redirectUrl.searchParams.set("message", "Missing bKash payment ID");
    return res.redirect(redirectUrl.toString());
  }

  try {
    const tokenData = await grantBkashToken();
    const normalizedStatus = String(status || "").toLowerCase();
    let finalTransactionId = Number(transactionId || 0);

    if (normalizedStatus === "success") {
      const executeResponse = await executeBkashPayment(tokenData.id_token, paymentID);
      const invoiceMatch = executeResponse.merchantInvoiceNumber?.match(/^TX-(\d+)-/);

      if (!finalTransactionId && invoiceMatch) {
        finalTransactionId = Number(invoiceMatch[1]);
      }

      if (finalTransactionId) {
        await updateTransactionStatusRecord(
          finalTransactionId,
          "send",
          `bKash payment completed. Payment ID: ${paymentID}.`,
          executeResponse.trxID || null
        );
      }

      redirectUrl.searchParams.set("gateway", "bkash");
      redirectUrl.searchParams.set("paymentStatus", "success");
      redirectUrl.searchParams.set("message", "bKash payment completed successfully");
      redirectUrl.searchParams.set("paymentID", paymentID);
      if (executeResponse.trxID) {
        redirectUrl.searchParams.set("trxID", executeResponse.trxID);
      }
      return res.redirect(redirectUrl.toString());
    }

    const notePrefix =
      normalizedStatus === "cancel"
        ? "bKash payment was cancelled by the user."
        : "bKash payment failed.";

    if (finalTransactionId) {
      await updateTransactionStatusRecord(
        finalTransactionId,
        "failed",
        `${notePrefix} Payment ID: ${paymentID}.`
      );
    } else {
      await queryBkashPayment(tokenData.id_token, paymentID);
    }

    redirectUrl.searchParams.set("gateway", "bkash");
    redirectUrl.searchParams.set("paymentStatus", normalizedStatus || "failed");
    redirectUrl.searchParams.set("message", notePrefix);
    redirectUrl.searchParams.set("paymentID", paymentID);
    return res.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("bKash callback error:", err);
    redirectUrl.searchParams.set("gateway", "bkash");
    redirectUrl.searchParams.set("paymentStatus", "error");
    redirectUrl.searchParams.set("message", err.message || "Failed to verify bKash payment");
    redirectUrl.searchParams.set("paymentID", String(paymentID));
    return res.redirect(redirectUrl.toString());
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
(async () => {
  try {
    await ensureAppSettingsTable();
    await ensureNotificationsTable();
    await ensureSupportChatTables();
    await ensureTransactionStatusColumn();
    await ensureUserStatusColumn();
    await ensureLandingCmsTables();
  } catch (err) {
    console.error("Server init error:", err);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
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
  const {
    customer_id,
    receiver_id,
    new_receiver,
    account_type,
    amount,
  } = req.body;

  if (
    !customer_id ||
    !account_type ||
    !amount ||
    (!receiver_id && !new_receiver)
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Amount must be a valid number" });
    }

    // =========================
    // CHECK USER
    // =========================
    const [customerRows] = await db.query(
      `SELECT id, status FROM users WHERE id = ? LIMIT 1`,
      [customer_id]
    );

    if (customerRows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    if (customerRows[0].status === "inactive") {
      return res.status(403).json({
        error: "user is block by admin please contact with admin",
      });
    }

    // =========================
    // CHECK KYC
    // =========================
    const [kycRows] = await db.query(
      `SELECT status FROM kycVerification WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
      [customer_id]
    );

    if (kycRows.length === 0 || kycRows[0].status !== "approved") {
      return res.status(403).json({
        error:
          "KYC must be submitted and approved by admin before making a transaction",
      });
    }

    // =========================
    // SETTINGS LIMITS
    // =========================
    const transactionRoundLimit = await getNumericSettingValue([
      "transaction_round",
      "transaction_round_limitation",
    ]);

    const moneyLimit = await getNumericSettingValue(["money_limitation"]);
    const totalMoneyLimit = await getNumericSettingValue([
      "total_money_limitation",
    ]);

    // =========================
    // VALIDATE LIMITS
    // =========================
    if (
      Number.isFinite(moneyLimit) &&
      moneyLimit > 0 &&
      parsedAmount > moneyLimit
    ) {
      return res.status(400).json({
        error: `Amount exceeded. Maximum allowed amount is ${moneyLimit}.`,
      });
    }

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total_transactions FROM transactions WHERE customer_id = ?`,
      [customer_id]
    );

    const [monthRows] = await db.query(
      `SELECT COALESCE(SUM(amount),0) AS current_month_total_amount
       FROM transactions
       WHERE customer_id = ?
       AND YEAR(tnx_time) = YEAR(CURRENT_DATE())
       AND MONTH(tnx_time) = MONTH(CURRENT_DATE())`,
      [customer_id]
    );

    const usedTransactions = Number(countRows[0]?.total_transactions || 0);
    const usedMonthlyAmount = Number(monthRows[0]?.current_month_total_amount || 0);

    if (
      Number.isFinite(transactionRoundLimit) &&
      transactionRoundLimit > 0 &&
      usedTransactions >= transactionRoundLimit
    ) {
      return res.status(400).json({
        error: `Transaction limit exceeded. You can transfer money only ${transactionRoundLimit} times.`,
      });
    }

    if (
      Number.isFinite(totalMoneyLimit) &&
      totalMoneyLimit > 0 &&
      usedMonthlyAmount + parsedAmount > totalMoneyLimit
    ) {
      return res.status(400).json({
        error: `Monthly total money limit exceeded. Maximum allowed total for this month is ${totalMoneyLimit}.`,
      });
    }

    // =========================
    // RECEIVER LOGIC
    // =========================
    let receiverId = receiver_id;

    if (!receiver_id && new_receiver) {
      const [result] = await db.query(
        `INSERT INTO receivers (name, number, account_type, status)
         VALUES (?, ?, ?, ?)`,
        [new_receiver, new_receiver, account_type, "active"]
      );

      receiverId = result.insertId;
    }

    // =========================
    // 🔥 FEE CALCULATION (ADMIN CONTROLLED)
    // =========================
    const settings = await getSettingsByKeys([
      "transaction_fee_type",
      "transaction_fee_value",
    ]);

    const feeType = settings.transaction_fee_type || "percent";
    const feeValue = Number(settings.transaction_fee_value) || 0;

    let fee = 0;

    if (feeType === "percent") {
      fee = (parsedAmount * feeValue) / 100;
    } else {
      fee = feeValue;
    }

    const totalAmount = parsedAmount + fee;

    // =========================
    // INSERT TRANSACTION
    // =========================
    const [tx] = await db.query(
      `INSERT INTO transactions 
      (customer_id, receiver_id, account_type, amount, fee, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_id,
        receiverId,
        account_type,
        parsedAmount,
        fee,
        totalAmount,
        "pending",
      ]
    );

    // =========================
    // NOTIFICATION
    // =========================
    await createNotificationForAdminsOnTransactionRequest(tx.insertId);

    res.json({
      message: "Transaction created successfully",
      transactionId: tx.insertId,
      fee,
      totalAmount,
    });
  } catch (err) {
    console.error("Transaction creation error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// ================= TOTAL TRANSACTION AMOUNT =================//

app.get("/api/transactions/total", async (req, res) => {
  try {
    const { customer_id, status } = req.query;
    const filters = [];
    const params = [];

    if (customer_id) {
      filters.push("customer_id = ?");
      params.push(customer_id);
    }

    if (status) {
      filters.push("status = ?");
      params.push(status);
    }

    const amountExpression = status
      ? "SUM(amount) AS totalBalance"
      : "SUM(CASE WHEN status IN ('send','success') THEN amount ELSE 0 END) AS totalBalance";

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "WHERE status IN ('send','success')";

    const [rows] = await db.execute(`
      SELECT ${amountExpression}
      FROM transactions
      ${whereClause}
    `, params);

    res.json({
      totalBalance: rows[0].totalBalance || 0
    });
  } catch (error) {
    console.error("TOTAL ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
});
app.get("/api/users/active-count", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT COUNT(*) AS totalUsers
      FROM users
      WHERE status = 'active'
        AND type = 'customer'
    `);

    res.json({
      totalUsers: rows[0].totalUsers || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});
app.get("/api/transactions/monthly", async (req, res) => {
  try {
    const { customer_id, status } = req.query;
    const filters = ["tnx_time IS NOT NULL", "YEAR(tnx_time) = YEAR(CURRENT_DATE())", "MONTH(tnx_time) = MONTH(CURRENT_DATE())"];
    const params = [];

    if (customer_id) {
      filters.push("customer_id = ?");
      params.push(customer_id);
    }

    if (status) {
      filters.push("status = ?");
      params.push(status);
    } else {
      filters.push("status IN ('send','success')");
    }

    const [rows] = await db.execute(`
      SELECT 
        SUM(amount) AS total
      FROM transactions
      WHERE ${filters.join(" AND ")}
    `, params);

    res.json({
      total: rows[0].total || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});
app.get("/api/transactions/yearly", async (req, res) => {
  try {
    const { customer_id, status } = req.query;
    const filters = ["tnx_time IS NOT NULL", "YEAR(tnx_time) = YEAR(CURRENT_DATE())"];
    const params = [];

    if (customer_id) {
      filters.push("customer_id = ?");
      params.push(customer_id);
    }

    if (status) {
      filters.push("status = ?");
      params.push(status);
    } else {
      filters.push("status IN ('send','success')");
    }

    const [rows] = await db.execute(`
      SELECT 
        SUM(amount) AS total
      FROM transactions
      WHERE ${filters.join(" AND ")}
    `, params);

    res.json({
      total: rows[0].total || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/api/transactions/daily", async (req, res) => {
  try {
    const { customer_id, status } = req.query;
    const filters = ["tnx_time IS NOT NULL", "YEAR(tnx_time) = YEAR(CURRENT_DATE())", "MONTH(tnx_time) = MONTH(CURRENT_DATE())"];
    const params = [];

    if (customer_id) {
      filters.push("customer_id = ?");
      params.push(customer_id);
    }

    if (status) {
      filters.push("status = ?");
      params.push(status);
    } else {
      filters.push("status IN ('send','success')");
    }

    const [rows] = await db.execute(`
      SELECT 
        DAY(tnx_time) AS day,
        SUM(amount) AS amount
      FROM transactions
      WHERE ${filters.join(" AND ")}
      GROUP BY DAY(tnx_time)
      ORDER BY day
    `, params);

    // Create array for all days 1-30, fill with 0 if no data
    const dailyData = Array.from({ length: 30 }, (_, i) => ({ day: i + 1, amount: 0 }));
    rows.forEach(row => {
      if (row.day >= 1 && row.day <= 30) {
        dailyData[row.day - 1].amount = row.amount;
      }
    });

    res.json(dailyData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

/////////////////////////////////////////////////
app.patch("/auth/settings/otp_type", async (req, res) => {
  try {
    const { setting_value } = req.body;

    await db.query(
      `UPDATE app_settings 
       SET setting_value = ? 
       WHERE setting_key = 'otp_type'`,
      [setting_value]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update OTP type" });
  }
});

/////////////////////////////////////////
app.post("/api/hero/logo-upload", uploadHeroLogo.single("logo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const logoUrl = `/uploads/hero/${req.file.filename}`;
  res.json({ url: logoUrl });
});

app.get("/api/hero", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM hero_section WHERE id = 1");
  res.json(rows[0]);
});
app.put("/api/hero", async (req, res) => {
  const {
    logo,
    badge_text,
    title,
    highlight_text,
    description,
    primary_button_text,
    primary_button_link,
    secondary_button_text,
    secondary_button_link,
    stat1_value,
    stat1_label,
    stat2_value,
    stat2_label,
    stat3_value,
    stat3_label,
    card_amount,
    card_recipients,
    card_status,
    card_verified
  } = req.body;

  await db.query(
    `UPDATE hero_section SET
      logo=?,
      badge_text=?,
      title=?,
      highlight_text=?,
      description=?,
      primary_button_text=?,
      primary_button_link=?,
      secondary_button_text=?,
      secondary_button_link=?,
      stat1_value=?,
      stat1_label=?,
      stat2_value=?,
      stat2_label=?,
      stat3_value=?,
      stat3_label=?,
      card_amount=?,
      card_recipients=?,
      card_status=?,
      card_verified=?
    WHERE id=1`,
    [
      logo,
      badge_text,
      title,
      highlight_text,
      description,
      primary_button_text,
      primary_button_link,
      secondary_button_text,
      secondary_button_link,
      stat1_value,
      stat1_label,
      stat2_value,
      stat2_label,
      stat3_value,
      stat3_label,
      card_amount,
      card_recipients,
      card_status,
      card_verified
    ]
  );

  res.json({ message: "Hero updated successfully" });
});
app.get("/api/services-section", async (req, res) => {
  try {
    await ensureServicesSectionTable();
    const [rows] = await db.query("SELECT * FROM services_section WHERE id = 1");
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch services section" });
  }
});

app.put("/api/services-section", async (req, res) => {
  try {
    await ensureServicesSectionTable();
    const data = { ...req.body };
    delete data.id;
    await db.query("UPDATE services_section SET ? WHERE id = 1", [data]);
    res.json({ message: "Services section updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update services section" });
  }
});

app.post("/api/services-section/icon-upload", uploadServiceIcon.single("icon"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Icon image is required" });
  }

  res.json({
    filename: req.file.filename,
    url: `/uploads/services/${req.file.filename}`,
  });
});

app.post("/api/partners-section/logo-upload", uploadPartnersIcon.single("logo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Logo image is required" });
  }

  res.json({
    filename: req.file.filename,
    url: `/uploads/partners/${req.file.filename}`,
  });
});

app.get("/api/transaction-section", async (req, res) => {
  try {
    await ensureTransactionSectionTable();
    const [rows] = await db.query("SELECT * FROM transaction_section WHERE id = 1");
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch transaction section" });
  }
});

app.put("/api/transaction-section", async (req, res) => {
  try {
    await ensureTransactionSectionTable();
    const data = { ...req.body };
    delete data.id;
    await db.query("UPDATE transaction_section SET ? WHERE id = 1", [data]);
    res.json({ message: "Transaction section updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update transaction section" });
  }
});

app.get("/api/partners-section", async (req, res) => {
  try {
    await ensurePartnersSectionTable();
    const [rows] = await db.query("SELECT * FROM partners_section WHERE id = 1");
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch partners section" });
  }
});

app.put("/api/partners-section", async (req, res) => {
  try {
    await ensurePartnersSectionTable();
    const data = { ...req.body };
    delete data.id;
    await db.query("UPDATE partners_section SET ? WHERE id = 1", [data]);
    res.json({ message: "Partners section updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update partners section" });
  }
});

app.get("/api/footer-section", async (req, res) => {
  try {
    await ensureFooterSectionTable();
    const [rows] = await db.query("SELECT * FROM footer_section WHERE id = 1");
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch footer section" });
  }
});

app.put("/api/footer-section", async (req, res) => {
  try {
    await ensureFooterSectionTable();
    const data = { ...req.body };
    delete data.id;
    await db.query("UPDATE footer_section SET ? WHERE id = 1", [data]);
    res.json({ message: "Footer section updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update footer section" });
  }
});
app.post("/api/contact", async (req, res) => {
  console.log("📩 Contact API hit"); // 👈 ADD THIS

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    await db.query(
      "INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)",
      [name, email, message]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/contacts", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM contacts ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});
app.post("/api/support-chat/conversations", async (req, res) => {
  const { customer_user_id, customer_name, customer_email } = req.body;

  const trimmedName = String(customer_name || "").trim();
  const trimmedEmail = String(customer_email || "").trim().toLowerCase();
  const numericUserId =
    customer_user_id !== undefined &&
    customer_user_id !== null &&
    customer_user_id !== ""
      ? Number(customer_user_id)
      : null;

  if (!trimmedName || !trimmedEmail) {
    return res.status(400).json({ error: "Customer name and email are required" });
  }

  try {
    let conversation = await findSupportConversation({
      customerUserId: Number.isFinite(numericUserId) ? numericUserId : null,
      customerEmail: trimmedEmail,
    });

    if (!conversation) {
      const [result] = await db.query(
        `
          INSERT INTO support_conversations
          (customer_user_id, customer_name, customer_email, status, last_message_at)
          VALUES (?, ?, ?, 'open', CURRENT_TIMESTAMP)
        `,
        [Number.isFinite(numericUserId) ? numericUserId : null, trimmedName, trimmedEmail]
      );

      const [rows] = await db.query(
        "SELECT * FROM support_conversations WHERE id = ? LIMIT 1",
        [result.insertId]
      );
      conversation = rows[0];
    } else if (
      conversation.customer_name !== trimmedName ||
      conversation.customer_email !== trimmedEmail ||
      (Number.isFinite(numericUserId) && conversation.customer_user_id !== numericUserId)
    ) {
      await db.query(
        `
          UPDATE support_conversations
          SET customer_name = ?, customer_email = ?, customer_user_id = COALESCE(?, customer_user_id)
          WHERE id = ?
        `,
        [trimmedName, trimmedEmail, Number.isFinite(numericUserId) ? numericUserId : null, conversation.id]
      );

      const [rows] = await db.query(
        "SELECT * FROM support_conversations WHERE id = ? LIMIT 1",
        [conversation.id]
      );
      conversation = rows[0];
    }

    res.json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});
app.get("/api/support-chat/conversations", async (req, res) => {
  const role = String(req.query.role || "").toLowerCase();
  const userId = Number(req.query.user_id);
  const email = String(req.query.email || "").trim().toLowerCase();

  try {
    let rows;

    if (role === "admin") {
      [rows] = await db.query(`
        SELECT
          c.*,
          m.message AS last_message,
          m.sender_role AS last_sender_role,
          (
            SELECT COUNT(*)
            FROM support_messages sm
            WHERE sm.conversation_id = c.id
          ) AS message_count
        FROM support_conversations c
        LEFT JOIN support_messages m
          ON m.id = (
            SELECT id
            FROM support_messages
            WHERE conversation_id = c.id
            ORDER BY created_at DESC, id DESC
            LIMIT 1
          )
        ORDER BY c.last_message_at DESC, c.id DESC
      `);
    } else {
      if (!Number.isFinite(userId) && !email) {
        return res.status(400).json({ error: "User id or email is required" });
      }

      const filters = [];
      const params = [];

      if (Number.isFinite(userId)) {
        filters.push("c.customer_user_id = ?");
        params.push(userId);
      }

      if (email) {
        filters.push("c.customer_email = ?");
        params.push(email);
      }

      [rows] = await db.query(
        `
          SELECT
            c.*,
            m.message AS last_message,
            m.sender_role AS last_sender_role,
            (
              SELECT COUNT(*)
              FROM support_messages sm
              WHERE sm.conversation_id = c.id
            ) AS message_count
          FROM support_conversations c
          LEFT JOIN support_messages m
            ON m.id = (
              SELECT id
              FROM support_messages
              WHERE conversation_id = c.id
              ORDER BY created_at DESC, id DESC
              LIMIT 1
            )
          WHERE ${filters.join(" OR ")}
          ORDER BY c.last_message_at DESC, c.id DESC
        `,
        params
      );
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});
app.get("/api/support-chat/conversations/:conversationId/messages", async (req, res) => {
  const conversationId = Number(req.params.conversationId);
  const role = String(req.query.role || "").toLowerCase();
  const userId = Number(req.query.user_id);
  const email = String(req.query.email || "").trim().toLowerCase();

  if (!Number.isFinite(conversationId)) {
    return res.status(400).json({ error: "Invalid conversation id" });
  }

  try {
    const [conversationRows] = await db.query(
      "SELECT * FROM support_conversations WHERE id = ? LIMIT 1",
      [conversationId]
    );

    if (conversationRows.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const conversation = conversationRows[0];
    const isAdmin = role === "admin";
    const ownsConversation =
      (Number.isFinite(userId) && conversation.customer_user_id === userId) ||
      (email && conversation.customer_email === email);

    if (!isAdmin && !ownsConversation) {
      return res.status(403).json({ error: "You do not have access to this conversation" });
    }

    const [messages] = await db.query(
      `
        SELECT *
        FROM support_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC, id ASC
      `,
      [conversationId]
    );

    res.json({
      conversation,
      messages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});
app.post("/api/support-chat/conversations/:conversationId/messages", async (req, res) => {
  const conversationId = Number(req.params.conversationId);
  const { sender_role, sender_name, message, user_id, email } = req.body;

  if (!Number.isFinite(conversationId)) {
    return res.status(400).json({ error: "Invalid conversation id" });
  }

  const senderRole = String(sender_role || "").trim().toLowerCase();
  const senderName = String(sender_name || "").trim();
  const trimmedMessage = String(message || "").trim();
  const numericUserId =
    user_id !== undefined && user_id !== null && user_id !== ""
      ? Number(user_id)
      : null;
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!["admin", "customer"].includes(senderRole)) {
    return res.status(400).json({ error: "Sender role must be admin or customer" });
  }

  if (!senderName || !trimmedMessage) {
    return res.status(400).json({ error: "Sender name and message are required" });
  }

  try {
    const [conversationRows] = await db.query(
      "SELECT * FROM support_conversations WHERE id = ? LIMIT 1",
      [conversationId]
    );

    if (conversationRows.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const conversation = conversationRows[0];

    if (senderRole === "customer") {
      const ownsConversation =
        (Number.isFinite(numericUserId) && conversation.customer_user_id === numericUserId) ||
        (normalizedEmail && conversation.customer_email === normalizedEmail);

      if (!ownsConversation) {
        return res.status(403).json({ error: "You do not have access to this conversation" });
      }
    }

    await createSupportMessage({
      conversationId,
      senderRole,
      senderName,
      message: trimmedMessage,
    });

    const [messages] = await db.query(
      `
        SELECT *
        FROM support_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC, id ASC
      `,
      [conversationId]
    );

    res.json({
      success: true,
      messages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to send message" });
  }
});
app.post("/api/contact/reply", async (req, res) => {
  const { email, message, name } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: "Email and message required" });
  }

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Response from BulkPay Support",
      html: `
        <p>Hi ${name || "User"},</p>
        <p>${message}</p>
        <br/>
        <p>Best regards,<br/>BulkPay Team</p>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send email" });
  }
});
