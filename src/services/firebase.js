
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDatwN_VPaEWAi3VByAsG4jpZxIEz518GI",
  authDomain: "bigbite-5b33f.firebaseapp.com",
  projectId: "bigbite-5b33f",
  storageBucket: "bigbite-5b33f.firebasestorage.app",
  messagingSenderId: "626650492274",
  appId: "1:626650492274:web:28a3cbc646c4cfdb5001eb",
  measurementId: "G-5L23QGDP90",
};

// Prevent duplicate Firebase initialization.
const app = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export { app };
export default app;
