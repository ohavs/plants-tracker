import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDZH8wtTZZbY1JG-HzKFNaRv_Vtb0qbIn4",
  authDomain: "plants-tracker-b9eae.firebaseapp.com",
  projectId: "plants-tracker-b9eae",
  storageBucket: "plants-tracker-b9eae.firebasestorage.app",
  messagingSenderId: "505041018009",
  appId: "1:505041018009:web:5db2003e39862b5ddeec08",
  measurementId: "G-J09D958EBP"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
