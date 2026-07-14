/**
 * SUARA KAMPUS - Chat Service
 * WebSocket (Socket.IO) + polling fallback
 * GET /api/chat | POST /api/chat/send | GET /api/chat/messages
 */

import API from './config.js';

// ── Mock chat rooms keyed by laporan_id ─────────────────────────
const MOCK_CHATS = {
    1: [
        { id: 1, sender: 'admin', nama: 'Administrator', message: 'Halo Nurhuda, laporan Anda sudah kami terima. Kami akan segera menindaklanjuti.', timestamp: '2026-07-10T10:15:00Z', is_read: true },
        { id: 2, sender: 'mahasiswa', nama: 'Nurhuda', message: 'Terima kasih Pak. Kondisi atapnya sudah cukup parah, air masuk ke dekat stop kontak.', timestamp: '2026-07-10T10:30:00Z', is_read: true },
        { id: 3, sender: 'admin', nama: 'Administrator', message: 'Baik, sudah kami catat. Tim teknis akan melakukan inspeksi besok pagi.', timestamp: '2026-07-10T10:45:00Z', is_read: true },
        { id: 4, sender: 'mahasiswa', nama: 'Nurhuda', message: 'Oke Pak, terima kasih atas responnya yang cepat.', timestamp: '2026-07-10T11:00:00Z', is_read: true },
        { id: 5, sender: 'admin', nama: 'Administrator', message: 'Sama-sama. Kami akan update perkembangan melalui chat ini.', timestamp: '2026-07-12T14:05:00Z', is_read: false },
    ],
    2: [
        { id: 1, sender: 'admin', nama: 'Administrator', message: 'AC di ruang SI-101 sudah kami jadwalkan untuk diperbaiki pada tanggal 5 Juli.', timestamp: '2026-07-03T10:00:00Z', is_read: true },
        { id: 2, sender: 'mahasiswa', nama: 'Nurhuda', message: 'Alhamdulillah, terima kasih Pak.', timestamp: '2026-07-03T10:15:00Z', is_read: true },
        { id: 3, sender: 'admin', nama: 'Administrator', message: 'AC sudah diperbaiki dan berfungsi normal. Laporan ini kami tutup ya.', timestamp: '2026-07-08T16:00:00Z', is_read: true },
        { id: 4, sender: 'mahasiswa', nama: 'Nurhuda', message: 'Terima kasih banyak, AC sudah dingin kembali 👍', timestamp: '2026-07-08T16:30:00Z', is_read: true },
    ],
    3: []
};
let _nextMsgId = 100;

const ChatService = {
    _socket: null,
    _listeners: [],

    // GET /api/chat/messages?laporan_id=X
    async getMessages(laporanId) {
        if (API.mockMode) {
            const msgs = MOCK_CHATS[laporanId] || [];
            return await API.mock({ data: msgs });
        }
        return API.get('/chat/messages', { laporan_id: laporanId });
    },

    // POST /api/chat/send
    async sendMessage(laporanId, message, senderRole = 'mahasiswa') {
        if (API.mockMode) {
            if (!MOCK_CHATS[laporanId]) MOCK_CHATS[laporanId] = [];
            const msg = {
                id: _nextMsgId++,
                sender: senderRole,
                nama: senderRole === 'admin' ? 'Administrator' : 'Nurhuda',
                message, is_read: false,
                timestamp: new Date().toISOString()
            };
            MOCK_CHATS[laporanId].push(msg);
            this._notifyListeners(laporanId, msg);
            return await API.mock({ data: msg });
        }
        return API.post('/chat/send', { laporan_id: laporanId, message, sender_role: senderRole });
    },

    // Mark messages as read
    async markRead(laporanId) {
        if (API.mockMode) {
            (MOCK_CHATS[laporanId] || []).forEach(m => m.is_read = true);
            return await API.mock({ success: true });
        }
        return API.post('/chat/read', { laporan_id: laporanId });
    },

    // Unread count
    getUnreadCount(laporanId) {
        return (MOCK_CHATS[laporanId] || []).filter(m => !m.is_read && m.sender !== 'mahasiswa').length;
    },

    // Subscribe to new messages (mock polling / WebSocket bridge)
    subscribe(laporanId, callback) {
        const listener = { laporanId, callback };
        this._listeners.push(listener);
        return () => { this._listeners = this._listeners.filter(l => l !== listener); };
    },
    _notifyListeners(laporanId, msg) {
        this._listeners.filter(l => l.laporanId == laporanId).forEach(l => l.callback(msg));
    },

    // ── WebSocket Connection (real backend) ─────────────────────
    connectSocket(token) {
        if (API.mockMode || typeof io === 'undefined') return;
        this._socket = io(API.BASE_URL.replace('/api', ''), { auth: { token } });
        this._socket.on('new_message', (msg) => this._notifyListeners(msg.laporan_id, msg));
        this._socket.on('typing', ({ laporan_id, is_typing }) => {
            document.dispatchEvent(new CustomEvent('chat:typing', { detail: { laporan_id, is_typing } }));
        });
    },
    emitTyping(laporanId, isTyping) {
        if (this._socket) this._socket.emit('typing', { laporan_id: laporanId, is_typing: isTyping });
    },
    disconnectSocket() {
        if (this._socket) { this._socket.disconnect(); this._socket = null; }
    },

    // Format timestamp
    formatTime: (ts) => {
        const d = new Date(ts);
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    },
    formatDate: (ts) => {
        return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
};

export default ChatService;
