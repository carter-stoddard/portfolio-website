import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Carter Stoddard <forms@carterstoddard.com>';
const TO = 'carter@carterstoddard.com';

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      first_name,
      last_name,
      email,
      company,
      role,
      services,
      message,
      consent,
    } = req.body || {};

    if (!first_name || !last_name || !email || !company || !role || !services || !consent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const fullName = `${first_name} ${last_name}`;
    const subject = `New mission brief from ${fullName} — ${company}`;

    const html = `
      <h2 style="font-family: Arial, sans-serif; color: #111;">New Mission Brief</h2>
      <table style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; border-collapse: collapse;">
        <tr><td style="padding: 4px 12px 4px 0; color: #666;"><strong>Name</strong></td><td>${escapeHtml(fullName)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #666;"><strong>Email</strong></td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #666;"><strong>Company</strong></td><td>${escapeHtml(company)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #666;"><strong>Role</strong></td><td>${escapeHtml(role)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #666;"><strong>Services</strong></td><td>${escapeHtml(services)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #666; vertical-align: top;"><strong>Message</strong></td><td>${escapeHtml(message || '(none)').replace(/\n/g, '<br>')}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #666;"><strong>Consent</strong></td><td>${consent ? 'Yes' : 'No'}</td></tr>
      </table>
    `;

    const text = `New Mission Brief

Name: ${fullName}
Email: ${email}
Company: ${company}
Role: ${role}
Services: ${services}
Message: ${message || '(none)'}
Consent: ${consent ? 'Yes' : 'No'}
`;

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: TO,
      reply_to: email,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('[resend]', error);
      return res.status(500).json({ error: 'Email send failed' });
    }

    return res.status(200).json({ ok: true, id: data?.id });
  } catch (err) {
    console.error('[contact-api]', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
