/* 다솜이네 가족 — 로그아웃: 세션 쿠키를 지우고 로그인 화면으로 이동 */
export const config = { runtime: 'edge' };

export default function handler(request) {
  const url = new URL(request.url);
  const dest = new URL('/index.html', url.origin);
  const headers = new Headers();
  headers.set('Location', dest.toString());
  headers.append(
    'Set-Cookie',
    'dasom_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  );
  return new Response(null, { status: 302, headers });
}
