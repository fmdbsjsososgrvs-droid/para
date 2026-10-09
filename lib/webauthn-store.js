/* 다솜이네 가족 — 등록된 패스키(Face ID/Touch ID/YubiKey 등) 목록 읽기
 *
 * 자격 증명(공개키)은 DB가 아니라 Vercel 환경변수(WEBAUTHN_CREDENTIALS)에
 * JSON 배열로 저장합니다. 가족이 쓰는 기기 몇 개만 등록하면 되고,
 * 등록은 항상 사람과 함께(Claude) 진행하기로 했기 때문에, 지금 쓰고 있는
 * 공개 Firestore(익명 인증만 통과하면 누구나 읽고 쓸 수 있음)에 두는 것보다
 * 이 방식이 안전합니다 — Firestore에 뒀다면 누구나 가짜 공개키를 끼워넣어
 * 로그인을 통째로 우회할 수 있습니다.
 *
 * 형식: [{ id, publicKey, counter, label }, ...]
 *  - id: 자격 증명 ID (base64url)
 *  - publicKey: COSE 공개키 바이트를 base64url로 인코딩한 값
 *  - counter: 서명 카운터(주로 YubiKey에서 의미 있음, Face ID/Touch ID는 보통 0)
 *  - label: 사람이 알아보는 이름 (예: "다솜이 아이폰")
 */
export function loadCredentials() {
  const raw = process.env.WEBAUTHN_CREDENTIALS;
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function findCredential(id) {
  return loadCredentials().find((c) => c.id === id) || null;
}

export function base64urlEncode(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

export function base64urlDecode(str) {
  return new Uint8Array(Buffer.from(str, 'base64url'));
}
