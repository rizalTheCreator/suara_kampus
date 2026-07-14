/**
 * SUARA KAMPUS - API Configuration
 * Central fetch wrapper with auth token management & error handling
 */

const API = (() => {
    const BASE_URL = 'http://localhost:8000/api'; // Laravel / Node.js backend URL
    const TOKEN_KEY = 'sk_token';
    const USER_KEY  = 'sk_user';

    // ── Token Helpers ──────────────────────────────────────────
    const getToken = () => localStorage.getItem(TOKEN_KEY);
    const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
    const removeToken = () => localStorage.removeItem(TOKEN_KEY);

    const getUser = () => {
        try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
    };
    const setUser = (u) => localStorage.setItem(USER_KEY, JSON.stringify(u));
    const removeUser = () => localStorage.removeItem(USER_KEY);

    const isLoggedIn = () => !!getToken();

    // ── Default Headers ────────────────────────────────────────
    const headers = (extra = {}) => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...extra,
    });

    // ── Response Handler ───────────────────────────────────────
    const handle = async (res) => {
        if (res.status === 401) {
            removeToken(); removeUser();
            window.location.href = 'login.html';
            return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw { status: res.status, message: data.message || 'Terjadi kesalahan', errors: data.errors };
        return data;
    };

    // ── Core Methods ───────────────────────────────────────────
    const get = (path, params = {}) => {
        const qs = Object.keys(params).length ? '?' + new URLSearchParams(params) : '';
        return fetch(`${BASE_URL}${path}${qs}`, { headers: headers() }).then(handle);
    };

    const post = (path, body = {}, isForm = false) => {
        const opts = isForm
            ? { method: 'POST', headers: { Accept: 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) }, body }
            : { method: 'POST', headers: headers(), body: JSON.stringify(body) };
        return fetch(`${BASE_URL}${path}`, opts).then(handle);
    };

    const put = (path, body = {}) =>
        fetch(`${BASE_URL}${path}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) }).then(handle);

    const patch = (path, body = {}) =>
        fetch(`${BASE_URL}${path}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) }).then(handle);

    const del = (path) =>
        fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers: headers() }).then(handle);

    // ── Mock Mode (Frontend prototype — returns dummy data) ────
    let mockMode = true; // Toggle false when real backend is ready
    const mock = (data, delay = 400) =>
        new Promise(resolve => setTimeout(() => resolve(data), delay));

    return { BASE_URL, getToken, setToken, removeToken, getUser, setUser, removeUser, isLoggedIn, get, post, put, patch, del, mock, get mockMode() { return mockMode; }, set mockMode(v) { mockMode = v; } };
})();

export default API;
