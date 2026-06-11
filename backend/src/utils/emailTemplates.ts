export interface EmailBranding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  companyName?: string;
  senderName?: string;
  senderEmail?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
}

export function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return result;
}

export function getWelcomeEmailTemplate(
  userName: string,
  tenantName: string,
  verifyUrl: string,
  branding: EmailBranding = {}
): EmailTemplate {
  const {
    logoUrl = 'https://via.placeholder.com/120x40?text=ParkSaaS',
    primaryColor = '#2563eb',
    secondaryColor = '#1e40af',
    accentColor = '#3b82f6',
    companyName = 'ParkSaaS',
    senderName = 'ParkSaaS Team'
  } = branding;

  const subject = `Welcome to ${companyName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${companyName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; }
    .header { background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); padding: 30px; text-align: center; }
    .logo { max-width: 120px; height: auto; }
    .content { padding: 40px 30px; }
    .title { color: #1a1a1a; font-size: 24px; font-weight: bold; margin: 0 0 20px 0; }
    .text { color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; }
    .button { display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .button:hover { background-color: ${secondaryColor}; }
    .footer { background-color: #f8f8f8; padding: 20px; text-align: center; color: #888888; font-size: 14px; }
    .footer a { color: ${primaryColor}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="${companyName}" class="logo" style="background: white; border-radius: 8px; padding: 10px;">
    </div>
    <div class="content">
      <h1 class="title">Welcome to ${companyName}!</h1>
      <p class="text">Hello ${userName},</p>
      <p class="text">Thank you for joining ${companyName}. Your account has been successfully created and we're excited to have you on board.</p>
      <p class="text">Please verify your email address to get started:</p>
      <a href="${verifyUrl}" class="button">Verify Email Address</a>
      <p class="text">If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p class="text" style="word-break: break-all; color: ${primaryColor};">${verifyUrl}</p>
      <p class="text">If you didn't create an account with us, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>Regards,<br>${senderName}</p>
      <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

export function getVerificationEmailTemplate(
  userName: string,
  tenantName: string,
  verifyUrl: string,
  branding: EmailBranding = {}
): EmailTemplate {
  const {
    logoUrl = 'https://via.placeholder.com/120x40?text=ParkSaaS',
    primaryColor = '#2563eb',
    secondaryColor = '#1e40af',
    companyName = 'ParkSaaS',
    senderName = 'ParkSaaS Team'
  } = branding;

  const subject = `Verify your email for ${companyName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Email</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; }
    .header { background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); padding: 30px; text-align: center; }
    .logo { max-width: 120px; height: auto; }
    .content { padding: 40px 30px; }
    .title { color: #1a1a1a; font-size: 24px; font-weight: bold; margin: 0 0 20px 0; }
    .text { color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; }
    .button { display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .button:hover { background-color: ${secondaryColor}; }
    .footer { background-color: #f8f8f8; padding: 20px; text-align: center; color: #888888; font-size: 14px; }
    .footer a { color: ${primaryColor}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="${companyName}" class="logo" style="background: white; border-radius: 8px; padding: 10px;">
    </div>
    <div class="content">
      <h1 class="title">Verify Your Email Address</h1>
      <p class="text">Hello ${userName},</p>
      <p class="text">Please verify your email address to complete your registration with ${companyName}.</p>
      <a href="${verifyUrl}" class="button">Verify Email Address</a>
      <p class="text">This link will expire in 10 minutes for your security.</p>
      <p class="text">If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p class="text" style="word-break: break-all; color: ${primaryColor};">${verifyUrl}</p>
      <p class="text">If you didn't request this verification, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>Regards,<br>${senderName}</p>
      <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

export function getPasswordResetEmailTemplate(
  userName: string,
  tenantName: string,
  resetUrl: string,
  branding: EmailBranding = {}
): EmailTemplate {
  const {
    logoUrl = 'https://via.placeholder.com/120x40?text=ParkSaaS',
    primaryColor = '#2563eb',
    secondaryColor = '#1e40af',
    companyName = 'ParkSaaS',
    senderName = 'ParkSaaS Team'
  } = branding;

  const subject = `Reset your password for ${companyName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; }
    .header { background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); padding: 30px; text-align: center; }
    .logo { max-width: 120px; height: auto; }
    .content { padding: 40px 30px; }
    .title { color: #1a1a1a; font-size: 24px; font-weight: bold; margin: 0 0 20px 0; }
    .text { color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; }
    .button { display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .button:hover { background-color: ${secondaryColor}; }
    .footer { background-color: #f8f8f8; padding: 20px; text-align: center; color: #888888; font-size: 14px; }
    .footer a { color: ${primaryColor}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="${companyName}" class="logo" style="background: white; border-radius: 8px; padding: 10px;">
    </div>
    <div class="content">
      <h1 class="title">Reset Your Password</h1>
      <p class="text">Hello ${userName},</p>
      <p class="text">We received a request to reset your password for your ${companyName} account.</p>
      <a href="${resetUrl}" class="button">Reset Password</a>
      <p class="text">This link will expire in 1 hour for your security.</p>
      <p class="text">If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p class="text" style="word-break: break-all; color: ${primaryColor};">${resetUrl}</p>
      <p class="text">If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
    </div>
    <div class="footer">
      <p>Regards,<br>${senderName}</p>
      <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

export function getOnboardingEmailTemplate(
  ownerName: string,
  tenantName: string,
  dashboardUrl: string,
  branding: EmailBranding = {}
): EmailTemplate {
  const {
    logoUrl = 'https://via.placeholder.com/120x40?text=ParkSaaS',
    primaryColor = '#2563eb',
    secondaryColor = '#1e40af',
    companyName = 'ParkSaaS',
    senderName = 'ParkSaaS Team'
  } = branding;

  const subject = `Welcome to ${companyName} - Your Parking Management System is Ready!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Onboarding</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; }
    .header { background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); padding: 30px; text-align: center; }
    .logo { max-width: 120px; height: auto; }
    .content { padding: 40px 30px; }
    .title { color: #1a1a1a; font-size: 24px; font-weight: bold; margin: 0 0 20px 0; }
    .text { color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; }
    .button { display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .button:hover { background-color: ${secondaryColor}; }
    .features { background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .feature { display: flex; align-items: center; margin: 10px 0; }
    .feature-icon { font-size: 20px; margin-right: 10px; }
    .footer { background-color: #f8f8f8; padding: 20px; text-align: center; color: #888888; font-size: 14px; }
    .footer a { color: ${primaryColor}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="${companyName}" class="logo" style="background: white; border-radius: 8px; padding: 10px;">
    </div>
    <div class="content">
      <h1 class="title">Welcome to ${companyName}!</h1>
      <p class="text">Hello ${ownerName},</p>
      <p class="text">Congratulations! Your parking management system "${tenantName}" is now ready to use. Here's what you can do:</p>
      
      <div class="features">
        <div class="feature">
          <span class="feature-icon">🚗</span>
          <span>Manage vehicle check-ins and check-outs</span>
        </div>
        <div class="feature">
          <span class="feature-icon">💰</span>
          <span>Track revenue and payments</span>
        </div>
        <div class="feature">
          <span class="feature-icon">📊</span>
          <span>View analytics and reports</span>
        </div>
        <div class="feature">
          <span class="feature-icon">👥</span>
          <span>Manage staff and customers</span>
        </div>
      </div>
      
      <a href="${dashboardUrl}" class="button">Access Your Dashboard</a>
      <p class="text">Get started by setting up your parking rates and adding your staff members.</p>
      <p class="text">If you have any questions, don't hesitate to reach out to our support team.</p>
    </div>
    <div class="footer">
      <p>Regards,<br>${senderName}</p>
      <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}
