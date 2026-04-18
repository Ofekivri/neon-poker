import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDb2Lp9Su30zJiqTOYrZuqcG8Mt7hca084",
  authDomain: "neon-poker-45a0b.firebaseapp.com",
  projectId: "neon-poker-45a0b",
  storageBucket: "neon-poker-45a0b.firebasestorage.app",
  messagingSenderId: "653562059972",
  appId: "1:653562059972:web:b3e65ab8a739b5185ebd91",
  measurementId: "G-2BPZ2LSFJ4",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
