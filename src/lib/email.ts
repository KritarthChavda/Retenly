import { Resend } from 'resend';
import { logger } from './logger';

/**
 * Email service using Resend API
 */

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email to restaurant owner with their credentials
 */
export async function sendRestaurantCredentials(
  restaurantName: string,
  email: string,
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000';
    const appUrl = rawAppUrl.startsWith('http://') || rawAppUrl.startsWith('https://')
      ? rawAppUrl
      : `https://${rawAppUrl.replace(/\/+$/, '')}`; // add https if missing, remove trailing slash

    const loginUrl = `${appUrl}/restaurant/login`;

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Welcome to Retenly</title>
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <style>
  body {
    font-family: 'Inter', Arial, sans-serif;
    background-color: #0e0e10;
    color: #f3f4f6;
    margin: 0;
    padding: 0;
    -webkit-text-size-adjust: 100%;
  }

  .wrapper {
    width: 100%;
    padding: 40px 0;
  }

  .container {
    max-width: 600px;
    margin: 0 auto;
    background: #16161a;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
  }

  .header {
    background: linear-gradient(90deg, #8b5cf6, #ec4899);
    color: #ffffff !important;
    text-align: center;
    padding: 28px 24px;
  }

  .header h1 {
    margin-top: 14px;
    font-size: 23px;
    font-weight: 700;
    color: #ffffff !important;
  }

  .header p {
    margin: 0;
    font-size: 15px;
    color: #f5f5f5 !important;
    opacity: 1 !important;
  }

  .content {
  padding: 36px 28px;
  font-size: 16px;
  line-height: 1.7;
  color: #f1f1f1;
}

  .content h2 {
    color: #ffffff !important;
    font-size: 21px;
    margin-bottom: 16px;
  }

  .credentials {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    padding: 16px 20px;
    margin: 22px 0;
    font-family: 'Courier New', monospace;
    margin-top: 20px !important;
  margin-bottom: 28px !important;
  }

  .credentials p {
    margin: 6px 0;
    color: #ffffff !important;
    font-size: 14px;
  }

  .button {
    display: inline-block;
    background: linear-gradient(90deg, #8b5cf6, #ec4899);
    color: #ffffff !important;
    text-decoration: none;
    padding: 12px 28px;
    border-radius: 10px;
    font-weight: 500;
    margin-top: 24px;
    transition: all 0.2s ease;
  }

  .button:hover {
    opacity: 0.9;
  }

  ul {
  margin: 0 !important;
  margin-top: 14px !important;
  padding-left: 22px !important;
  color: #e4e4e7 !important;
  list-style-position: outside !important;
}

li {
  margin: 6px 0 !important;
  line-height: 1.6 !important;
}

ul:first-of-type {
  margin-top: 0 !important;
  margin-bottom: 10px !important;
}

  .footer {
    text-align: center;
    padding: 24px;
    color: #a1a1aa !important;
    font-size: 13px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    background: #121214;
  }

  .footer a {
    color: #8b5cf6 !important;
    text-decoration: none;
  }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Welcome to Retenly</h1>
        <p>Your Business Dashboard is Ready!</p>
      </div>
      <div class="content">
        <h2>Hello ${restaurantName} Team 👋</h2>
        <ul>
          <li>Your business has been successfully registered on Retenly's feedback platform.</li>
          <li>You can now start collecting and managing customer feedback with ease.</li>
        </ul>

        <div class="credentials">
          <p><strong>Username:</strong> ${username}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>

        <p style="font-size:14px; color:#a1a1aa;">
          <em>Please keep these credentials secure and change your password after first login.</em>
        </p>

        <a href="${loginUrl}" class="button">Access Your Dashboard</a>

        <h3 style="margin-top: 36px; color:#fff;">What you can do:</h3>
        <ul>
          <li>View real-time customer feedback and ratings</li>
          <li>Analyze sentiment trends and satisfaction</li>
          <li>Export feedback data and generate reports</li>
        </ul>

        <p style="color:#a1a1aa;">
          If you have any questions or need assistance, feel free to reach out to our support team at <a href="mailto:hello@retenly.in">hello@retenly.in</a>
        </p>
      </div>

      <div class="footer">
        <p>© ${new Date().getFullYear()} Retenly. All rights reserved.</p>
        <p>This email was sent to <a href="mailto:${email}">${email}</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;


    const textBody = `
Welcome to Retenly - ${restaurantName}

Your business has been successfully registered on our feedback platform.

Login Credentials:
Username: ${username}
Password: ${password}

Login URL: ${loginUrl}

Your dashboard features:
- Real-time customer feedback and ratings
- Sentiment analysis and trends
- Data export and reporting

Please keep your credentials secure.

Best regards,
The Retenly Team
    `.trim();

    const emailData: EmailData = {
      to: email,
      subject: `Welcome to Retenly - ${restaurantName} Dashboard Access`,
      html: htmlBody,
      text: textBody,
    };

    const result = await sendEmail(emailData);
    if (result.success) {
      logger.info(
        `Restaurant credentials email sent successfully: to=${emailData.to}, subject=${emailData.subject}, restaurantName=${restaurantName}`
      );
    } else {
      logger.error(
        `Failed to send restaurant credentials email: to=${emailData.to}, subject=${emailData.subject}, restaurantName=${restaurantName}, error=${result.error}`
      );
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error sending restaurant credentials email');
    return { success: false, error: errorMessage };
  }
}

/**
 * Send email using Resend API
 */
async function sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const fromAddress = process.env.EMAIL_FROM || 'Retenly <hello@retenly.in>';

    const { error } = await resend.emails.send({
      from: fromAddress,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    if (error) {
      logger.error(`Resend API error: ${error.message}`);
      return { success: false, error: error.message };
    }

    logger.info(`Email sent successfully: to=${emailData.to}, subject=${emailData.subject}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to send email: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send test email to verify email configuration
 */
export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  const emailData: EmailData = {
    to,
    subject: 'Retenly Email Configuration Test',
    html: `
    <h2>Email Configuration Test</h2>
    <p>If you receive this email, your Retenly email configuration is working correctly!</p>
    <p>Timestamp: ${new Date().toISOString()}</p>
    `,
    text: `Email Configuration Test - If you receive this email, your Retenly email configuration is working correctly! Timestamp: ${new Date().toISOString()}`,
  };

  return await sendEmail(emailData);
}
