export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const RESEND_API_KEY = env.RESEND_API_KEY;
    const CONFIG_URL = env.CONFIG_URL;
    const DEFAULT_EMAIL = env.DEFAULT_EMAIL;
    const KV_CONFIG = env.KV_CONFIG;
    const KV_LOG = env.KV_LOG;

    let originalEmail;
    try { originalEmail = await request.json(); } 
    catch (e) { return new Response('Invalid JSON', { status: 400 }); }

    let config = await KV_CONFIG.get('mail_routes', 'json');
    if (!config) {
      const res = await fetch(CONFIG_URL);
      config = await res.json();
      await KV_CONFIG.put('mail_routes', JSON.stringify(config));
    }

    const domain = originalEmail.to.split('@')[1].toLowerCase();
    let status = 'ignored';
    let target = null;

    if (config.routes[domain]) {
      target = config.routes[domain];
      status = (await forwardEmail(target, originalEmail, RESEND_API_KEY)) ? 'forwarded' : 'failed';
    } else {
      target = DEFAULT_EMAIL;
      status = (await forwardEmail(target, originalEmail, RESEND_API_KEY)) ? 'default' : 'failed';
    }

    await logEmail(KV_LOG, originalEmail, status);
    return new Response(JSON.stringify({ status, target }), { status: 200 });
  }
}

async function forwardEmail(to, originalEmail, apiKey) {
  const payload = {
    from: originalEmail.from,
    to,
    subject: originalEmail.subject,
    html: originalEmail.html,
    text: originalEmail.text
  };
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return resp.ok;
}

async function logEmail(KV_LOG, email, status) {
  const timestamp = Date.now();
  const key = `log:${timestamp}:${email.id || crypto.randomUUID()}`;
  await KV_LOG.put(key, JSON.stringify({ ...email, status, timestamp }));
}
