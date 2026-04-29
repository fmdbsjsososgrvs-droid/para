/* 인증되지 않은 접근 차단 — 모든 내부 페이지에서 첫번째로 로드
 * (정규 스크립트로 로드되어 DOM 파싱 전에 동기 redirect 가능)
 */
(function () {
  'use strict';
  const PW_HASH = '1e664ad3384ec1031281d698026f936c741c57493a1a0e1526e4d33e80c2e34e';
  const SESSION_KEY = 'dasom_family_auth';

  if (sessionStorage.getItem(SESSION_KEY) !== PW_HASH) {
    location.replace('index.html');
    return;
  }

  // 로그아웃 버튼 바인딩 — Firebase 익명 세션도 함께 종료
  document.addEventListener('DOMContentLoaded', () => {
    const out = document.getElementById('logout');
    if (!out) return;

    out.addEventListener('click', async (e) => {
      e.preventDefault();
      out.disabled = true;
      sessionStorage.removeItem(SESSION_KEY);
      try {
        // 동적 import — guard.js 가 정규 스크립트라서 모듈을 이렇게 가져옴
        const mod = await import('./firebase-init.js');
        await mod.signOutDasom();
      } catch (err) {
        console.warn('Firebase 로그아웃 실패 (무시 가능):', err);
      }
      location.replace('index.html');
    });
  });
})();
