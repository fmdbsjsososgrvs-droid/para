/* 다솜이네 가족 — Discord 로그인 콜백
 * Discord가 인증 코드를 들고 이 주소로 돌려보내면:
 *   1) state 값으로 CSRF 확인
 *   2) 코드를 access token으로 교환
 *   3) 그 토큰으로 본인 Discord 정보 조회
 *   4) 허용된 사용자 ID(DISCORD_ALLOWED_USER_ID)와 일치하는지 확인
 *   5) 통과하면 서명된 세션 쿠키 발급 후 home.html로 이동
 */
import { createSessionToken, readCookie } from '../../lib/session.js';

export const config = { runtime: 'edge' };

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

function redirectWithError(origin, reason) {
  const dest = new URL('/index.html', origin);
  dest.searchParams.set('error', reason);
  // Response.redirect()는 헤더가 읽기 전용이라 Set-Cookie를 못 붙이므로 직접 만듭니다.
  const headers = new Headers();
  headers.set('Location', dest.toString());
  // 실패했어도 state 쿠키는 정리
  headers.append(
    'Set-Cookie',
    'dasom_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  );
  return new Response(null, { status: 302, headers });
}

export default async function handler(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = readCookie(request.headers.get('cookie'), 'dasom_oauth_state');

  if (!code || !state || !savedState || state !== savedState) {
    return redirectWithError(url.origin, 'invalid_state');
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  const allowedUserId = process.env.DISCORD_ALLOWED_USER_ID;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!clientId || !clientSecret || !redirectUri || !allowedUserId || !sessionSecret) {
    return new Response('서버 환경변수(DISCORD_*, SESSION_SECRET)가 모두 설정되지 않았습니다.', {
      status: 500,
    });
  }

  let tokenData;
  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) return redirectWithError(url.origin, 'token_exchange_failed');
    tokenData = await tokenRes.json();
  } catch {
    return redirectWithError(url.origin, 'token_exchange_failed');
  }

  let user;
  try {
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) return redirectWithError(url.origin, 'user_fetch_failed');
    user = await userRes.json();
  } catch {
    return redirectWithError(url.origin, 'user_fetch_failed');
  }

  if (user.id !== allowedUserId) {
    return redirectWithError(url.origin, 'not_allowed');
  }

  const exp = Date.now() + THIRTY_DAYS_MS;
  const token = await createSessionToken({ id: user.id, exp }, sessionSecret);

  const dest = new URL('/home.html', url.origin);
  const headers = new Headers();
  headers.set('Location', dest.toString());
  headers.append(
    'Set-Cookie',
    `dasom_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${THIRTY_DAYS_MS / 1000}`
  );
  headers.append(
    'Set-Cookie',
    'dasom_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  );
  return new Response(null, { status: 302, headers });
}
