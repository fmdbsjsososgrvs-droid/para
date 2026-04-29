/* 인증되지 않은 접근 차단 — 모든 내부 페이지에서 첫번째로 로드 */
(function () {
  'use strict';
  const PW_HASH = '1e664ad3384ec1031281d698026f936c741c57493a1a0e1526e4d33e80c2e34e';
  const SESSION_KEY = 'dasom_family_auth';
  if (sessionStorage.getItem(SESSION_KEY) !== PW_HASH) {
    location.replace('index.html');
  }

  // 로그아웃 버튼이 있다면 바인딩
  document.addEventListener('DOMContentLoaded', () => {
    const out = document.getElementById('logout');
    if (out) {
      out.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem(SESSION_KEY);
        location.replace('index.html');
      });
    }
  });
})();
