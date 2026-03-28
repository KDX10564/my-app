const express = require('express');
const router = express.Router();
const sendEmail = require('../services/brevo');

router.get('/order', async (req, res) => {
  await sendEmail(
    "teamkdx.sa@gmail.com",
    "تأكيد الطلب",
    "<h1>تم استلام طلبك ✅</h1>"
  );
  res.send("تم الإرسال");
});

module.exports = router;