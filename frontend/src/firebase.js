import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBOrlRyW6Ad7HzbfyrNbbcRBO_k5u7NO0Y",
  authDomain: "kaamwali-ai-28b97.firebaseapp.com",
  projectId: "kaamwali-ai-28b97",
  storageBucket: "kaamwali-ai-28b97.firebasestorage.app",
  messagingSenderId: "106397496883",
  appId: "1:106397496883:web:f193029aefdfc0f6449546",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔥 THIS IS IMPORTANT
export const auth = getAuth(app);