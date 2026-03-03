import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  User 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  where,
  getCountFromServer
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBkzJzSzSXvbOaSYs7csHLSp-8EgfEY1QQ",
  authDomain: "tacotyper.firebaseapp.com",
  projectId: "tacotyper",
  storageBucket: "tacotyper.firebasestorage.app",
  messagingSenderId: "781290974991",
  appId: "1:781290974991:web:77498a85bfe38e9fa5187a",
  measurementId: "G-50E6NTGN76"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const LEADERBOARD_PATH = "/artifacts/snake-oi/public/data/leaderboard";

export interface LeaderboardEntry {
  id?: string;
  name: string;
  score: number;
  mass: number;
  timestamp: any;
  uid: string;
}

export const signInGuest = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error("Error signing in anonymously:", error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
    // The user will be redirected, so we don't return a user here immediately.
    // The app should listen to onAuthStateChanged or getRedirectResult() on load.
    return null;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Add a helper to check for redirect results on load
export const checkRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Error getting redirect result:", error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const saveScore = async (user: User, score: number, mass: number, name: string) => {
  if (!user) return;

  try {
    // Check if user has a previous high score
    const userScoreRef = doc(db, LEADERBOARD_PATH, user.uid);
    const userScoreSnap = await getDoc(userScoreRef);

    if (userScoreSnap.exists()) {
      const data = userScoreSnap.data();
      if (score > data.score) {
        // Update only if new score is higher
        await setDoc(userScoreRef, {
          name,
          score,
          mass,
          timestamp: serverTimestamp(),
          uid: user.uid
        });
      }
    } else {
      // Create new entry
      await setDoc(userScoreRef, {
        name,
        score,
        mass,
        timestamp: serverTimestamp(),
        uid: user.uid
      });
    }
  } catch (error) {
    console.error("Error saving score:", error);
  }
};

export const getLeaderboard = async (limitCount = 10): Promise<LeaderboardEntry[]> => {
  try {
    const q = query(
      collection(db, LEADERBOARD_PATH),
      orderBy("score", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LeaderboardEntry));
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
};

export const getGlobalRank = async (score: number): Promise<number> => {
  try {
    const q = query(
      collection(db, LEADERBOARD_PATH),
      where("score", ">", score)
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count + 1;
  } catch (error) {
    console.error("Error fetching global rank:", error);
    return 0;
  }
};

export { auth, db };
