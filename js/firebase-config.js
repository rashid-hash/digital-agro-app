import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, doc, getDocs, getDoc, updateDoc, onSnapshot, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// নতুন: Google Login এর জন্য Auth ইমপোর্ট করা হলো
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCDb30oXqdx46uMRt7Y5fpMIYjcitBW8aI",
  authDomain: "digital-agrofarm.firebaseapp.com",
  projectId: "digital-agrofarm",
  storageBucket: "digital-agrofarm.firebasestorage.app",
  messagingSenderId: "177019970714",
  appId: "1:177019970714:web:9e9ffbbdc4db7dd7586b23"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // নতুন: Auth ইনিশিয়ালাইজ করা হলো

// app.js থেকে সহজে অ্যাক্সেস করার জন্য এগুলোকে গ্লোবাল উইন্ডো অবজেক্টে সেট করা হলো
window.db = db;
window.fbFirestore = { collection, doc, getDocs, getDoc, updateDoc, onSnapshot, setDoc, deleteDoc };

// নতুন: লগইন সিস্টেমে ব্যবহারের জন্য Auth ভেরিয়েবল গ্লোবাল করা হলো
window.auth = auth;
window.fbAuth = { signInWithPopup, GoogleAuthProvider };