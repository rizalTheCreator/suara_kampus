/**
 * SUARA KAMPUS - Notification Service
 * GET /api/notifications
 */

import API from '../api/config.js';

const MOCK_NOTIFICATIONS = [
    { id: 1, type: 'laporan_update', icon: 'file-check', color: '#2563EB', bg: '#EFF6FF', title: 'Status Laporan Diperbarui', message: 'Laporan LPR-2026-0001 kini berstatus "Diproses"', reference_id: 1, is_read: false, created_at: '2026-07-12T14:00:00Z' },
    { id: 2, type: 'chat_new', icon: 'message-circle', color: '#8B5CF6', bg: '#F5F3FF', title: 'Pesan Baru dari Admin', message: 'Admin: "Kami akan update perkembangan melalui chat ini."', reference_id: 1, is_read: false, created_at: '2026-07-12T14:05:00Z' },
    { id: 3, type: 'laporan_selesai', icon: 'check-circle', color: '#10B981', bg: '#ECFDF5', title: 'Laporan Selesai', message: 'Laporan LPR-2026-0002 telah selesai ditangani. PDF tersedia.', reference_id: 2, is_read: true, created_at: '2026-07-08T16:00:00Z' },
    { id: 4, type: 'aspirasi_update', icon: 'lightbulb', color: '#F59E0B', bg: '#FFFBEB', title: 'Aspirasi Dipertimbangkan', message: 'Aspirasi "Penambahan Hotspot WiFi" kini dipertimbangkan pihak kampus.', reference_id: 1, is_read: true, created_at: '2026-07-06T10:00:00Z' },
];

const MOCK_ADMIN_NOTIF = [
    { id: 1, type: 'laporan_baru', icon: 'file-plus', color: '#EF4444', bg: '#FEF2F2', title: 'Laporan Baru', message: 'Laporan baru dari Nurhuda (2407043): "Toilet Lantai 3 Kotor"', reference_id: 3, is_read: false, created_at: '2026-07-13T11:00:00Z' },
    { id: 2, type: 'chat_new', icon: 'message-circle', color: '#8B5CF6', bg: '#F5F3FF', title: 'Chat Baru', message: 'Nurhuda: "Terima kasih atas responnya yang cepat."', reference_id: 1, is_read: false, created_at: '2026-07-10T11:00:00Z' },
    { id: 3, type: 'aspirasi_baru', icon: 'lightbulb', color: '#F59E0B', bg: '#FFFBEB', title: 'Aspirasi Baru', message: 'Aspirasi baru dari Nurhuda: "Perbaikan Kursi dan Meja"', reference_id: 3, is_read: true, created_at: '2026-07-12T09:00:00Z' },
];

const NotificationService = {
    _data: [...MOCK_NOTIFICATIONS],
    _adminData: [...MOCK_ADMIN_NOTIF],
    _listeners: [],

    async getAll(role = 'mahasiswa') {
        if (API.mockMode) {
            const data = role === 'admin' ? [...this._adminData] : [...this._data];
            return await API.mock({ data });
        }
        return API.get('/notifications');
    },

    getUnreadCount(role = 'mahasiswa') {
        const data = role === 'admin' ? this._adminData : this._data;
        return data.filter(n => !n.is_read).length;
    },

    async markAllRead(role = 'mahasiswa') {
        if (API.mockMode) {
            const data = role === 'admin' ? this._adminData : this._data;
            data.forEach(n => n.is_read = true);
            this._notifyListeners();
            return await API.mock({ success: true });
        }
        return API.post('/notifications/read-all');
    },

    async markRead(id, role = 'mahasiswa') {
        if (API.mockMode) {
            const data = role === 'admin' ? this._adminData : this._data;
            const item = data.find(n => n.id === id);
            if (item) item.is_read = true;
            this._notifyListeners();
            return await API.mock({ success: true });
        }
        return API.post(`/notifications/${id}/read`);
    },

    push(notif, role = 'mahasiswa') {
        const data = role === 'admin' ? this._adminData : this._data;
        data.unshift({ id: Date.now(), is_read: false, created_at: new Date().toISOString(), ...notif });
        this._notifyListeners();
    },

    subscribe(callback) {
        this._listeners.push(callback);
        return () => { this._listeners = this._listeners.filter(l => l !== callback); };
    },
    _notifyListeners() { this._listeners.forEach(cb => cb()); },

    formatTime: (ts) => {
        const now = new Date(), d = new Date(ts), diff = (now - d) / 1000;
        if (diff < 60) return 'Baru saja';
        if (diff < 3600) return `${Math.floor(diff/60)} menit lalu`;
        if (diff < 86400) return `${Math.floor(diff/3600)} jam lalu`;
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }
};

export default NotificationService;
