import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCfWTKNrS-JMMLmexOQhU3OL9Dn_b9ngRc",
  authDomain: "skyproperties-cf5c7.firebaseapp.com",
  projectId: "skyproperties-cf5c7",
  storageBucket: "skyproperties-cf5c7.firebasestorage.app",
  messagingSenderId: "685192866695",
  appId: "1:685192866695:web:8cfdad74a164b9be16c122",
  measurementId: "G-1G6QG2N4SW"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
