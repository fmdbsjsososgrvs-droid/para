/* 다솜이네 가족 — 접근 제어 Edge Middleware
 *
 * home.html / calendar.html / todo.html / memo.html 은
 * 유효한 세션 쿠키(Discord 로그인 + 허용된 사용자 ID 확인 완료)가 있어야만 통과합니다.
 * 없으면 로그인 화면(index.html)으로 돌려보냅니다.
 */
import { next } from '@vercel/functions/middleware';
import { verifySessionToken, readCookie } from './lib/session.js';

export const config = {
  matcher: ['/home.html', '/calendar.html', '/todo.html', '/memo.html'],
};

export default async function middleware(request) {
  const sessionSecret = process.env.SESSION_SECRET;
  const allowedUserId = process.env.DISCORD_ALLOWED_USER_ID;
  const token = readCookie(request.headers.get('cookie'), 'dasom_session');

  const payload = sessionSecret && token ? await verifySessionToken(token, sessionSecret) : null;
  const authed = Boolean(payload && allowedUserId && payload.id === allowedUserId);

  if (!authed) {
    const url = new URL(request.url);
    return Response.redirect(new URL('/index.html', url.origin), 302);
  }

  return next();
}
