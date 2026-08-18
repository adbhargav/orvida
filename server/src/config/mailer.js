import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER || '';
const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || '';
const service = process.env.EMAIL_SERVICE || null;

export const transporter = nodemailer.createTransport(
  service === 'gmail'
    ? {
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      }
    : {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      }
);

export const testMailer = async () => {
  if (!emailUser || !emailPass) {
    console.warn('Nodemailer SMTP credentials pending in .env file. Email notifications will operate in dry-run mode.');
    return false;
  }
  try {
    await transporter.verify();
    console.log('Nodemailer SMTP server connection verified successfully.');
    return true;
  } catch (error) {
    console.warn('Nodemailer SMTP connection notice:', error.message);
    return false;
  }
};
