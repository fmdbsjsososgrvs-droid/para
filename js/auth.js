/* 다솜이네 가족 — 비밀번호 인증 (모듈)
 *
 * 1) 입력 비밀번호를 SALT와 함께 SHA-256 해시
 * 2) 사전에 저장된 해시와 일치하면
 *    a) sessionStorage에 인증 토큰 저장
 *    b) Firebase에 익명 로그인 (Firestore 보안 규칙 통과용)
 *    c) home.html 으로 이동
 */
import { ensureSignedIn } from './firebase-init.js';

(function () {
  'use strict';

  // 'dasom-family-salt-2026:3621@' 의 SHA-256 해시
  const SALT = 'dasom-family-salt-2026';
  const PW_HASH = '1e664ad3384ec1031281d698026f936c741c57493a1a0e1526e4d33e80c2e34e';
  const SESSION_KEY = 'dasom_family_auth';

  async function sha256(text) {
    const buf = new TextEncoder().encode(text);
    const hashBuf = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hashBuf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  const form = document.getElementById('pwForm');
  const pw = document.getElementById('pw');
  const err = document.getElementById('err');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = ' ';

    const value = pw.value.trim();
    if (!value) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const hashed = await sha256(`${SALT}:${value}`);
      if (hashed !== PW_HASH) {
        err.textContent = '비밀번호가 달라요 🥲';
        pw.value = '';
        pw.focus();
        // 흔들림 애니메이션 재생
        err.style.animation = 'none';
        void err.offsetWidth;
        err.style.animation = '';
        return;
      }

      // Firebase 익명 로그인 (Firestore 권한 획득)
      try {
        await ensureSignedIn();
      } catch (e2) {
        console.error(e2);
        err.textContent = '서버 인증에 실패했어요. 잠시 후 다시 시도해주세요.';
        return;
      }

      // 인증 성공
      sessionStorage.setItem(SESSION_KEY, hashed);
      location.href = 'home.html';
    } catch (e3) {
      console.error(e3);
      err.textContent = '브라우저가 너무 오래된 것 같아요';
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // 이미 인증된 상태면 바로 홈으로
  if (sessionStorage.getItem(SESSION_KEY) === PW_HASH) {
    location.replace('home.html');
  }
})();
