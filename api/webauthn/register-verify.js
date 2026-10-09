/* 다솜이네 가족 — 패스키 등록 2단계: 브라우저가 만든 자격 증명 검증
 *
 * 이 엔드포인트는 결과를 저장하지 않습니다(저장소가 DB가 아니라
 * Vercel 환경변수라서, 함수가 자기 자신의 환경변수를 바꿀 수 없음).
 * 검증만 하고, 등록된 자격 증명 1개짜리 레코드를 화면에 돌려줘서
 * 사용자가 그 값을 복사해 WEBAUTHN_CREDENTIALS에 붙여넣도록 합니다.
 */
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { verifySessionToken, readCookie } from '../../lib/session.js';
import { loadCredentials, base64urlEncode } from '../../lib/webauthn-store.js';

export async function POST(request) {
  const body = await request.json();
  const setupToken = process.env.SETUP_TOKEN;
  if (!setupToken || body.token !== setupToken) {
    return Response.json({ error: '등록 권한이 없어요.' }, { status: 403 });
  }

  const rpID = process.env.RP_ID;
  const origin = process.env.ORIGIN;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!rpID || !origin || !sessionSecret) {
    return new Response('서버 환경변수(RP_ID, ORIGIN, SESSION_SECRET)가 설정되지 않았습니다.', { status: 500 });
  }

  const challengeCookie = readCookie(request.headers.get('cookie'), 'dasom_webauthn_challenge');
  const payload = challengeCookie ? await verifySessionToken(challengeCookie, sessionSecret) : null;
  if (!payload || payload.purpose !== 'webauthn-register') {
    return Response.json({ error: '등록 요청이 만료됐어요. 다시 시도해주세요.' }, { status: 400 });
  }

  let result;
  try {
    result = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge: payload.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (err) {
    console.error('register-verify failed', err);
    return Response.json({ error: '등록 확인에 실패했어요: ' + err.message }, { status: 400 });
  }

  if (!result.verified || !result.registrationInfo) {
    return Response.json({ error: '등록이 확인되지 않았어요.' }, { status: 400 });
  }

  const cred = result.registrationInfo.credential;
  const record = {
    id: cred.id,
    publicKey: base64urlEncode(cred.publicKey),
    counter: cred.counter,
    label: payload.label,
  };

  // 지금까지 등록된 것 + 이번에 새로 등록한 것을 합친 배열도 같이 보여줘서,
  // 2번째 기기부터는 통째로 복사해 넣기만 하면 되게 합니다.
  const allCredentials = [...loadCredentials(), record];

  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append(
    'Set-Cookie',
    'dasom_webauthn_challenge=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  );
  return new Response(
    JSON.stringify({ record, allCredentialsJSON: JSON.stringify(allCredentials) }),
    { status: 200, headers }
  );
}
