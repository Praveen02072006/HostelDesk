import nodemailer from 'nodemailer';
import { env } from './env';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.info(`Email sent to ${options.to}`);
  } catch (error) {
    logger.error('Email sending failed:', error);
    // Don't throw - email failures shouldn't break the app
  }
};

export const emailTemplates = {
  welcome: (name: string, role: string) => ({
    subject: '🏫 Welcome to HostelDesk!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">HostelDesk</h1>
          <p style="color: rgba(255,255,255,0.8);">Smart Hostel Management Platform</p>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1a202c;">Welcome, ${name}! 👋</h2>
          <p style="color: #4a5568;">Your account has been created successfully as a <strong>${role}</strong>.</p>
          <p style="color: #4a5568;">You can now log in and start using HostelDesk to manage hostel maintenance efficiently.</p>
          <a href="${env.FRONTEND_URL}/login" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Login to HostelDesk</a>
        </div>
      </div>
    `,
  }),

  passwordReset: (name: string, resetUrl: string) => ({
    subject: '🔐 Reset Your HostelDesk Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">HostelDesk</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1a202c;">Password Reset Request</h2>
          <p style="color: #4a5568;">Hi ${name}, we received a request to reset your password.</p>
          <p style="color: #4a5568;">Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #e53e3e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Reset Password</a>
          <p style="color: #a0aec0; font-size: 12px; margin-top: 24px;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `,
  }),

  complaintSubmitted: (name: string, ticketNumber: string, title: string) => ({
    subject: `✅ Complaint #${ticketNumber} Submitted Successfully`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">HostelDesk</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1a202c;">Complaint Submitted</h2>
          <p style="color: #4a5568;">Hi ${name}, your complaint has been submitted successfully.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0; color: #4a5568;"><strong>Ticket #:</strong> ${ticketNumber}</p>
            <p style="margin: 8px 0 0; color: #4a5568;"><strong>Issue:</strong> ${title}</p>
          </div>
          <a href="${env.FRONTEND_URL}/complaints/${ticketNumber}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Track Complaint</a>
        </div>
      </div>
    `,
  }),

  workerAssigned: (studentName: string, ticketNumber: string, workerName: string) => ({
    subject: `👷 Worker Assigned to Complaint #${ticketNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">HostelDesk</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1a202c;">Worker Assigned</h2>
          <p style="color: #4a5568;">Hi ${studentName}, a worker has been assigned to your complaint #${ticketNumber}.</p>
          <p style="color: #4a5568;"><strong>${workerName}</strong> will be handling your issue shortly.</p>
          <a href="${env.FRONTEND_URL}/complaints/${ticketNumber}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Track Complaint</a>
        </div>
      </div>
    `,
  }),
};
