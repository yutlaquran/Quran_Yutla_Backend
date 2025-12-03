export const verificationEmail = (username = 'User', otp: string): string => {
  if (!otp) {
    console.error('❌ Error: Confirmation URL is missing!');
    return '<p>Error: Confirmation URL is missing!</p>';
  }

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Confirmation</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f8f9fa;
        margin: 0;
        padding: 0;
      }
      .email-container {
        background-color: #ffffff;
        max-width: 600px;
        margin: 40px auto;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        text-align: center;
      }
      .email-header {
        background-image: linear-gradient(to bottom, #CAB76A 10% , #1A5632 90%);
        color: #ffffff;
        padding: 30px;
        font-size: 24px;
        font-weight: bold;
      }
      .email-body {
        padding: 30px;
        color: #333333;
        font-size: 16px;
        line-height: 1.6;
      }
      .email-body p {
        margin: 18px 0;
      }
      .button {
        display: inline-block;
        background-color: #007bff;
        color: #ffffff !important;
        text-decoration: none !important;
        padding: 14px 24px;
        border-radius: 6px;
        font-size: 18px;
        font-weight: bold;
        margin-top: 20px;
        transition: background 0.3s ease-in-out;
      }
      .button:hover {
        background-color: #CAB76A;
      }
      .email-footer {
        background-color: #f8f9fa;
        padding: 20px;
        font-size: 14px;
        color: #6c757d;
        text-align: center;
      }
      .email-footer a {
        color: #3E8E40;
        text-decoration: none;
        font-weight: bold;
      }
      .email-footer a:hover {
          color: #4CAF4F;
        text-decoration: underline;
      }
      .otp {
          color: #A29255;
          letter-spacing: 15px;
          font-size: 40px;
          font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        Confirm Your Email Address
      </div>
      <div class="email-body">
        <p>Dear <strong>${username}</strong>,</p>
        <p>Thank you for signing up!</p>
        <p>To complete your registration, use the code below to verify your account:</p>
        <p class="otp">
          ${otp}
        </p>
        <p>If you did not request this code or did not sign up for this account</p>
        <p>Please ignore this message.</p>
      </div>
      <div class="email-footer">
        <p>Need assistance? <a href="mailto:support@ejar.com">Contact Support</a></p>
      </div>
    </div>
  </body>
  </html>`;
};

// TODO: Change later
export const passwordResetEmail = (verificationCode: string): string => {
  const otp = `${verificationCode}`;
  return `<html>
<body>
  <h3>Password Reset</h3>
  <div>
    <p>We've received your request to be able to reset your password.</p>
    <p>Please take this opt: ${otp}   to reset your password.</p>
    <p>This otp will expire in 10 min.</p>
    <p>If you did not request to reset your password, you should be able to ignore this email.</p>
  </div>
  <div>
    <p>Thank you from the opream team</p>
  </div>
</body>
</html>
`;
};
