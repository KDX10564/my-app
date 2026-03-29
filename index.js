const express = require("express");
const app = express();

app.use(express.json());

// استدعاء ملف الإيميل
const sendEmail = require("./email");

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// مثال endpoint للإيميل
app.post("/send", async (req, res) => {
  try {
    await sendEmail(req.body);
    res.send("Email sent ✅");
  } catch (err) {
    res.status(500).send("Error sending email ❌");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
