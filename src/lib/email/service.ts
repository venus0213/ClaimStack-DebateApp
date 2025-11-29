import nodemailer from 'nodemailer'

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10)
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || ''
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || SMTP_USER
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'ClaimStack'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter
  }

  if (!SMTP_USER || !SMTP_PASSWORD) {
    throw new Error(
      'Email service is not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables.'
    )
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  })

  return transporter
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const mailTransporter = getTransporter()

    const mailOptions = {
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
    }

    const info = await mailTransporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
  } catch (error) {
    console.error('Error sending email:', error)
    throw new Error('Failed to send email. Please try again later.')
  }
}

export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const mailTransporter = getTransporter()
    await mailTransporter.verify()
    return true
  } catch (error) {
    console.error('Email configuration verification failed:', error)
    return false
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

export { APP_URL }

