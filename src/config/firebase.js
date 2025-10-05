import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC_mhg3FtFkpT2D0_DszSZO9FjaiqC1-rA",
  authDomain: "geo-locked-class.firebaseapp.com",
  databaseURL:
    "https://geo-locked-class-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "geo-locked-class",
  storageBucket: "geo-locked-class.firebasestorage.app",
  messagingSenderId: "1081020234499",
  appId: "1:1081020234499:web:96f2f777e357743f8b0736",
  measurementId: "G-X90CH3QTK1",
};

const app = initializeApp(firebaseConfig);

const database = getDatabase(app);

const firestore = getFirestore(app);

export { database, firestore };
