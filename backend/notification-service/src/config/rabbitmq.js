const amqplib = require('amqplib');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const createEmailTemplate = (title, content) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #1e293b; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="background-color: #334155; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 1px;">FAST-EX</h1>
      </div>
      <div style="padding: 32px;">
        <h2 style="margin-top: 0; color: #0f172a; font-size: 18px; font-weight: 600;">${title}</h2>
        <div style="color: #475569; font-size: 14px;">
          ${content}
        </div>
        <div style="margin-top: 32px; padding-top: 24px; border-t: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          This is an automated message from the FAST-Ex platform. Please do not reply to this email.
        </div>
      </div>
    </div>
  </div>
`;

const connectRabbitMQConsumer = async () => {
  try {
    const connection = await amqplib.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue('email.otp', { durable: true });
    await channel.assertQueue('email.banned', { durable: true });
    await channel.assertQueue('email.unbanned', { durable: true });
    await channel.assertQueue('email.request', { durable: true });

    console.log('RabbitMQ Consumer connected (notification-service)');

    channel.consume('email.otp', async (msg) => {
      if (msg !== null) {
        const { email, otp } = JSON.parse(msg.content.toString());
        try {
          await transporter.sendMail({
            from: `"FAST-Ex" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Email Verification',
            html: createEmailTemplate('Verification Code', `
              <p>To finalize your account setup, please use the following one-time password (OTP):</p>
              <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-family: monospace; font-weight: 700; letter-spacing: 8px; color: #0f172a;">${otp}</span>
              </div>
              <p>This code is valid for 1 hour. If you did not request this, please disregard this message.</p>
            `)
          });
          console.log(`OTP Email sent to ${email}`);
          channel.ack(msg);
        } catch (err) {
          console.error(`Failed to send OTP email to ${email}`, err);
          channel.ack(msg);
        }
      }
    });

    channel.consume('email.banned', async (msg) => {
      if (msg !== null) {
        const { email } = JSON.parse(msg.content.toString());
        try {
          await transporter.sendMail({
            from: `"FAST-Ex Admin" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Account Notification',
            html: createEmailTemplate('Account Status Update', `
              <p>We are writing to inform you that your FAST-Ex account has been suspended.</p>
              <p>Access to the platform is currently restricted due to a violation of our terms of service or established usage policies.</p>
              <p>If you believe this is an error, please contact the administration department.</p>
            `)
          });
          console.log(`Banned Email sent to ${email}`);
          channel.ack(msg);
        } catch (err) {
          console.error(`Failed to send banned email to ${email}`, err);
          channel.ack(msg);
        }
      }
    });

    channel.consume('email.unbanned', async (msg) => {
      if (msg !== null) {
        const { email } = JSON.parse(msg.content.toString());
        try {
          await transporter.sendMail({
            from: `"FAST-Ex Admin" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Account Notification',
            html: createEmailTemplate('Account Status Update', `
              <p>Your FAST-Ex account has been reactivated by the administration.</p>
              <p>You may now log in to the platform and proceed with your normal activities.</p>
            `)
          });
          console.log(`Unbanned Email sent to ${email}`);
          channel.ack(msg);
        } catch (err) {
          console.error(`Failed to send unbanned email to ${email}`, err);
          channel.ack(msg);
        }
      }
    });

    channel.consume('email.request', async (msg) => {
      if (msg !== null) {
        const { ownerEmail, requesterEmail, listingTitle } = JSON.parse(msg.content.toString());
        try {
          await transporter.sendMail({
            from: `"FAST-Ex" <${process.env.EMAIL_USER}>`,
            to: ownerEmail,
            subject: 'Listing Inquiry',
            html: createEmailTemplate('New Item Request', `
              <p>A user has expressed interest in one of your active listings.</p>
              <div style="border-left: 4px solid #334155; padding-left: 16px; margin: 20px 0;">
                <p style="margin: 0; font-weight: 600; color: #0f172a;">Item: ${listingTitle}</p>
                <p style="margin: 4px 0 0 0; color: #64748b;">Requester: ${requesterEmail}</p>
              </div>
              <p>Please log in to your dashboard to review the request and manage the transaction.</p>
            `)
          });
          console.log(`Request Email sent to ${ownerEmail}`);
          channel.ack(msg);
        } catch (err) {
          console.error(`Failed to send request email to ${ownerEmail}`, err);
          channel.ack(msg);
        }
      }
    });

  } catch (err) {
    console.error('Failed to connect RabbitMQ (notification-service)', err);
  }
};

module.exports = { connectRabbitMQConsumer };
