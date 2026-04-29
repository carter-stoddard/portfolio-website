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

    const row = (label, value) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid rgba(204,255,0,0.2);font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.45);width:140px;vertical-align:top;">${label}</td>
        <td style="padding:14px 0;border-bottom:1px solid rgba(204,255,0,0.2);font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#ffffff;">${value}</td>
      </tr>
    `;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#000000;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#0a0a0a;border:1px solid rgba(204,255,0,0.4);border-radius:8px;overflow:hidden;">

          <!-- Header bar -->
          <tr>
            <td style="background-color:#000000;padding:20px 32px;border-bottom:1px solid rgba(204,255,0,0.3);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:0.2em;color:#CCFF00;text-transform:uppercase;">
                    ● Incoming Transmission
                  </td>
                  <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.15em;color:rgba(255,255,255,0.4);text-transform:uppercase;">
                    Mission Brief
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero / heading -->
          <tr>
            <td style="padding:40px 32px 24px 32px;">
              <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:0.2em;color:rgba(255,255,255,0.4);text-transform:uppercase;">From</p>
              <h1 style="margin:0;font-family:'Arial Black',Arial,Helvetica,sans-serif;font-size:32px;font-weight:900;color:#ffffff;letter-spacing:-0.01em;line-height:1.1;">${escapeHtml(fullName)}</h1>
              <p style="margin:8px 0 0 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:18px;color:#CCFF00;">${escapeHtml(company)}</p>
            </td>
          </tr>

          <!-- Detail table -->
          <tr>
            <td style="padding:0 32px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${row('Email', `<a href="mailto:${escapeHtml(email)}" style="color:#CCFF00;text-decoration:none;border-bottom:1px solid rgba(204,255,0,0.4);">${escapeHtml(email)}</a>`)}
                ${row('Role', escapeHtml(role))}
                ${row('Services', escapeHtml(services))}
                ${row('Message', escapeHtml(message || '—').replace(/\n/g, '<br>'))}
                ${row('Consent', consent ? '<span style="color:#CCFF00;">✓ Agreed</span>' : 'No')}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 32px 32px 32px;">
              <a href="mailto:${escapeHtml(email)}" style="display:inline-block;background-color:#CCFF00;color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;padding:14px 28px;border-radius:4px;">Reply to ${escapeHtml(first_name)} →</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#000000;padding:20px 32px;border-top:1px solid rgba(204,255,0,0.2);">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.15em;color:rgba(255,255,255,0.35);text-transform:uppercase;text-align:center;">
                Carter Stoddard — Full-Stack Marketer &amp; Creative
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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
