/**
 * SUARA KAMPUS - Laporan Service
 * GET/POST/PUT/DELETE /api/laporan
 */

import API from './config.js';

// ── Mock Data ───────────────────────────────────────────────────
const MOCK_LAPORAN = [
    {
        id: 1, tiket: 'LPR-2026-0001',
        mahasiswa: { nama: 'Nurhuda', nim: '2407043', prodi: 'Sistem Informasi' },
        kategori: 'Infrastruktur', judul: 'Atap Gedung B Bocor Saat Hujan',
        deskripsi: 'Atap di lantai 2 Gedung B mengalami kebocoran parah setiap kali hujan turun. Air masuk ke ruang kelas dan merusak peralatan elektronik.',
        lokasi: 'Gedung B Lantai 2', bukti_foto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        is_anonim: false, status: 'diproses', created_at: '2026-07-10T09:00:00Z', updated_at: '2026-07-12T14:00:00Z',
        progress: [
            { id: 1, status: 'diterima', komentar: 'Laporan diterima dan sedang ditinjau.', admin: 'Administrator', created_at: '2026-07-10T10:00:00Z' },
            { id: 2, status: 'diproses', komentar: 'Tim teknis sedang melakukan inspeksi lapangan.', admin: 'Administrator', created_at: '2026-07-12T14:00:00Z' },
        ]
    },
    {
        id: 2, tiket: 'LPR-2026-0002',
        mahasiswa: { nama: 'Nurhuda', nim: '2407043', prodi: 'Sistem Informasi' },
        kategori: 'Fasilitas', judul: 'AC Ruang Kelas SI-101 Tidak Berfungsi',
        deskripsi: 'AC di ruang kelas SI-101 sudah tidak berfungsi selama 2 minggu. Kondisi ruangan sangat panas dan mengganggu proses belajar mengajar.',
        lokasi: 'Gedung Sistem Informasi, Ruang 101', bukti_foto: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400',
        is_anonim: false, status: 'selesai', created_at: '2026-07-01T08:00:00Z', updated_at: '2026-07-08T16:00:00Z',
        progress: [
            { id: 1, status: 'diterima', komentar: 'Laporan diterima.', admin: 'Administrator', created_at: '2026-07-01T09:00:00Z' },
            { id: 2, status: 'diproses', komentar: 'Teknisi dijadwalkan.', admin: 'Administrator', created_at: '2026-07-03T10:00:00Z' },
            { id: 3, status: 'pengerjaan', komentar: 'Teknisi sedang melakukan perbaikan.', admin: 'Administrator', created_at: '2026-07-05T09:00:00Z' },
            { id: 4, status: 'verifikasi', komentar: 'Perbaikan selesai, menunggu verifikasi.', admin: 'Administrator', created_at: '2026-07-07T14:00:00Z' },
            { id: 5, status: 'selesai', komentar: 'AC telah diperbaiki dan berfungsi normal.', admin: 'Administrator', created_at: '2026-07-08T16:00:00Z' },
        ]
    },
    {
        id: 3, tiket: 'LPR-2026-0003',
        mahasiswa: { nama: 'Nurhuda', nim: '2407043', prodi: 'Sistem Informasi' },
        kategori: 'Kebersihan', judul: 'Toilet Lantai 3 Gedung A Kotor dan Berbau',
        deskripsi: 'Kondisi toilet di lantai 3 Gedung A sangat memprihatinkan. Jarang dibersihkan dan menimbulkan bau tidak sedap.',
        lokasi: 'Gedung A Lantai 3', bukti_foto: null,
        is_anonim: true, status: 'menunggu', created_at: '2026-07-13T11:00:00Z', updated_at: '2026-07-13T11:00:00Z',
        progress: []
    }
];

const LaporanService = {
    _data: [...MOCK_LAPORAN],
    _nextId: 4,

    // GET /api/laporan
    async getAll(params = {}) {
        if (API.mockMode) {
            let data = [...this._data];
            if (params.status) data = data.filter(l => l.status === params.status);
            if (params.mahasiswa_id) data = data.filter(l => l.mahasiswa.nim === '2407043');
            return await API.mock({ data, total: data.length });
        }
        return API.get('/laporan', params);
    },

    // GET /api/laporan/{id}
    async getById(id) {
        if (API.mockMode) {
            const item = this._data.find(l => l.id === id);
            if (!item) throw { message: 'Laporan tidak ditemukan.' };
            return await API.mock({ data: item });
        }
        return API.get(`/laporan/${id}`);
    },

    // POST /api/laporan
    async create(payload) {
        if (API.mockMode) {
            const newItem = {
                id: this._nextId++,
                tiket: `LPR-2026-${String(this._nextId).padStart(4,'0')}`,
                mahasiswa: { nama: 'Nurhuda', nim: '2407043', prodi: 'Sistem Informasi' },
                status: 'menunggu', progress: [], created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(), ...payload
            };
            this._data.unshift(newItem);
            return await API.mock({ data: newItem, message: 'Laporan berhasil dikirim.' });
        }
        return API.post('/laporan', payload, payload instanceof FormData);
    },

    // PUT /api/laporan/{id}
    async update(id, payload) {
        if (API.mockMode) {
            const idx = this._data.findIndex(l => l.id === id);
            if (idx === -1) throw { message: 'Laporan tidak ditemukan.' };
            this._data[idx] = { ...this._data[idx], ...payload, updated_at: new Date().toISOString() };
            return await API.mock({ data: this._data[idx], message: 'Laporan berhasil diperbarui.' });
        }
        return API.put(`/laporan/${id}`, payload);
    },

    // DELETE /api/laporan/{id}
    async delete(id) {
        if (API.mockMode) {
            this._data = this._data.filter(l => l.id !== id);
            return await API.mock({ message: 'Laporan berhasil dihapus.' });
        }
        return API.del(`/laporan/${id}`);
    },

    // Update status only (admin)
    async updateStatus(id, status, komentar = '') {
        if (API.mockMode) {
            const idx = this._data.findIndex(l => l.id === id);
            if (idx === -1) throw { message: 'Laporan tidak ditemukan.' };
            this._data[idx].status = status;
            this._data[idx].progress.push({
                id: Date.now(), status, komentar, admin: 'Administrator', created_at: new Date().toISOString()
            });
            this._data[idx].updated_at = new Date().toISOString();
            return await API.mock({ data: this._data[idx], message: 'Status berhasil diperbarui.' });
        }
        return API.patch(`/laporan/${id}/status`, { status, komentar });
    },

    STATUS_STEPS: ['menunggu', 'diterima', 'diproses', 'pengerjaan', 'verifikasi', 'selesai'],
    STATUS_LABEL: { menunggu: 'Menunggu', diterima: 'Diterima', diproses: 'Diproses', pengerjaan: 'Pengerjaan', verifikasi: 'Verifikasi', selesai: 'Selesai' },
};

export default LaporanService;
