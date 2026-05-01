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
    await channel.assertQueue('email.account.status', { durable: true });
    await channel.assertQueue('listing.request', { durable: true });
    await channel.assertQueue('bargain.accepted', { durable: true });
    await channel.assertQueue('bargain.requested', { durable: true });
    await channel.assertQueue('exchange.requested', { durable: true });
    await channel.assertQueue('exchange.accepted', { durable: true });

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
              <p>This code is valid for 5 minutes. If you did not request this, please disregard this message.</p>
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

    channel.consume('email.account.status', async (msg) => {
      if (msg !== null) {
        const { email, name, status, isBanned } = JSON.parse(msg.content.toString());
        try {
          const subject = isBanned ? 'Account Suspended' : 'Account Reinstated';
          const statusColor = isBanned ? '#ef4444' : '#10b981';
          const statusText = isBanned ? 'SUSPENDED' : 'ACTIVE';
          
          await transporter.sendMail({
            from: `"FAST-Ex" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: subject,
            html: createEmailTemplate(subject, `
              <p>Hello ${name},</p>
              <p>This is to inform you that your FAST-Ex account status has been updated.</p>
              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin: 24px 0; border-left: 4px solid ${statusColor};">
                <p style="margin: 0; font-weight: 700; color: #0f172a;">Account Status: <span style="color: ${statusColor};">${statusText}</span></p>
              </div>
              ${isBanned ? `
                <p>Your account has been suspended due to a violation of our community guidelines or terms of service.</p>
                <p>While your account is suspended, you will not be able to:</p>
                <ul style="color: #475569; margin: 12px 0;">
                  <li>Create new listings</li>
                  <li>Make bargain offers</li>
                  <li>Send messages</li>
                  <li>Post comments</li>
                </ul>
                <p>If you believe this is a mistake or would like to appeal this decision, please contact our support team.</p>
              ` : `
                <p>Good news! Your account has been reinstated and you now have full access to all FAST-Ex features.</p>
                <p>You can now:</p>
                <ul style="color: #475569; margin: 12px 0;">
                  <li>Create and manage listings</li>
                  <li>Make bargain offers</li>
                  <li>Send messages</li>
                  <li>Post comments</li>
                </ul>
                <p>Thank you for being a part of the FAST-Ex community!</p>
              `}
            `)
          });
          console.log(`Account status email sent to ${email}: ${status}`);
          channel.ack(msg);
        } catch (err) {
          console.error(`Failed to send account status email to ${email}`, err);
          channel.ack(msg);
        }
      }
    });

    channel.consume('listing.request', async (msg) => {
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
              <p>Please log in to review the request.</p>
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

    channel.consume('bargain.accepted', async (msg) => {
      if (msg !== null) {
        const { requesterEmail, ownerEmail, listingTitle, message } = JSON.parse(msg.content.toString());
        try {
          await transporter.sendMail({
            from: `"FAST-Ex" <${process.env.EMAIL_USER}>`,
            to: requesterEmail,
            subject: 'Request Approved!',
            html: createEmailTemplate('Status Update: Approved', `
              <p>Great news! Your request for an item on FAST-Ex has been approved by the owner.</p>
              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin: 24px 0; border-left: 4px solid #10b981;">
                <p style="margin: 0; font-weight: 700; color: #0f172a;">Item: ${listingTitle}</p>
                <p style="margin: 8px 0 0 0; color: #1e293b;">Owner Contact: <span style="font-weight: 600;">${ownerEmail}</span></p>
                ${message ? `<p style="margin: 12px 0 0 0; font-style: italic; color: #475569;">" ${message} "</p>` : ''}
              </div>
              <p>You can now directly contact the lister using the email address above to coordinate the next steps.</p>
              <p>Happy trading!</p>
            `)
          });
          console.log(`Approval Email sent to ${requesterEmail}`);
          channel.ack(msg);
        } catch (err) {
          console.error(`Failed to send approval email to ${requesterEmail}`, err);
          channel.ack(msg);
        }
      }
    });

    channel.consume('bargain.requested', async (msg) => {
      if (msg !== null) {
        const { ownerEmail, requesterEmail, listingTitle, price, listingType } = JSON.parse(msg.content.toString());
        try {
          await transporter.sendMail({
            from: `"FAST-Ex" <${process.env.EMAIL_USER}>`,
            to: ownerEmail,
            subject: 'New Bargain Request',
            html: createEmailTemplate('Bargain Offer Received', `
              <p>Someone has made a bargain offer on your listing.</p>
              <div style="border-left: 4px solid #334155; padding-left: 16px; margin: 20px 0;">
                <p style="margin: 0; font-weight: 600; color: #0f172a;">Item: ${listingTitle}</p>
                <p style="margin: 4px 0 0 0; color: #64748b;">Requester: ${requesterEmail}</p>
                <p style="margin: 4px 0 0 0; color: #0f172a; font-weight: 600;">Offered Price: ${price} ${listingType === 'RENT' ? '/hour' : ''}</p>
              </div>
              <p>Please log in to review.</p>
            `)
          });
          console.log(`Bargain Email sent to ${ownerEmail}`);
          channel.ack(msg);
        } catch (err) {
          console.error(`Failed to send bargain email to ${ownerEmail}`, err);
          channel.ack(msg);
        }
      }
    });

    channel.consume('exchange.requested', async (msg) => {
      if (msg !== null) {
        const { ownerEmail, requesterEmail, listingTitle, offerTitle, offerDescription, offerImageUrl } = JSON.parse(msg.content.toString());
        try {
          await transporter.sendMail({
            from: `"FAST-Ex" <${process.env.EMAIL_USER}>`,
            to: ownerEmail,
            subject: 'New Exchange Request',
            html: createEmailTemplate('Exchange Offer Received', `
              <p>Someone wants to exchange an item for your listing.</p>
              <div style="border-left: 4px solid #334155; padding-left: 16px; margin: 20px 0;">
                <p style="margin: 0; font-weight: 600; color: #0f172a;">Your Item: ${listingTitle}</p>
                <p style="margin: 8px 0 0 0; color: #64748b;">Requester: ${requesterEmail}</p>
              </div>
              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; font-weight: 600; color: #0f172a;">They're Offering:</p>
                <p style="margin: 8px 0 0 0; font-weight: 600;">${offerTitle}</p>
                <p style="margin: 4px 0 0 0; color: #475569;">${offerDescription}</p>
                ${offerImageUrl ? `<p style="margin: 8px 0 0 0;"><a href="${offerImageUrl}" style="color: #334155;">View Image</a></p>` : ''}
              </div>
              <p>Please log in to review.</p>
            `)
          });
          console.log(`Exchange Email sent to ${ownerEmail}`);
          channel.ack(msg);
        } catch (err) {
          console.error(`Failed to send exchange email to ${ownerEmail}`, err);
          channel.ack(msg);
        }
      }
    });

    channel.consume('exchange.accepted', async (msg) => {
      if (msg !== null) {
        const { requesterEmail, ownerEmail, listingTitle, message } = JSON.parse(msg.content.toString());
        try {
          await transporter.sendMail({
            from: `"FAST-Ex" <${process.env.EMAIL_USER}>`,
            to: requesterEmail,
            subject: 'Exchange Approved!',
            html: createEmailTemplate('Status Update: Exchange Approved', `
              <p>Great news! Your exchange offer has been approved by the owner.</p>
              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin: 24px 0; border-left: 4px solid #10b981;">
                <p style="margin: 0; font-weight: 700; color: #0f172a;">Item: ${listingTitle}</p>
                <p style="margin: 8px 0 0 0; color: #1e293b;">Owner Contact: <span style="font-weight: 600;">${ownerEmail}</span></p>
                ${message ? `<p style="margin: 12px 0 0 0; font-style: italic; color: #475569;">" ${message} "</p>` : ''}
              </div>
              <p>You can now directly contact the lister using the email address above to coordinate the exchange.</p>
              <p>Happy trading!</p>
            `)
          });
          console.log(`Exchange Approval Email sent to ${requesterEmail}`);
          channel.ack(msg);
        } catch (err) {
          console.error(`Failed to send exchange approval email to ${requesterEmail}`, err);
          channel.ack(msg);
        }
      }
    });

  } catch (err) {
    console.error('Failed to connect RabbitMQ (notification-service)', err);
  }
};

module.exports = { connectRabbitMQConsumer };
