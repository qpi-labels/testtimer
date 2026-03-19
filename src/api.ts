export interface User {
  uid: string;
  email: string;
  nickname: string;
  totalTime: number;
  subjectStats?: Record<string, number>;
}

export interface LeaderboardEntry {
  nickname: string;
  totalTime: number;
}

export interface ActiveUser {
  nickname: string;
  subject: string;
  startTime: number;
}

const GAS_URL = import.meta.env.VITE_GAS_URL;

// Mock data for preview if GAS_URL is not set
let mockUser: User | null = null;
let mockSubjectStats: Record<string, number> = {};
let mockLeaderboard: LeaderboardEntry[] = [
  { nickname: 'StudyKing', totalTime: 120 * 60 * 60 * 1000 },
  { nickname: 'FocusMaster', totalTime: 85 * 60 * 60 * 1000 },
  { nickname: 'Newbie', totalTime: 5 * 60 * 60 * 1000 },
];
let mockActiveUsers: ActiveUser[] = [
  { nickname: 'StudyKing', subject: '수학', startTime: Date.now() - 45 * 60 * 1000 },
  { nickname: 'FocusMaster', subject: '영어', startTime: Date.now() - 12 * 60 * 1000 },
];

export const api = {
  async login(token: string): Promise<User> {
    if (!GAS_URL) {
      mockUser = { uid: 'mock-uid', email: 'user@example.com', nickname: '', totalTime: 0, subjectStats: {} };
      return mockUser;
    }
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'login', token }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.user;
  },

  async setNickname(token: string, nickname: string): Promise<string> {
    if (!GAS_URL) {
      if (mockUser) mockUser.nickname = nickname;
      return nickname;
    }
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'setNickname', token, nickname }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.nickname;
  },

  async addLog(token: string, subject: string, startTime: number, endTime: number): Promise<{ totalTime: number; subjectStats: Record<string, number> }> {
    const durationMs = endTime - startTime;
    if (durationMs > 7 * 60 * 60 * 1000) {
      throw new Error('집중시간이 7시간을 초과하여 기록되지 않습니다. (부정행위 방지)');
    }
    if (!GAS_URL) {
      if (mockUser) {
        mockUser.totalTime += durationMs;
        mockSubjectStats[subject] = (mockSubjectStats[subject] || 0) + durationMs;
        mockUser.subjectStats = { ...mockSubjectStats };
      }
      const existing = mockLeaderboard.find(e => e.nickname === mockUser?.nickname);
      if (existing) {
        existing.totalTime += durationMs;
      } else if (mockUser?.nickname) {
        mockLeaderboard.push({ nickname: mockUser.nickname, totalTime: mockUser.totalTime });
      }
      mockLeaderboard.sort((a, b) => b.totalTime - a.totalTime);
      return { totalTime: mockUser?.totalTime || 0, subjectStats: mockSubjectStats };
    }
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'addLog', token, subject, startTime, endTime }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return { totalTime: data.totalTime, subjectStats: data.subjectStats || {} };
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (!GAS_URL) return [...mockLeaderboard];
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getLeaderboard' }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.leaderboard;
  },

  async getActiveUsers(): Promise<ActiveUser[]> {
    if (!GAS_URL) return [...mockActiveUsers];
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getActiveUsers' }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.activeUsers;
  },

  async setActive(token: string, subject: string, startTime: number | null): Promise<void> {
    if (!GAS_URL) {
      if (startTime && mockUser?.nickname) {
        const existing = mockActiveUsers.findIndex(u => u.nickname === mockUser?.nickname);
        if (existing >= 0) mockActiveUsers[existing] = { nickname: mockUser.nickname, subject, startTime };
        else mockActiveUsers.push({ nickname: mockUser.nickname, subject, startTime });
      } else if (mockUser?.nickname) {
        mockActiveUsers = mockActiveUsers.filter(u => u.nickname !== mockUser?.nickname);
      }
      return;
    }
    await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'setActive', token, subject, startTime }),
    });
  },
};
