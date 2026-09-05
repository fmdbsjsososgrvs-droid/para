/* 다솜이네 가족 — Discord 로그인 시작
 * "/api/auth/login" 접속 시 Discord 인증 화면으로 리다이렉트합니다.
 */
export const config = { runtime: 'edge' };

export default function handler(request) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return new Response('서버에 DISCORD_CLIENT_ID / DISCORD_REDIRECT_URI 환경변수가 설정되지 않았습니다.', {
      status: 500,
    });
  }

  const state = crypto.randomUUID();

  const authorizeUrl = new URL('https://discord.com/api/oauth2/authorize');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'identify');
  authorizeUrl.searchParams.set('state', state);

  // 주의: Response.redirect()가 만드는 응답은 헤더가 읽기 전용이라 쿠키를 추가로 못 붙입니다.
  // 그래서 Location + Set-Cookie를 처음부터 직접 갖춘 Response를 만듭니다.
  const headers = new Headers();
  headers.set('Location', authorizeUrl.toString());
  headers.append(
    'Set-Cookie',
    `dasom_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );
  return new Response(null, { status: 302, headers });
}
