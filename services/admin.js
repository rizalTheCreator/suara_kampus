/**
 * SUARA KAMPUS - Admin Service
 */

import API from './config.js';

const MOCK_MAHASISWA = [
    { id: 1, nama: 'Nurhuda', nim: '2407043', email: '2407043@itg.ac.id', prodi: 'Sistem Informasi', foto: null, created_at: '2026-07-01', laporan_count: 3, aspirasi_count: 2 },
    { id: 2, nama: 'Ahmad Fauzan', nim: '2307021', email: '2307021@itg.ac.id', prodi: 'Teknik Informatika', foto: null, created_at: '2026-06-15', laporan_count: 1, aspirasi_count: 1 },
    { id: 3, nama: 'Siti Rahayu', nim: '2207089', email: '2207089@itg.ac.id', prodi: 'Arsitektur', foto: null, created_at: '2026-05-20', laporan_count: 2, aspirasi_count: 3 },
    { id: 4, nama: 'Budi Santoso', nim: '2407102', email: '2407102@itg.ac.id', prodi: 'Teknik Sipil', foto: null, created_at: '2026-07-02', laporan_count: 0, aspirasi_count: 1 },
    { id: 5, nama: 'Dewi Lestari', nim: '2307055', email: '2307055@itg.ac.id', prodi: 'Teknik Industri', foto: null, created_at: '2026-06-10', laporan_count: 1, aspirasi_count: 0 },
];

const MOCK_STATS = {
    total_mahasiswa: 5,
    total_laporan: 6,
    total_aspirasi: 4,
    laporan_aktif: 2,
    laporan_selesai: 1,
    aspirasi_populer: 1,
    laporan_per_kategori: {
        labels: ['Infrastruktur', 'Fasilitas', 'Akademik', 'Keamanan', 'Kebersihan', 'Lainnya'],
        data: [2, 2, 1, 1, 1, 0]
    },
    tren_bulanan: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'],
        laporan: [1, 2, 3, 2, 4, 3, 6],
        aspirasi: [0, 1, 2, 1, 3, 2, 4]
    }
};

const MOCK_AUDIT = [
    { id: 1, admin: 'Administrator', action: 'Update status laporan LPR-2026-0001 → Diproses', created_at: '2026-07-12T14:00:00Z' },
    { id: 2, admin: 'Administrator', action: 'Laporan LPR-2026-0002 diselesaikan', created_at: '2026-07-08T16:00:00Z' },
    { id: 3, admin: 'Administrator', action: 'Status aspirasi ASP-2026-0001 → Dipertimbangkan', created_at: '2026-07-06T10:00:00Z' },
    { id: 4, admin: 'Administrator', action: 'Akun mahasiswa baru: Nurhuda (2407043)', created_at: '2026-07-01T08:00:00Z' },
    { id: 5, admin: 'Administrator', action: 'Status aspirasi ASP-2026-0004 → Diimplementasikan', created_at: '2026-06-20T09:00:00Z' },
];

const AdminService = {

    async getStats() {
        if (API.mockMode) return await API.mock({ data: MOCK_STATS });
        return API.get('/admin/stats');
    },

    async getMahasiswa(params = {}) {
        if (API.mockMode) {
            let data = [...MOCK_MAHASISWA];
            if (params.q) {
                const q = params.q.toLowerCase();
                data = data.filter(m => m.nama.toLowerCase().includes(q) || m.nim.includes(q));
            }
            return await API.mock({ data, total: data.length });
        }
        return API.get('/admin/mahasiswa', params);
    },

    async getAuditLog() {
        if (API.mockMode) return await API.mock({ data: MOCK_AUDIT });
        return API.get('/admin/audit-log');
    },

    async deleteMahasiswa(id) {
        if (API.mockMode) return await API.mock({ message: 'Mahasiswa berhasil dihapus.' });
        return API.del(`/admin/mahasiswa/${id}`);
    },

    async exportPDF() {
        if (API.mockMode) return await API.mock({ message: 'PDF berhasil digenerate.' });
        return API.get('/admin/export-pdf');
    },

    PRODI: ['Sistem Informasi', 'Teknik Informatika', 'Teknik Sipil', 'Arsitektur', 'Teknik Industri'],
};

export default AdminService;
