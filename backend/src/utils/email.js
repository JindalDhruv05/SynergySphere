import nodemailer from 'nodemailer';
import config from 'config';

// Create reusable transporter
const transporter = nodemailer.createTransport(config.get('email.smtp'));

/**
 * Send email
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.text - Plain text content
 * @param {String} options.html - HTML content (optional)
 * @returns {Promise} - Nodemailer info object
 */
export const sendEmail = async (options) => {
  const mailOptions = {
    from: config.get('email.from'),
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
    throw error;
  }
};
