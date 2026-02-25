import type { APIRoute } from 'astro';
import { createHmac, randomBytes } from 'node:crypto';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: { user?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid request' }, 400);
  }

  const expectedUser = import.meta.env.COA_USER;
  const expectedPassword = import.meta.env.COA_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return json({ ok: false, error: 'COA auth not configured' }, 503);
  }

  const { user = '', password = '' } = body;

  const userMatch = user.trim() === expectedUser.trim();
  const passMatch = password === expectedPassword;

  if (!userMatch || !passMatch) {
    // Délai artificiel pour éviter le brute-force
    await new Promise(r => setTimeout(r, 600));
    return json({ ok: false, error: 'Identifiants incorrects' }, 401);
  }

  // Génère un token signé HMAC valide 8h
  const secret = import.meta.env.COA_SECRET || randomBytes(16).toString('hex');
  const expires = Date.now() + 8 * 60 * 60 * 1000;
  const nonce = randomBytes(8).toString('hex');
  const payload = `${expires}.${nonce}`;
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  const token = `${payload}.${sig}`;

  return json({ ok: true, token, expires });
};

const json = (data: object, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
