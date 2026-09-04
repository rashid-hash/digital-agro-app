import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, doc, getDocs, getDoc, updateDoc, onSnapshot, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// আপনার ফায়ারবেস কনসোল থেকে এই কনফিগ কোডটি কপি করে এখানে বসাবেন
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

// app.js থেকে সহজে অ্যাক্সেস করার জন্য এগুলোকে গ্লোবাল উইন্ডো অবজেক্টে সেট করা হলো
window.db = db;
window.fbFirestore = { collection, doc, getDocs, getDoc, updateDoc, onSnapshot, setDoc, deleteDoc };