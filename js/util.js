import { App } from './data.js';

export function pad2(n) {
    return String(n).padStart(2, '0');
}

export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

export function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function uid(prefix = '') {
    return prefix + Math.random().toString(36).substr(2, 9);
}

export function dateKey(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function startOfDay(ts) {
    const d = new Date(ts);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function endOfDay(ts) {
    const d = new Date(ts);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
}

export function startOfWeek(ts) {
    const d = new Date(ts);
    const day = d.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
    return new Date(d.getFullYear(), d.getMonth(), diff).getTime();
}

export function startOfMonth(ts) {
    const d = new Date(ts);
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

export function daysInMonth(ts) {
    const d = new Date(ts);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function fmtHMS(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

export function ensureDay(dk) {
    if (!App.store.days[dk]) {
        App.store.days[dk] = {
            totalMs: 0,
            subjects: {},
            sessions: [],
            longestFocusMs: 0
        };
    }
    return App.store.days[dk];
}
