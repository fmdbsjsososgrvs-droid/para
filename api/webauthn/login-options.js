/* 다솜이네 가족 — 로그인 1단계: 인증 옵션(challenge) 발급 */
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { createSessionToken } from '../../lib/session.js';
import { loadCredentials } from '../../lib/webauthn-store.js';

export async function GET(request) {
  const rpID = process.env.RP_ID;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!rpID || !sessionSecret) {
    return new Response('서버 환경변수(RP_ID, SESSION_SECRET)가 설정되지 않았습니다.', { status: 500 });
  }

  const credentials = loadCredentials();
  if (!credentials.length) {
    return Response.json(
      { error: '등록된 기기가 아직 없어요. 먼저 기기를 등록해주세요.' },
      { status: 400 }
    );
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: credentials.map((c) => ({ id: c.id })),
    userVerification: 'preferred',
  });

  const challengeToken = await createSessionToken(
    { purpose: 'webauthn-login', challenge: options.challenge },
    sessionSecret
  );

  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append(
    'Set-Cookie',
    `dasom_webauthn_challenge=${challengeToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=300`
  );
  return new Response(JSON.stringify(options), { status: 200, headers });
}
