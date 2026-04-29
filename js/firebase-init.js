/* ───────────────────────────────────────────
 * 다솜이네 가족 — Firebase 초기화 모듈 (ESM)
 *
 * 같은 Firestore에 다른 사이트의 컬렉션이 함께 들어 있으므로,
 * 이 사이트의 컬렉션은 모두 'dasom_' 접두어로 네임스페이스 합니다.
 *
 * Firestore 보안 규칙은 'request.auth != null' 만족을 요구하므로,
 * 비밀번호 게이트를 통과한 사용자를 '익명 로그인' 시켜
 * 가족 컬렉션 전용 권한을 얻도록 합니다.
 * ─────────────────────────────────────────── */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDVV1xvAGMvruyGRhSUK7kMRRNVeZs6HVk",
  authDomain: "owlbutler.firebaseapp.com",
  projectId: "owlbutler",
  storageBucket: "owlbutler.firebasestorage.app",
  messagingSenderId: "855237503888",
  appId: "1:855237503888:web:46d78149d540bb5fc06115",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* 컬렉션 이름 — 다른 사이트와 충돌 방지 */
export const COLS = {
  events: "dasom_events", // 달력 일정
  todos:  "dasom_todos",  // 해야 할일
  memos:  "dasom_memos",  // 메모장
};

/* ───────────────────────────────────────────
 * ensureSignedIn()
 *  - 이미 로그인되어 있으면 그 user 반환
 *  - 아니면 onAuthStateChanged 한 번 들어 본 뒤,
 *    그래도 없으면 signInAnonymously 로 익명 로그인
 *  - 페이지 어디서든 await 해서 Firestore 호출 전에 호출하면 됨
 * ─────────────────────────────────────────── */
export async function ensureSignedIn() {
  if (auth.currentUser) return auth.currentUser;
  await new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, () => {
      unsub();
      resolve();
    });
  });
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

/* 로그아웃 (Firebase 익명 세션 종료) */
export async function signOutDasom() {
  try { await signOut(auth); } catch (e) { /* ignore */ }
}

export {
  db, auth,
  collection, doc,
  addDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, getDocs,
  serverTimestamp,
};
