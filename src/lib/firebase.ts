import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA_QdjJorvWI3qd--qbM4zHitVzsdxhxqw",
  authDomain: "posforhysomer.firebaseapp.com",
  projectId: "posforhysomer",
  storageBucket: "posforhysomer.firebasestorage.app",
  messagingSenderId: "751586317818",
  appId: "1:751586317818:web:8366010f807547d0c6c043",
  measurementId: "G-3L4Y5D8FKW"
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const db = getFirestore(app);
