import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB_GprmNf14h-3DDNZ95Dm3iCguYUZA6P8",
  authDomain: "verify-ai-8f7e3.firebaseapp.com",
  projectId: "verify-ai-8f7e3",
  storageBucket: "verify-ai-8f7e3.firebasestorage.app",
  messagingSenderId: "33035928813",
  appId: "1:33035928813:web:a34ead96b9de3ec05538e4",
  measurementId: "G-J8JBRNMFWL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);