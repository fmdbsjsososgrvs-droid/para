/* 다솜이네 가족 — 접근 제어 Edge Middleware
 *
 * home.html / calendar.html / todo.html / memo.html 은
 * 유효한 세션 쿠키(Discord 로그인 + 허용된 사용자 ID 확인 완료)가 있어야만 통과합니다.
 * 없으면 로그인 화면(index.html)으로 돌려보냅니다.
 *
 * 반대로 "/" 나 index.html에 이미 유효한 세션으로 들어오면
 * (예: 로그인해두고 다른 사이트 갔다가 다시 들어온 경우) 로그인 화면을 또 보여주지 않고
 * 바로 home.html로 넘겨줍니다.
 */
import { next } from '@vercel/functions/middleware';
import { verifySessionToken, readCookie } from './lib/session.js';

export const config = {
  matcher: ['/', '/index.html', '/home.html', '/calendar.html', '/todo.html', '/memo.html'],
};

export default async function middleware(request) {
  const sessionSecret = process.env.SESSION_SECRET;
  const allowedUserId = process.env.DISCORD_ALLOWED_USER_ID;
  const token = readCookie(request.headers.get('cookie'), 'dasom_session');

  const payload = sessionSecret && token ? await verifySessionToken(token, sessionSecret) : null;
  const authed = Boolean(payload && allowedUserId && payload.id === allowedUserId);

  const url = new URL(request.url);
  const isGate = url.pathname === '/' || url.pathname === '/index.html';

  if (isGate) {
    // 이미 로그인된 상태로 로그인 화면에 들어오면 바로 home으로
    return authed ? Response.redirect(new URL('/home.html', url.origin), 302) : next();
  }

  if (!authed) {
    return Response.redirect(new URL('/index.html', url.origin), 302);
  }

  return next();
}
