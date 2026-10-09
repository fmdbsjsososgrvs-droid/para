/* 다솜이네 가족 — 로그인 2단계: 서명 검증 후 세션 쿠키 발급
 *
 * 성공하면 기존과 완전히 같은 방식(서명된 dasom_session 쿠키)으로
 * 세션을 발급합니다 — middleware.js는 손댈 필요가 없습니다.
 */
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { createSessionToken, verifySessionToken, readCookie } from '../../lib/session.js';
import { findCredential, base64urlDecode } from '../../lib/webauthn-store.js';

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

export async function POST(request) {
  const body = await request.json();

  const rpID = process.env.RP_ID;
  const origin = process.env.ORIGIN;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!rpID || !origin || !sessionSecret) {
    return new Response('서버 환경변수(RP_ID, ORIGIN, SESSION_SECRET)가 설정되지 않았습니다.', { status: 500 });
  }

  const challengeCookie = readCookie(request.headers.get('cookie'), 'dasom_webauthn_challenge');
  const payload = challengeCookie ? await verifySessionToken(challengeCookie, sessionSecret) : null;
  if (!payload || payload.purpose !== 'webauthn-login') {
    return Response.json({ error: '로그인 요청이 만료됐어요. 다시 시도해주세요.' }, { status: 400 });
  }

  const credentialID = body?.response?.id;
  const credRecord = credentialID ? findCredential(credentialID) : null;
  if (!credRecord) {
    return Response.json({ error: '등록되지 않은 기기예요.' }, { status: 400 });
  }

  let result;
  try {
    result = await verifyAuthenticationResponse({
      response: body.response,
      expectedChallenge: payload.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credRecord.id,
        publicKey: base64urlDecode(credRecord.publicKey),
        counter: credRecord.counter || 0,
      },
    });
  } catch (err) {
    console.error('login-verify failed', err);
    return Response.json({ error: '로그인 확인에 실패했어요: ' + err.message }, { status: 400 });
  }

  if (!result.verified) {
    return Response.json({ error: '로그인이 확인되지 않았어요.' }, { status: 400 });
  }

  // 참고: 서명 카운터(newCounter)는 저장소가 DB가 아니라 환경변수라
  // 요청마다 갱신해 저장할 수 없습니다. Face ID/Touch ID 같은 동기화되는
  // 패스키는 원래 카운터를 0으로 유지해서 영향이 없고, YubiKey처럼 진짜
  // 카운터를 올리는 기기는 복제 방지 2차 방어가 약해지는 정도입니다
  // (1차 방어인 매번 새로운 challenge 서명 확인은 그대로 유효합니다).

  const exp = Date.now() + THIRTY_DAYS_MS;
  const sessionToken = await createSessionToken(
    { cred: credRecord.id, label: credRecord.label || '', exp },
    sessionSecret
  );

  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append(
    'Set-Cookie',
    `dasom_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${THIRTY_DAYS_MS / 1000}`
  );
  headers.append(
    'Set-Cookie',
    'dasom_webauthn_challenge=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  );
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
