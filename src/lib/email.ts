import nodemailer from 'nodemailer'
import { logger } from './logger'

/**
 * Production-ready email service using Nodemailer
 */

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

interface EmailConfig {
  service: string
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

/**
 * Create email transporter based on environment configuration
 */
function createTransporter() {
  const config: EmailConfig = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  }

  return nodemailer.createTransport(config)
}

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
    const loginUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/restaurant/login`
    
    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Retenly</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Retenly</h1>
          <p>Your Restaurant Dashboard is Ready!</p>
        </div>
        <div class="content">
          <h2>Hello ${restaurantName} Team,</h2>
          <p>Your restaurant has been successfully registered on Retenly's feedback platform. You can now start collecting and managing customer feedback!</p>
          
          <div class="credentials">
            <h3>Your Login Credentials:</h3>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p><em>Please keep these credentials secure and change your password after first login.</em></p>
          </div>
          
          <a href="${loginUrl}" class="button">Access Your Dashboard</a>
          
          <h3>What you can do:</h3>
          <ul>
            <li>View real-time customer feedback and ratings</li>
            <li>Analyze sentiment trends and customer satisfaction</li>
            <li>Export feedback data and generate reports</li>
            <li>Customize your feedback forms</li>
          </ul>
          
          <p>If you have any questions or need assistance, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>© 2024 Retenly. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
        </div>
      </div>
    </body>
    </html>
    `

    const textBody = `
Welcome to Retenly - ${restaurantName}

Your restaurant has been successfully registered on our feedback platform.

Login Credentials:
Username: ${username}
Password: ${password}

Login URL: ${loginUrl}

Your dashboard features:
- Real-time customer feedback and ratings
- Sentiment analysis and trends
- Data export and reporting
- Customizable feedback forms

Please keep your credentials secure.

Best regards,
The Retenly Team
    `.trim()

    const emailData: EmailData = {
      to: email,
      subject: `Welcome to Retenly - ${restaurantName} Dashboard Access`,
      html: htmlBody,
      text: textBody
    }

    // For development, just log the email
    if (process.env.NODE_ENV === 'development') {
      logger.info('Email would be sent in production', {
        to: emailData.to,
        subject: emailData.subject,
        restaurantName,
        username
      })
      return { success: true }
    }

    // Send actual email in production
    const result = await sendEmail(emailData)
    if (result.success) {
      logger.info('Restaurant credentials email sent successfully', {
        to: email,
        restaurantName,
        username
      })
    } else {
      logger.error('Failed to send restaurant credentials email', {
        to: email,
        restaurantName,
        error: result.error
      })
    }

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Error sending restaurant credentials email', {
      error: errorMessage,
      email,
      restaurantName
    })
    return { success: false, error: errorMessage }
  }
}

/**
 * Send email using Nodemailer
 */
async function sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: `${process.env.FROM_NAME || 'Retenly'} <${process.env.FROM_EMAIL || 'noreply@retenly.in'}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    }

    const info = await transporter.sendMail(mailOptions)
    logger.info('Email sent successfully', {
      messageId: info.messageId,
      to: emailData.to,
      subject: emailData.subject
    })

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to send email', {
      error: errorMessage,
      to: emailData.to,
      subject: emailData.subject
    })
    return { success: false, error: errorMessage }
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
    text: `Email Configuration Test - If you receive this email, your Retenly email configuration is working correctly! Timestamp: ${new Date().toISOString()}`
  }

  return await sendEmail(emailData)
}
