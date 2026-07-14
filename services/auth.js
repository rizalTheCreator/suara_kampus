/**
 * SUARA KAMPUS - Auth Service
 * POST /api/auth/login | register | logout | change-password | reset-password
 */

import API from '../api/config.js';

// ── Dummy users (prototype mock) ────────────────────────────────
const MOCK_USERS = [
    {
        id: 1, username: '2407043', password: 'password123',
        role: 'mahasiswa', first_login: false,
        profile: { nama: 'Nurhuda', nim: '2407043', email: '2407043@itg.ac.id', prodi: 'Sistem Informasi', foto: null }
    },
    {
        id: 2, username: 'admin', password: 'itg@garut',
        role: 'admin', first_login: true,
        profile: { nama: 'Administrator', email: 'admin@itg.ac.id' }
    }
];

const AuthService = {

    // POST /api/auth/login
    async login(username, password, role = 'mahasiswa') {
        if (API.mockMode) {
            const user = MOCK_USERS.find(u => u.username === username && u.password === password && u.role === role);
            if (!user) throw { message: 'Username atau password salah.' };
            const token = 'mock_token_' + Date.now();
            API.setToken(token);
            API.setUser({ ...user.profile, id: user.id, role: user.role, first_login: user.first_login });
            return { token, user: { ...user.profile, id: user.id, role: user.role, first_login: user.first_login } };
        }
        const data = await API.post('/auth/login', { username, password, role });
        API.setToken(data.token);
        API.setUser(data.user);
        return data;
    },

    // POST /api/auth/register
    async register({ nama, nim, prodi, password }) {
        const email = `${nim}@itg.ac.id`;
        if (API.mockMode) {
            return await API.mock({ success: true, message: 'Registrasi berhasil! Silakan login.' });
        }
        return API.post('/auth/register', { nama, nim, email, prodi, password, password_confirmation: password });
    },

    // POST /api/auth/logout
    async logout() {
        if (!API.mockMode) await API.post('/auth/logout').catch(() => {});
        API.removeToken();
        API.removeUser();
        window.location.href = 'login.html';
    },

    // POST /api/auth/change-password
    async changePassword({ old_password, new_password, new_password_confirmation }) {
        if (API.mockMode) {
            // Mark first_login as false
            const user = API.getUser();
            if (user) { user.first_login = false; API.setUser(user); }
            return await API.mock({ success: true, message: 'Password berhasil diubah.' });
        }
        return API.post('/auth/change-password', { old_password, new_password, new_password_confirmation });
    },

    // POST /api/auth/reset-password (admin only)
    async resetPassword(mahasiswaId) {
        if (API.mockMode) {
            return await API.mock({ success: true, message: 'Password berhasil direset.' });
        }
        return API.post('/auth/reset-password', { mahasiswa_id: mahasiswaId });
    },

    // Helper
    getUser: () => API.getUser(),
    isLoggedIn: () => API.isLoggedIn(),
    requireAuth(redirectTo = 'login.html') {
        if (!API.isLoggedIn()) { window.location.href = redirectTo; return false; }
        return true;
    },
    requireRole(role) {
        const user = API.getUser();
        if (!user || user.role !== role) { window.location.href = 'login.html'; return false; }
        return true;
    }
};

export default AuthService;
