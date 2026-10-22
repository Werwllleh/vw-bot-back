import nodemailer from 'nodemailer';

const isSmtpConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

export const isEmailConfigured = () => isSmtpConfigured();

let transporter = null;

const getTransporter = () => {
  if (!transporter && isSmtpConfigured()) {
    const port = Number(process.env.SMTP_PORT) || 465;
    const authUser = process.env.SMTP_USER.includes('@')
      ? process.env.SMTP_USER
      : `${process.env.SMTP_USER}@yandex.ru`;

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // true for 465, false for 587/25
      auth: {
        user: authUser,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

export const sendPasswordResetEmail = async ({ to, resetUrl, userName = 'Автолюбитель' }) => {
  if (!isSmtpConfigured()) {
    console.warn('[email] SMTP не настроен в .env — отправка email пропущена');
    return false;
  }

  const mailer = getTransporter();

  const authUserEmail = process.env.SMTP_USER.includes('@')
    ? process.env.SMTP_USER
    : `${process.env.SMTP_USER}@yandex.ru`;

  // Яндекс SMTP строго требует, чтобы MAIL FROM совпадал с авторизованным аккаунтом
  const from = `VAGClub21 <${authUserEmail}>`;
  const replyTo = 'connect@vagclub21.ru';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #182232; background-color: #f8fafc; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #004c9d; margin: 0; font-size: 24px; font-weight: 700;">VAGClub21</h1>
        <p style="color: #64748b; margin: 6px 0 0 0; font-size: 14px;">Сообщество ценителей VAG</p>
      </div>

      <div style="background-color: #ffffff; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #182232;">Восстановление пароля</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
          Здравствуйте, <b>${userName}</b>! Вы запросили сброс пароля для входа в аккаунт на сайте <b>vagclub21.ru</b>.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 24px 0;">
          Для установки нового пароля нажмите на кнопку ниже:
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #004c9d; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 15px; font-weight: 600;">
            Сбросить пароль
          </a>
        </div>

        <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 24px 0 0 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          Ссылка действительна в течение <b>1 часа</b>.<br/>
          Если кнопка не открывается, скопируйте эту ссылку в адресную строку браузера:<br/>
          <a href="${resetUrl}" style="color: #004c9d; word-break: break-all;">${resetUrl}</a>
        </p>

        <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin: 16px 0 0 0;">
          Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
        </p>
      </div>
    </div>
  `;

  await mailer.sendMail({
    from,
    to,
    replyTo,
    subject: 'Сброс пароля на VAGClub21',
    html,
  });

  return true;
};
