const express = require('express');
const SibApiV3Sdk = require('sib-api-v3-sdk');
require('dotenv').config();

const app = express();
app.use(express.json());

// تخزين OTP مؤقت (ذاكرة)
const otpStore = {};

// إعداد Brevo
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.send('🚀 السيرفر شغال');
});


// ✅ 1. إرسال OTP
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.send('❌ اكتب الإيميل');
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  // تخزين الكود
  otpStore[email] = otp;

  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.sender = {
      name: "KDX",
      email: "info@kdx-sa.com"
    };

    sendSmtpEmail.to = [{ email }];

    sendSmtpEmail.subject = "رمز التحقق 🔐";

    sendSmtpEmail.htmlContent = `
      <h1>رمز التحقق</h1>
      <h2>${otp}</h2>
    `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    res.send('✅ تم إرسال OTP');
  } catch (err) {
    console.log(err);
    res.send('❌ خطأ في الإرسال');
  }
});


// ✅ 2. التحقق من OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] == otp) {
    delete otpStore[email]; // حذف بعد الاستخدام
    return res.send('✅ تم التحقق بنجاح');
  } else {
    return res.send('❌ كود غير صحيح');
  }
});


// تشغيل السيرفر
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 السيرفر شغال على ${PORT}`);
});
