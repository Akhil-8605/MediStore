import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAyHvetWxLOrkG_5OEawENAp7oK2_4u14g",
    authDomain: "medistore-123.firebaseapp.com",
    projectId: "medistore-123",
    storageBucket: "medistore-123.firebasestorage.app",
    messagingSenderId: "971374497128",
    appId: "1:971374497128:web:7632a0eecef5438beb1add",
    measurementId: "G-GHCRZT8350"
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
