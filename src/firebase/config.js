import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAbGQLNf5DaihauUnZhVA03TAQUO_6PwZk",
  authDomain: "ourstuff-firebase.firebaseapp.com",
  projectId: "ourstuff-firebase",
  storageBucket: "ourstuff-firebase.firebasestorage.app",
  messagingSenderId: "450756988196",
  appId: "1:450756988196:web:89ee37877b306bbb1277b1",
  measurementId: "G-JR0JC5Z47E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
