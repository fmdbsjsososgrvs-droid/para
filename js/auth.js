/* 다솜이네 가족 — 비밀번호 인증
 * 평문 비밀번호는 소스에 두지 않고, salt + SHA-256 해시값만 저장.
 * 실제 비밀번호는 salt와 함께 해시되어야 일치하기 때문에
 * 소스코드만 봐서는 원래 비밀번호를 알 수 없습니다.
 */
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
    err.textContent = ' ';

    const value = pw.value.trim();
    if (!value) return;

    try {
      const hashed = await sha256(`${SALT}:${value}`);
      if (hashed === PW_HASH) {
        // 인증 성공 → 세션에 짧은 토큰 저장
        sessionStorage.setItem(SESSION_KEY, hashed);
        location.href = 'home.html';
      } else {
        err.textContent = '비밀번호가 달라요 🥲';
        pw.value = '';
        pw.focus();
        // 흔들림 애니메이션 재생
        err.style.animation = 'none';
        void err.offsetWidth;
        err.style.animation = '';
      }
    } catch (e2) {
      err.textContent = '브라우저가 너무 오래된 것 같아요';
    }
  });

  // 이미 인증된 상태면 바로 홈으로
  if (sessionStorage.getItem(SESSION_KEY) === PW_HASH) {
    location.replace('home.html');
  }
})();
