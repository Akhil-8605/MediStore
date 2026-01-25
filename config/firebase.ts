import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAKT6kTGQzCeA0X60q7MO6vd4aZk6MdP0U",
    authDomain: "medistore-8605.firebaseapp.com",
    projectId: "medistore-8605",
    storageBucket: "medistore-8605.firebasestorage.app",
    messagingSenderId: "827077964566",
    appId: "1:827077964566:web:1f78f6d9c9f465bdf41637",
    measurementId: "G-C8Z9933WNN"
};

const app = initializeApp(firebaseConfig);

let analytics;
if (typeof window !== "undefined") {
    analytics = getAnalytics(app);
}

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage, analytics };
