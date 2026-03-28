require('dotenv').config();
const express = require('express');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// ==========================
// 🗄️ Database
// ==========================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ DB Connected'))
  .catch(err => console.log(err));

// ==========================
// 📦 Models
// ==========================
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  isVerified: { type: Boolean, default: false }
});

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  expiresAt: Date,
  attempts: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);
const OTP = mongoose.model('OTP', otpSchema);

// ==========================
// 🔐 JWT
// ==========================
const generateToken = (user) => {
  return jwt.sign(
    { email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ==========================
// 📧 Brevo Setup
// ==========================
const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// ==========================
// 🛡️ Security
// ==========================
const resendCooldown = {};
const ipRateLimit = {};

// ==========================
// ✉️ Send OTP
// ==========================
app.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const ip = req.ip;

    if (!email) {
      return res.status(400).json({ message: 'أدخل الإيميل' });
    }

    // Cooldown
    if (resendCooldown[email] && Date.now() < resendCooldown[email]) {
      return res.status(429).json({ message: 'انتظر 30 ثانية' });
    }

    // Rate limit
    if (!ipRateLimit[ip]) {
      ipRateLimit[ip] = { count: 0, time: Date.now() };
    }

    if (Date.now() - ipRateLimit[ip].time < 60000) {
      ipRateLimit[ip].count++;
      if (ipRateLimit[ip].count > 5) {
        return res.status(429).json({ message: 'طلبات كثيرة' });
      }
    } else {
      ipRateLimit[ip] = { count: 1, time: Date.now() };
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    resendCooldown[email] = Date.now() + 30000;

    const emailData = new SibApiV3Sdk.SendSmtpEmail();

    emailData.sender = {
      name: "KDX",
      email: "info@kdx-sa.com"
    };

    emailData.to = [{ email }];
    emailData.subject = "رمز التحقق";

    emailData.htmlContent = `
      <div style="text-align:center">
        <h2>رمز التحقق</h2>
        <h1>${otp}</h1>
        <p>صالح لمدة 5 دقائق</p>
      </div>
    `;

    await apiInstance.sendTransacEmail(emailData);

    res.json({ message: 'تم إرسال OTP' });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'خطأ في السيرفر' });
  }
});

// ==========================
// 🔑 Verify OTP
// ==========================
app.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await OTP.findOne({ email });

    if (!record) {
      return res.status(404).json({ message: 'لا يوجد OTP' });
    }

    if (Date.now() > record.expiresAt) {
      await OTP.deleteMany({ email });
      return res.status(400).json({ message: 'انتهى الكود' });
    }

    if (record.attempts >= 3) {
      await OTP.deleteMany({ email });
      return res.status(429).json({ message: 'محاولات كثيرة' });
    }

    if (record.otp != otp) {
      record.attempts++;
      await record.save();
      return res.status(400).json({
        message: `كود خطأ (${record.attempts}/3)`
      });
    }

    // Success
    await OTP.deleteMany({ email });

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ email, isVerified: true });
    } else {
      user.isVerified = true;
      await user.save();
    }

    const token = generateToken(user);

    res.json({
      message: 'تم تسجيل الدخول',
      token
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'خطأ في السيرفر' });
  }
});

// ==========================
// 🔒 Auth Middleware
// ==========================
const auth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: 'لا يوجد توكن' });
  }

  const token = header.split(' ')[1]; // Bearer TOKEN

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'توكن غير صالح' });
  }
};

// ==========================
// 👤 Profile
// ==========================
app.get('/profile', auth, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  res.json(user);
});

// ==========================
// 🚀 Start
// ==========================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
