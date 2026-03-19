import { startOfMonth, dateKey, fmtHMS, uid } from './util.js';
import { auth, db, signInWithPopup, googleProvider, onAuthStateChanged, signOut, doc, setDoc, serverTimestamp } from './firebase.js';

const YPT_STORE_KEY_V2 = 'ypt_local_v2';
const LEGACY_STORE_KEY_V1 = 'studyTracker_v1';

// ---------- Storage ----------
const AppStorage = (() => {
	const defaultStore = () => ({
		version: 2,
		subjects: [],
		settings: {
			dailyGoalMs: 2 * 60 * 60 * 1000,
			lastSubjectId: '',
			viewMode: 'total',
			panelTab: 'stats',
			statsPeriod: 'today',
			calendarMonthTs: startOfMonth(Date.now()),
		},
		days: {},
		meta: {
			bestFocusMs: 0,
		}
	});

	function loadRaw(key) {
		try {
			const raw = localStorage.getItem(key);
			return raw ? JSON.parse(raw) : null;
		} catch { return null; }
	}

	function save(store) {
		localStorage.setItem(YPT_STORE_KEY_V2, JSON.stringify(store));
		syncToFirestore();
	}

	function migrateLegacyIfNeeded() {
		const existing = loadRaw(YPT_STORE_KEY_V2);
		if (existing) return existing;

		const legacy = loadRaw(LEGACY_STORE_KEY_V1);
		if (!legacy) return null;

		const st = defaultStore();
		try {
			const colorPresets = ['#90caf9','#a5d6a7','#f48fb1','#ffcc80','#ce93d8','#80cbc4','#fff59d','#b0bec5'];
			st.subjects = (legacy.subjects || []).map((s, i) => ({
				id: s.id || uid('s'),
				name: s.name || '과목',
				color: colorPresets[i % colorPresets.length],
				createdAt: Date.now(),
			}));
			st.settings.viewMode = legacy.meta?.mode === 'subject' ? 'subject' : 'total';
			st.settings.lastSubjectId = legacy.meta?.selectedSubjectId || '';
			const days = legacy.days || {};
			for (const dk of Object.keys(days)) {
				const d = days[dk] || {};
				const subjects = {};
				for (const sid of Object.keys(d.subjectSeconds || {})) {
					subjects[sid] = Math.round((d.subjectSeconds[sid] || 0) * 1000);
				}
				st.days[dk] = {
					totalMs: Math.round((d.totalSeconds || 0) * 1000),
					subjects,
					sessions: [],
					longestFocusMs: 0,
				};
			}
			save(st);
			return st;
		} catch {
			return null;
		}
	}

	function normalize(store) {
		const base = defaultStore();
		if (!store || typeof store !== 'object') return base;
		if (store.version !== 2) {
			store.version = 2;
		}
		store.subjects = Array.isArray(store.subjects) ? store.subjects : [];
		store.settings = { ...base.settings, ...(store.settings || {}) };
		store.days = store.days && typeof store.days === 'object' ? store.days : {};
		store.meta = { ...base.meta, ...(store.meta || {}) };

		store.subjects = store.subjects.map(s => ({
			id: s.id || uid('s'),
			name: (s.name || '과목').slice(0, 24),
			color: s.color || '#90caf9',
			createdAt: s.createdAt || Date.now(),
		}));

		for (const dk of Object.keys(store.days)) {
			const d = store.days[dk];
			if (!d || typeof d !== 'object') continue;
			if (typeof d.totalMs !== 'number') d.totalMs = 0;
			if (!d.subjects || typeof d.subjects !== 'object') d.subjects = {};
			if (!Array.isArray(d.sessions)) d.sessions = [];
			if (typeof d.longestFocusMs !== 'number') d.longestFocusMs = 0;
		}

		return store;
	}

	function load() {
		const migrated = migrateLegacyIfNeeded();
		if (migrated) return normalize(migrated);
		const raw = loadRaw(YPT_STORE_KEY_V2);
		return normalize(raw || defaultStore());
	}

	return { load, save, defaultStore };
})();

export const App = {
	store: AppStorage.load(),
	save: () => AppStorage.save(App.store),
	reset: () => { App.store = AppStorage.defaultStore(); App.save(); },
	runtime: {
		running: false,
		lastTs: 0,
		activeSubjectId: '',
		sessionStartTs: 0,
		sessionSubjectId: '',
		focusStartTs: 0,
		rafId: 0,
		lastUiTs: 0,
		lastSaveTs: 0,
		panelOpen: false
	}
};

window.appdump = () => {
	console.log("store:", App.store);
	console.log("runtime:", App.runtime);
};

// Firebase Auth & Sync
let currentUser = null;
let lastSyncMs = 0;

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        console.log("Logged in as:", user.displayName);
        syncToFirestore();
    }
});

export async function loginWithGoogle() {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        console.error("Login failed:", error);
    }
}

export async function logout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed:", error);
    }
}

async function syncToFirestore() {
    if (!currentUser) return;
    const dk = dateKey(Date.now());
    const dayData = App.store.days[dk];
    if (!dayData || dayData.totalMs <= 0) return;
    
    // Throttle sync to every 10 seconds
    const now = Date.now();
    if (now - lastSyncMs < 10000) return;
    lastSyncMs = now;

    const recordId = `${dk}_${currentUser.uid}`;
    try {
        await setDoc(doc(db, 'daily_records', recordId), {
            uid: currentUser.uid,
            userName: currentUser.displayName || '익명',
            date: dk,
            totalMs: dayData.totalMs,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Firestore sync error:", error);
    }
}

const GAS_URL = "https://script.google.com/macros/s/AKfycbzh4V2v2v4mzSkQQkf49FrRjRb3pCsnx4I0T4QBgC4CA8YA9JaRJmgOYee9Tq6hCrq-/exec";

async function sendDataToSheet(targetDateTs) {
	const key = dateKey(targetDateTs);
	const dayData = App.store.days[key];
	
	if (!dayData || dayData.totalMs <= 0) return;

    const userName = currentUser ? currentUser.displayName : (localStorage.getItem('ypt_user_name') || '익명');

	const payload = {
		date: key,
		userName: userName,
		totalMs: dayData.totalMs,
		formattedTime: fmtHMS(dayData.totalMs)
	};

	try {
		const response = await fetch(GAS_URL, {
			method: 'POST',
			body: JSON.stringify(payload)
		});
		if (response.ok) {
			console.log(`${key} 데이터 전송 성공: ${userName}`);
			localStorage.setItem(`synced_${key}`, "true");
		}
	} catch (e) {
		console.error("전송 오류:", e);
	}
}

export async function initAutoSync() {
	const allDays = Object.keys(App.store.days);
	const todayKey = dateKey(Date.now());
	
	for (const dk of allDays) {
		if (dk < todayKey && localStorage.getItem(`synced_${dk}`) !== "true") {
			const targetTs = new Date(dk).getTime();
			await sendDataToSheet(targetTs);
		}
	}

	setInterval(() => {
		const now = new Date();
		if (now.getHours() === 0 && now.getMinutes() === 0) {
			const yesterdayTs = Date.now() - 120000; 
			const yesterdayKey = dateKey(yesterdayTs);
			
			if (localStorage.getItem(`synced_${yesterdayKey}`) !== "true") {
				sendDataToSheet(yesterdayTs);
			}
		}
	}, 60000);
}

export function testSpecificTimeSync(targetHour, targetMinute) {
	console.log(`테스트 설정: ${targetHour}시 ${targetMinute}분`);
	
	const testInterval = setInterval(() => {
		const now = new Date();
		const currentH = now.getHours();
		const currentM = now.getMinutes();

		if (currentH === targetHour && currentM === targetMinute) {
			console.log("완");
			sendDataToSheet(Date.now());
			clearInterval(testInterval); 
		}
	}, 10000); 
}
