import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy, limit, onSnapshot, getDocs, Timestamp, serverTimestamp, increment, addDoc, handleFirestoreError, OperationType, FirebaseUser } from './firebase';

export interface User {
  uid: string;
  email: string | null;
  nickname: string;
  totalTime: number;
  subjects: string[];
  subjectTimes: Record<string, number>;
  isStudying: boolean;
  currentSubject?: string;
  lastActive?: any;
}

export interface LeaderboardEntry {
  uid: string;
  nickname: string;
  totalTime: number;
  isStudying: boolean;
  currentSubject?: string;
}

export const api = {
  async login(): Promise<User | null> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        const newUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          nickname: '',
          totalTime: 0,
          subjects: ['국어', '영어', '수학'],
          subjectTimes: {},
          isStudying: false,
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...newUser,
          lastActive: serverTimestamp(),
        });
        return newUser;
      }
      
      return userDoc.data() as User;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'users');
      return null;
    }
  },

  async logout() {
    await signOut(auth);
  },

  async setNickname(uid: string, nickname: string): Promise<string> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        nickname,
        lastActive: serverTimestamp(),
      });
      return nickname;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      return nickname;
    }
  },

  async addSubject(uid: string, subject: string): Promise<string[]> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      const subjects = userDoc.data()?.subjects || [];
      if (!subjects.includes(subject)) {
        const newSubjects = [...subjects, subject];
        await updateDoc(doc(db, 'users', uid), {
          subjects: newSubjects,
          lastActive: serverTimestamp(),
        });
        return newSubjects;
      }
      return subjects;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      return [];
    }
  },

  async deleteSubject(uid: string, subject: string): Promise<string[]> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      const subjects = userDoc.data()?.subjects || [];
      const newSubjects = subjects.filter((s: string) => s !== subject);
      await updateDoc(doc(db, 'users', uid), {
        subjects: newSubjects,
        lastActive: serverTimestamp(),
      });
      return newSubjects;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      return [];
    }
  },

  async startStudy(uid: string, subject: string) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        isStudying: true,
        currentSubject: subject,
        lastActive: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  },

  async stopStudy(uid: string, subject: string, durationMs: number) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        isStudying: false,
        totalTime: increment(durationMs),
        [`subjectTimes.${subject}`]: increment(durationMs),
        lastActive: serverTimestamp(),
      });

      await addDoc(collection(db, 'logs'), {
        uid,
        subject,
        durationMs,
        startTime: Timestamp.fromMillis(Date.now() - durationMs),
        endTime: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'logs');
    }
  },

  onLeaderboardUpdate(callback: (entries: LeaderboardEntry[]) => void) {
    const q = query(collection(db, 'users'), orderBy('totalTime', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({
        uid: doc.id,
        nickname: doc.data().nickname,
        totalTime: doc.data().totalTime,
        isStudying: doc.data().isStudying,
        currentSubject: doc.data().currentSubject,
      }));
      callback(entries);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
  },

  onActiveUsersUpdate(callback: (entries: LeaderboardEntry[]) => void) {
    const q = query(collection(db, 'users'), where('isStudying', '==', true), limit(50));
    return onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({
        uid: doc.id,
        nickname: doc.data().nickname,
        totalTime: doc.data().totalTime,
        isStudying: doc.data().isStudying,
        currentSubject: doc.data().currentSubject,
      }));
      callback(entries);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
  }
};
