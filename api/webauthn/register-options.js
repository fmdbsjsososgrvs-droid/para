/* 다솜이네 가족 — 패스키 등록 1단계: 등록 옵션(challenge) 발급
 *
 * SETUP_TOKEN을 아는 사람만(=가족과 Claude가 함께 등록할 때) 호출할 수 있습니다.
 * Node.js 런타임에서 돕니다 (@simplewebauthn/server가 Node 전용이라
 * Edge Middleware/Edge Function이 아닌 일반 Vercel Function으로 둡니다).
 */
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { createSessionToken } from '../../lib/session.js';
import { loadCredentials } from '../../lib/webauthn-store.js';

export async function GET(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const label = (url.searchParams.get('label') || '새 기기').slice(0, 40);

  const setupToken = process.env.SETUP_TOKEN;
  if (!setupToken || token !== setupToken) {
    return new Response(JSON.stringify({ error: '등록 권한이 없어요.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rpID = process.env.RP_ID;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!rpID || !sessionSecret) {
    return new Response('서버 환경변수(RP_ID, SESSION_SECRET)가 설정되지 않았습니다.', { status: 500 });
  }

  const existing = loadCredentials();
  const userID = crypto.getRandomValues(new Uint8Array(32));

  const options = await generateRegistrationOptions({
    rpName: '다솜이네 가족',
    rpID,
    userName: 'dasom-family',
    userID,
    attestationType: 'none',
    excludeCredentials: existing.map((c) => ({ id: c.id })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  const challengeToken = await createSessionToken(
    { purpose: 'webauthn-register', challenge: options.challenge, label },
    sessionSecret
  );

  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append(
    'Set-Cookie',
    `dasom_webauthn_challenge=${challengeToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=300`
  );
  return new Response(JSON.stringify(options), { status: 200, headers });
}
