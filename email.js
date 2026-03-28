// استدعاء المكتبات
const express = require('express');
const SibApiV3Sdk = require('sib-api-v3-sdk');
require('dotenv').config();

const app = express();

app.use(express.json());

// إعداد API KEY
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.send('🚀 السيرفر شغال');
});


// ✅ تأكيد الطلب
app.post('/order', async (req, res) => {
try {

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.sender = {
      name: "متجري",
      email: "info@kdx-sa.com"
    };

    sendSmtpEmail.to = [{ email: "teamkdx.sa@gmail.com" }];
    sendSmtpEmail.subject = "تأكيد الطلب 🧾";

    sendSmtpEmail.htmlContent = `
      <h1>تم استلام طلبك ✅</h1>
      <p>شكراً لك 🙏</p>
    `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    res.send("✅ تم إرسال تأكيد الطلب");
  } catch (err) {
    console.log(err);
    res.send("❌ خطأ في الإرسال");
  }
});


// ✅ OTP
app.get('/otp', async (req, res) => {
  try {
    const code = Math.floor(100000 + Math.random() * 900000);

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.sender = {
      name: "متجري",
      email: "info@kdx-sa.com"
    };

    sendSmtpEmail.to = [{ email: "teamkdx.sa@gmail.com" }];
    sendSmtpEmail.subject = "رمز التحقق 🔐";

    sendSmtpEmail.htmlContent = `
      <h1>رمز التحقق</h1>
      <h2>${code}</h2>
    `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    res.send("✅ تم إرسال OTP");
  } catch (err) {
    console.log(err);
    res.send("❌ خطأ في الإرسال");
  }
});


// تشغيل السيرفر
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 السيرفر شغال على ${PORT}`);
});
