/* ───────────────────────────────────────────
 * 다솜이네 가족 — Firebase 초기화 모듈 (ESM)
 *
 * 같은 Firestore에 다른 사이트의 컬렉션이 함께 들어 있으므로,
 * 이 사이트의 컬렉션은 모두 'dasom_' 접두어로 네임스페이스 합니다.
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

/* 컬렉션 이름 — 다른 사이트와 충돌 방지 */
export const COLS = {
  events: "dasom_events", // 달력 일정
  todos:  "dasom_todos",  // 해야 할일
  memos:  "dasom_memos",  // 메모장
};

export {
  db,
  collection, doc,
  addDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, getDocs,
  serverTimestamp,
};
