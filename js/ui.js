import { App, loginWithGoogle, logout } from './data.js';
import { renderAll, renderHUD, renderPanel } from './render.js';
import { commitDelta, endSession } from './timer.js';
import { dateKey, startOfDay, ensureDay, uid, fmtHMS } from './util.js';
import { auth, onAuthStateChanged } from './firebase.js';

export const ui = {};
const ids = [
    'studyHud', 'studyTime', 'goalBarFill', 'subjectSelect', 'subjectChips',
    'goalProgressBar', 'goalProgressText', 'kpiTodaySub', 'goalNow', 'panelSubtitle',
    'periodTodayBtn', 'periodWeekBtn', 'periodMonthBtn', 'kpiToday', 'kpiWeek',
    'kpiWeekSub', 'kpiMonth', 'kpiMonthSub', 'focusInfo', 'breakdownList',
    'weekdayBars', 'calDow', 'calTitle', 'calGrid', 'subjectsManageList',
    'goalHours', 'goalMinutes', 'openPanelBtn', 'closePanelBtn', 'addSubjectBtn',
    'addSubjectBtn2', 'modeTotalBtn', 'modeSubjectBtn', 'studyToggleBtn',
    'studyToggleIcon', 'studyToggleText', 'panelSheet', 'tabBtnStats',
    'tabBtnCalendar', 'tabBtnSubjects', 'tabBtnGoal', 'tabBtnLeaderboard', 'tabStats', 'tabCalendar',
    'tabSubjects', 'tabGoal', 'tabLeaderboard', 'loginBtn', 'loginStatusText', 'leaderboardList', 'calPrevBtn', 'calNextBtn', 'goalResetBtn',
    'goalSaveBtn', 'subjectModal', 'subjectModalTitle', 'subjectNameInput',
    'colorDots', 'subjectColorInput', 'subjectDeleteBtn', 'subjectCancelBtn',
    'subjectSaveBtn', 'dayDetailModal', 'dayDetailTitle', 'dayDetailSub',
    'dayDetailList', 'dayDetailCloseBtn', 'confirmModal', 'confirmTitle',
    'confirmText', 'confirmCancelBtn', 'confirmOkBtn', 'resetTodayBtn',
    'resetAllBtn', 'exportBtn', 'panelHR', 'panelScroll'
];

ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) ui[id] = el;
});

export function setActiveSubject(sid) {
    App.runtime.activeSubjectId = sid;
    App.store.settings.lastSubjectId = sid;
    if (App.runtime.running) {
        commitDelta(Date.now());
        App.runtime.sessionSubjectId = sid;
    }
    App.save();
    renderHUD();
}

export function startTimer() {
    App.runtime.running = true;
    App.runtime.lastTs = Date.now();
    App.runtime.sessionStartTs = startOfDay(Date.now());
    App.runtime.sessionSubjectId = App.runtime.activeSubjectId;
    App.runtime.focusStartTs = Date.now();
    
    if (ui.studyToggleIcon) {
        ui.studyToggleIcon.innerHTML = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`;
    }
    if (ui.studyToggleText) ui.studyToggleText.textContent = "PAUSE";
    if (ui.studyToggleBtn) ui.studyToggleBtn.classList.add('active');
    
    App.save();
    renderHUD();
}

export function stopTimer() {
    commitDelta(Date.now());
    endSession(Date.now());
    App.runtime.running = false;
    
    const focusMs = Date.now() - App.runtime.focusStartTs;
    const dk = dateKey(Date.now());
    const day = ensureDay(dk);
    if (focusMs > day.longestFocusMs) day.longestFocusMs = focusMs;
    if (focusMs > App.store.meta.bestFocusMs) App.store.meta.bestFocusMs = focusMs;
    
    if (ui.studyToggleIcon) {
        ui.studyToggleIcon.innerHTML = `<path d="M8 5V19L19 12L8 5Z"/>`;
    }
    if (ui.studyToggleText) ui.studyToggleText.textContent = "START";
    if (ui.studyToggleBtn) ui.studyToggleBtn.classList.remove('active');
    
    App.save();
    renderHUD();
}

export function maskChipbar() {
    // Optional visual effect for chipbar
}

let currentSubjectMode = 'add';
let currentSubjectId = null;

export function openSubjectModal(mode, sid = null) {
    currentSubjectMode = mode;
    currentSubjectId = sid;
    
    if (mode === 'add') {
        ui.subjectModalTitle.textContent = '과목 추가';
        ui.subjectNameInput.value = '';
        ui.subjectColorInput.value = '#90caf9';
        ui.subjectDeleteBtn.style.display = 'none';
    } else {
        ui.subjectModalTitle.textContent = '과목 수정';
        const s = App.store.subjects.find(x => x.id === sid);
        if (s) {
            ui.subjectNameInput.value = s.name;
            ui.subjectColorInput.value = s.color;
        }
        ui.subjectDeleteBtn.style.display = 'block';
    }
    
    ui.subjectModal.showModal();
}

export function openDayDetail(dk) {
    const day = App.store.days[dk];
    if (!day) return;
    
    ui.dayDetailTitle.textContent = dk;
    ui.dayDetailSub.textContent = `총 공부 시간: ${fmtHMS(day.totalMs)}`;
    ui.dayDetailList.innerHTML = '';
    
    Object.keys(day.subjects).forEach(sid => {
        const s = App.store.subjects.find(x => x.id === sid);
        const name = s ? s.name : '미분류';
        const ms = day.subjects[sid];
        
        const div = document.createElement('div');
        div.className = 'item flex-row';
        div.innerHTML = `
            <div class="item-name">${name}</div>
            <div class="item-time">${fmtHMS(ms)}</div>
        `;
        ui.dayDetailList.appendChild(div);
    });
    
    ui.dayDetailModal.showModal();
}

// Event Listeners
if (ui.studyToggleBtn) {
    ui.studyToggleBtn.addEventListener('click', () => {
        if (App.runtime.running) stopTimer();
        else startTimer();
    });
}

if (ui.modeTotalBtn) {
    ui.modeTotalBtn.addEventListener('click', () => {
        App.store.settings.viewMode = 'total';
        App.save();
        renderHUD();
    });
}

if (ui.modeSubjectBtn) {
    ui.modeSubjectBtn.addEventListener('click', () => {
        App.store.settings.viewMode = 'subject';
        App.save();
        renderHUD();
    });
}

if (ui.subjectSelect) {
    ui.subjectSelect.addEventListener('change', (e) => {
        setActiveSubject(e.target.value);
    });
}

if (ui.openPanelBtn) {
    ui.openPanelBtn.addEventListener('click', () => {
        App.runtime.panelOpen = true;
        ui.panelSheet.classList.add('open');
        renderPanel();
    });
}

if (ui.closePanelBtn) {
    ui.closePanelBtn.addEventListener('click', () => {
        App.runtime.panelOpen = false;
        ui.panelSheet.classList.remove('open');
    });
}

if (ui.loginBtn) {
    ui.loginBtn.addEventListener('click', () => {
        if (auth.currentUser) {
            logout();
        } else {
            loginWithGoogle();
        }
    });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        if (ui.loginBtn) ui.loginBtn.textContent = '로그아웃';
        if (ui.loginStatusText) ui.loginStatusText.textContent = `${user.displayName}님 환영합니다`;
    } else {
        if (ui.loginBtn) ui.loginBtn.textContent = '로그인';
        if (ui.loginStatusText) ui.loginStatusText.textContent = 'Google 로그인 후 참여 가능';
    }
    // Re-render panel if leaderboard is open
    if (App.store.settings.panelTab === 'leaderboard') {
        renderPanel();
    }
});

const tabs = ['Stats', 'Calendar', 'Subjects', 'Goal', 'Leaderboard'];
tabs.forEach(tab => {
    const btn = ui[`tabBtn${tab}`];
    if (btn) {
        btn.addEventListener('click', () => {
            App.store.settings.panelTab = tab.toLowerCase();
            App.save();
            renderPanel();
        });
    }
});

const periods = ['Today', 'Week', 'Month'];
periods.forEach(p => {
    const btn = ui[`period${p}Btn`];
    if (btn) {
        btn.addEventListener('click', () => {
            App.store.settings.statsPeriod = p.toLowerCase();
            App.save();
            renderPanel();
        });
    }
});

if (ui.addSubjectBtn) ui.addSubjectBtn.addEventListener('click', () => openSubjectModal('add'));
if (ui.addSubjectBtn2) ui.addSubjectBtn2.addEventListener('click', () => openSubjectModal('add'));

if (ui.subjectCancelBtn) ui.subjectCancelBtn.addEventListener('click', () => ui.subjectModal.close());

if (ui.subjectSaveBtn) {
    ui.subjectSaveBtn.addEventListener('click', () => {
        const name = ui.subjectNameInput.value.trim() || '새 과목';
        const color = ui.subjectColorInput.value;
        
        if (currentSubjectMode === 'add') {
            App.store.subjects.push({
                id: uid('s'),
                name,
                color,
                createdAt: Date.now()
            });
        } else {
            const s = App.store.subjects.find(x => x.id === currentSubjectId);
            if (s) {
                s.name = name;
                s.color = color;
            }
        }
        App.save();
        ui.subjectModal.close();
        renderAll();
    });
}

if (ui.subjectDeleteBtn) {
    ui.subjectDeleteBtn.addEventListener('click', () => {
        if (confirm('정말 삭제하시겠습니까?')) {
            App.store.subjects = App.store.subjects.filter(x => x.id !== currentSubjectId);
            if (App.runtime.activeSubjectId === currentSubjectId) {
                setActiveSubject('');
            }
            App.save();
            ui.subjectModal.close();
            renderAll();
        }
    });
}

if (ui.dayDetailCloseBtn) ui.dayDetailCloseBtn.addEventListener('click', () => ui.dayDetailModal.close());

if (ui.goalSaveBtn) {
    ui.goalSaveBtn.addEventListener('click', () => {
        const h = parseInt(ui.goalHours.value) || 0;
        const m = parseInt(ui.goalMinutes.value) || 0;
        App.store.settings.dailyGoalMs = (h * 3600 + m * 60) * 1000;
        App.save();
        renderAll();
    });
}

if (ui.goalResetBtn) {
    ui.goalResetBtn.addEventListener('click', () => {
        ui.goalHours.value = 2;
        ui.goalMinutes.value = 0;
        App.store.settings.dailyGoalMs = 2 * 3600 * 1000;
        App.save();
        renderAll();
    });
}

if (ui.resetTodayBtn) {
    ui.resetTodayBtn.addEventListener('click', () => {
        if (confirm('오늘 기록을 초기화하시겠습니까?')) {
            const dk = dateKey(Date.now());
            if (App.store.days[dk]) {
                App.store.days[dk] = { totalMs: 0, subjects: {}, sessions: [], longestFocusMs: 0 };
                App.save();
                renderAll();
            }
        }
    });
}

if (ui.resetAllBtn) {
    ui.resetAllBtn.addEventListener('click', () => {
        if (confirm('모든 기록을 초기화하시겠습니까? 복구할 수 없습니다.')) {
            App.reset();
            renderAll();
        }
    });
}

if (ui.calPrevBtn) {
    ui.calPrevBtn.addEventListener('click', () => {
        const d = new Date(App.store.settings.calendarMonthTs);
        d.setMonth(d.getMonth() - 1);
        App.store.settings.calendarMonthTs = d.getTime();
        App.save();
        renderPanel();
    });
}

if (ui.calNextBtn) {
    ui.calNextBtn.addEventListener('click', () => {
        const d = new Date(App.store.settings.calendarMonthTs);
        d.setMonth(d.getMonth() + 1);
        App.store.settings.calendarMonthTs = d.getTime();
        App.save();
        renderPanel();
    });
}
