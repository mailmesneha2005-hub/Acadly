import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA4GVJJ2SB1CIHUrbgsW6MkskPcIkE8_nU",
  authDomain: "acadly-7c501.firebaseapp.com",
  projectId: "acadly-7c501",
  storageBucket: "acadly-7c501.firebasestorage.app",
  messagingSenderId: "590557501171",
  appId: "1:590557501171:web:f9f3ff53c816a9e5610986"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc
};