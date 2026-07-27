import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDCL5FiLpBVvUmiqEIYHBvpJCPCJFgMrq8",
  authDomain: "taskbar-os.firebaseapp.com",
  databaseURL: "https://taskbar-os-default-rtdb.firebaseio.com",
  projectId: "taskbar-os",
  storageBucket: "taskbar-os.firebasestorage.app",
  messagingSenderId: "331927630275",
  appId: "1:331927630275:web:83ba4fd6e351a4553f4d76",
  measurementId: "G-ZT2G4M4XT9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
