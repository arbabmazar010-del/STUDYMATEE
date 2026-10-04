import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDNBDiz47IR9IdfnjtMb6Ywwaj85TUn2GM",
  authDomain: "studymate-98c69.firebaseapp.com",
  projectId: "studymate-98c69",
  storageBucket: "studymate-98c69.firebasestorage.app",
  messagingSenderId: "846168421058",
  appId: "1:846168421058:web:0b4e4253c77345cf0f015b",
  measurementId: "G-GLT63VDHR6"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize analytics if supported in browser environment
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  }).catch(() => {});
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
};
export type { FirebaseUser };
