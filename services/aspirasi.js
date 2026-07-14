/**
 * SUARA KAMPUS - Aspirasi Service
 * GET/POST /api/aspirasi | like | dislike
 */

import API from './config.js';

const MOCK_ASPIRASI = [
    {
        id: 1, tiket: 'ASP-2026-0001',
        mahasiswa: { nama: 'Nurhuda', nim: '2407043', prodi: 'Sistem Informasi' },
        kategori: 'Fasilitas', judul: 'Penambahan Hotspot WiFi di Area Perpustakaan',
        deskripsi: 'Sinyal WiFi di perpustakaan sangat lemah dan tidak stabil. Mahasiswa kesulitan mengakses jurnal online dan mengerjakan tugas yang membutuhkan koneksi internet.',
        gambar: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400',
        tags: ['#wifi', '#perpustakaan', '#internet', '#fasilitas'],
        is_anonim: false, status: 'dipertimbangkan', likes: 48, dislikes: 3,
        user_reaction: null, created_at: '2026-07-05T10:00:00Z'
    },
    {
        id: 2, tiket: 'ASP-2026-0002',
        mahasiswa: { nama: 'Ahmad Fauzan', nim: '2307021', prodi: 'Teknik Informatika' },
        kategori: 'Akademik', judul: 'Perpanjangan Jam Buka Laboratorium Komputer',
        deskripsi: 'Laboratorium komputer hanya buka sampai pukul 17.00. Banyak mahasiswa yang membutuhkan akses laboratorium di malam hari untuk mengerjakan proyek dan tugas pemrograman.',
        gambar: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
        tags: ['#laboratorium', '#komputer', '#jam-buka', '#akademik'],
        is_anonim: false, status: 'ditinjau', likes: 35, dislikes: 2,
        user_reaction: null, created_at: '2026-07-08T14:00:00Z'
    },
    {
        id: 3, tiket: 'ASP-2026-0003',
        mahasiswa: { nama: 'Nurhuda', nim: '2407043', prodi: 'Sistem Informasi' },
        kategori: 'Infrastruktur', judul: 'Perbaikan Kursi dan Meja di Ruang Kuliah',
        deskripsi: 'Banyak kursi dan meja di ruang kuliah yang sudah rusak. Kondisi ini sangat tidak nyaman dan mengganggu konsentrasi mahasiswa dalam mengikuti perkuliahan.',
        gambar: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400',
        tags: ['#meja', '#kursi', '#ruang-kuliah', '#infrastruktur'],
        is_anonim: false, status: 'baru', likes: 22, dislikes: 1,
        user_reaction: null, created_at: '2026-07-12T09:00:00Z'
    },
    {
        id: 4, tiket: 'ASP-2026-0004',
        mahasiswa: { nama: 'Siti Rahayu', nim: '2207089', prodi: 'Arsitektur' },
        kategori: 'Keamanan', judul: 'Penambahan CCTV di Area Parkir Motor',
        deskripsi: 'Area parkir motor tidak memiliki kamera CCTV. Sudah beberapa kali terjadi kehilangan helm dan aksesori kendaraan.',
        gambar: 'https://images.unsplash.com/photo-1555448248-2571daf6344b?w=400',
        tags: ['#cctv', '#parkir', '#keamanan'],
        is_anonim: false, status: 'diimplementasikan', likes: 61, dislikes: 0,
        user_reaction: null, created_at: '2026-06-20T10:00:00Z'
    }
];

const AspirasiService = {
    _data: [...MOCK_ASPIRASI],
    _nextId: 5,

    async getAll(params = {}) {
        if (API.mockMode) {
            let data = [...this._data];
            if (params.status) data = data.filter(a => a.status === params.status);
            if (params.sort === 'likes') data.sort((a,b) => b.likes - a.likes);
            else if (params.sort === 'newest') data.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
            return await API.mock({ data, total: data.length });
        }
        return API.get('/aspirasi', params);
    },

    async getById(id) {
        if (API.mockMode) {
            const item = this._data.find(a => a.id === id);
            if (!item) throw { message: 'Aspirasi tidak ditemukan.' };
            return await API.mock({ data: item });
        }
        return API.get(`/aspirasi/${id}`);
    },

    async create(payload) {
        if (API.mockMode) {
            const newItem = {
                id: this._nextId++,
                tiket: `ASP-2026-${String(this._nextId).padStart(4,'0')}`,
                mahasiswa: { nama: 'Nurhuda', nim: '2407043', prodi: 'Sistem Informasi' },
                status: 'baru', likes: 0, dislikes: 0, user_reaction: null,
                created_at: new Date().toISOString(), ...payload
            };
            this._data.unshift(newItem);
            return await API.mock({ data: newItem, message: 'Aspirasi berhasil dikirim.' });
        }
        return API.post('/aspirasi', payload, payload instanceof FormData);
    },

    async react(id, type) { // type: 'like' | 'dislike' | null
        if (API.mockMode) {
            const idx = this._data.findIndex(a => a.id === id);
            if (idx === -1) throw { message: 'Aspirasi tidak ditemukan.' };
            const item = this._data[idx];
            const prev = item.user_reaction;
            if (prev === 'like') item.likes--;
            if (prev === 'dislike') item.dislikes--;
            item.user_reaction = (prev === type) ? null : type;
            if (item.user_reaction === 'like') item.likes++;
            if (item.user_reaction === 'dislike') item.dislikes++;
            return await API.mock({ data: item });
        }
        if (type === 'like') return API.post(`/aspirasi/${id}/like`);
        if (type === 'dislike') return API.post(`/aspirasi/${id}/dislike`);
        return API.del(`/aspirasi/${id}/reaction`);
    },

    async updateStatus(id, status) {
        if (API.mockMode) {
            const idx = this._data.findIndex(a => a.id === id);
            if (idx !== -1) this._data[idx].status = status;
            return await API.mock({ message: 'Status diperbarui.' });
        }
        return API.patch(`/aspirasi/${id}`, { status });
    },

    STATUS_LABEL: { baru: 'Baru', ditinjau: 'Ditinjau', dipertimbangkan: 'Dipertimbangkan', diimplementasikan: 'Diimplementasikan' },
};

export default AspirasiService;
