// firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDC1BZEfNuerWGixWtRLJWf4KAFfk5uKG8",
  authDomain: "workinstruction-app-97094.firebaseapp.com",
  projectId: "workinstruction-app-97094",
  storageBucket: "workinstruction-app-97094.appspot.com",
  messagingSenderId: "824133484467",
  appId: "1:824133484467:web:f92fc9f8dab694faba15c6",
  measurementId: "G-MBZ4F1MLSW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc };
