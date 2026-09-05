/* 로그아웃 버튼 처리
 *
 * 접근 제어 자체는 이제 서버(middleware.js, Discord 로그인 세션 쿠키)가 담당합니다.
 * 이 스크립트는 각 내부 페이지의 "나가기" 버튼을 /api/auth/logout 으로 연결하는 역할만 합니다.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const out = document.getElementById('logout');
    if (!out) return;

    out.addEventListener('click', (e) => {
      e.preventDefault();
      location.href = '/api/auth/logout';
    });
  });
})();
