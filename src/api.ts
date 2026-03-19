import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  orderBy, 
  limit, 
  increment,
  Timestamp
} from 'firebase/firestore';
import { signInWithPopup, googleProvider, auth, db, handleFirestoreError, OperationType } from './firebase';

export interface User {
  uid: string;
  email: string;
  nickname: string;
  totalTime: number;
  isStudying?: boolean;
  currentSubjectId?: string;
  lastActive?: number;
}

export interface Subject {
  id: string;
  name: string;
  totalTime: number;
}

export interface StudyLog {
  id: string;
  subjectId: string;
  subjectName: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface LeaderboardEntry {
  uid: string;
  nickname: string;
  totalTime: number;
  isStudying?: boolean;
}

export const api = {
  async login(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as User;
      } else {
        const newUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          nickname: '',
          totalTime: 0,
          isStudying: false,
          lastActive: Date.now()
        };
        await setDoc(userRef, newUser);
        return newUser;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'users/login');
      throw error;
    }
  },

  async setNickname(uid: string, nickname: string): Promise<string> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { nickname });
      return nickname;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      throw error;
    }
  },

  async addSubject(uid: string, name: string): Promise<Subject> {
    try {
      const subjectsRef = collection(db, 'users', uid, 'subjects');
      const docRef = await addDoc(subjectsRef, {
        name,
        totalTime: 0
      });
      return { id: docRef.id, name, totalTime: 0 };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${uid}/subjects`);
      throw error;
    }
  },

  async deleteSubject(uid: string, subjectId: string): Promise<void> {
    try {
      const subjectRef = doc(db, 'users', uid, 'subjects', subjectId);
      await deleteDoc(subjectRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}/subjects/${subjectId}`);
      throw error;
    }
  },

  async getSubjects(uid: string): Promise<Subject[]> {
    try {
      const subjectsRef = collection(db, 'users', uid, 'subjects');
      const snapshot = await getDocs(subjectsRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${uid}/subjects`);
      throw error;
    }
  },

  async updateStudyStatus(uid: string, isStudying: boolean, subjectId?: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        isStudying,
        currentSubjectId: subjectId || null,
        lastActive: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      throw error;
    }
  },

  async addLog(uid: string, subject: Subject, startTime: number, endTime: number): Promise<number> {
    const durationMs = endTime - startTime;
    if (durationMs > 7 * 60 * 60 * 1000) {
      throw new Error('집중시간이 7시간을 초과하여 기록되지 않습니다. (부정행위 방지)');
    }

    try {
      const userRef = doc(db, 'users', uid);
      const subjectRef = doc(db, 'users', uid, 'subjects', subject.id);
      const logsRef = collection(db, 'users', uid, 'studyLogs');

      // Add log
      await addDoc(logsRef, {
        subjectId: subject.id,
        subjectName: subject.name,
        startTime,
        endTime,
        duration: durationMs
      });

      // Update user total time
      await updateDoc(userRef, {
        totalTime: increment(durationMs),
        isStudying: false,
        lastActive: Date.now()
      });

      // Update subject total time
      await updateDoc(subjectRef, {
        totalTime: increment(durationMs)
      });

      const userDoc = await getDoc(userRef);
      return (userDoc.data() as User).totalTime;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/logs`);
      throw error;
    }
  },

  subscribeLeaderboard(callback: (entries: LeaderboardEntry[]) => void) {
    const q = query(collection(db, 'users'), orderBy('totalTime', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          nickname: data.nickname,
          totalTime: data.totalTime,
          isStudying: data.isStudying
        } as LeaderboardEntry;
      });
      callback(entries);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
  },

  subscribeCurrentlyStudying(callback: (entries: LeaderboardEntry[]) => void) {
    const q = query(collection(db, 'users'), where('isStudying', '==', true));
    return onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          nickname: data.nickname,
          totalTime: data.totalTime,
          isStudying: data.isStudying
        } as LeaderboardEntry;
      });
      callback(entries);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
  }
};
