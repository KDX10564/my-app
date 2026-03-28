const SibApiV3Sdk = require('sib-api-v3-sdk');

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications['api-key'];

apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async (to, subject, html) => {
  const email = new SibApiV3Sdk.SendSmtpEmail();

  email.sender = {
    name: "متجري",
    email: "info@kdx-sa.com"
  };

  email.to = [{ email: to }];
  email.subject = subject;
  email.htmlContent = html;

  return await apiInstance.sendTransacEmail(email);
};

module.exports = sendEmail;