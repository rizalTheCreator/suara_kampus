/**
 * SUARA KAMPUS - PDF Generation
 * Uses jsPDF (CDN) to generate professional PDF reports
 */

import { fmt } from './components.js';

export const PdfGenerator = {

    /**
     * Generate Laporan Penyelesaian PDF
     * @param {object} laporan - full laporan data
     * @param {string} adminNama - admin name who closed the report
     */
    generate(laporan, adminNama = 'Administrator') {
        if (typeof window.jspdf === 'undefined') {
            alert('Library PDF belum dimuat. Pastikan koneksi internet aktif.');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const W = 210, margin = 20, cw = W - margin * 2;
        let y = 20;

        // ── Header Bar ─────────────────────────────────────────
        doc.setFillColor(37, 99, 235); // --primary
        doc.rect(0, 0, W, 35, 'F');

        // Logo placeholder (circle)
        doc.setFillColor(255, 255, 255);
        doc.circle(margin + 10, 17, 10, 'F');
        doc.setTextColor(37, 99, 235);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('SK', margin + 6.5, 19.5);

        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('LAPORAN PENYELESAIAN', margin + 26, 14);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Institut Teknologi Garut — Suara Kampus', margin + 26, 21);
        doc.text(`Tanggal Cetak: ${fmt.date(new Date().toISOString())}`, margin + 26, 27);

        // Kode verifikasi (top right)
        doc.setFontSize(8);
        doc.text(`ID: ${laporan.tiket}`, W - margin - 30, 22, { align: 'right' });

        y = 50;

        // ── Status Banner ───────────────────────────────────────
        doc.setFillColor(236, 253, 245);
        doc.roundedRect(margin, y, cw, 14, 3, 3, 'F');
        doc.setTextColor(16, 185, 129);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('✓  LAPORAN TELAH DISELESAIKAN', margin + 6, y + 9);
        y += 22;

        // ── Section: Info Laporan ───────────────────────────────
        y = this._section(doc, 'INFORMASI LAPORAN', y, margin);
        const pelapor = laporan.is_anonim ? 'Anonim' : laporan.mahasiswa?.nama;
        const nim     = laporan.is_anonim ? '(Disembunyikan)' : laporan.mahasiswa?.nim;
        const prodi   = laporan.is_anonim ? '(Disembunyikan)' : laporan.mahasiswa?.prodi;

        const rows1 = [
            ['Nomor Laporan', laporan.tiket],
            ['Nama Pelapor', pelapor],
            ['NIM', nim],
            ['Program Studi', prodi],
            ['Kategori', laporan.kategori],
            ['Lokasi', laporan.lokasi || '-'],
            ['Tanggal Dibuat', fmt.date(laporan.created_at)],
            ['Tanggal Selesai', fmt.date(laporan.updated_at)],
        ];
        y = this._table(doc, rows1, y, margin, cw);
        y += 8;

        // ── Section: Isi Laporan ────────────────────────────────
        y = this._section(doc, 'JUDUL & DESKRIPSI LAPORAN', y, margin);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
        doc.text(laporan.judul, margin + 4, y + 6);
        y += 10;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
        const descLines = doc.splitTextToSize(laporan.deskripsi || '', cw - 8);
        doc.text(descLines, margin + 4, y + 4);
        y += descLines.length * 5 + 12;

        // ── Section: Progres Penanganan ─────────────────────────
        y = this._section(doc, 'PROGRES PENANGANAN', y, margin);
        const steps = laporan.progress || [];
        if (steps.length === 0) {
            doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(148, 163, 184);
            doc.text('Tidak ada data progres.', margin + 4, y + 6);
            y += 14;
        } else {
            steps.forEach((step, i) => {
                const isLast = i === steps.length - 1;
                doc.setFillColor(isLast ? 16 : 37, isLast ? 185 : 99, isLast ? 129 : 235);
                doc.circle(margin + 6, y + 4, 3, 'F');
                if (!isLast) { doc.setDrawColor(226, 232, 240); doc.line(margin + 6, y + 7, margin + 6, y + 16); }
                doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
                doc.text(step.status?.toUpperCase() || '', margin + 13, y + 5);
                doc.setTextColor(71, 85, 105); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
                doc.text(fmt.date(step.created_at), W - margin - 2, y + 5, { align: 'right' });
                if (step.komentar) {
                    const lines = doc.splitTextToSize(step.komentar, cw - 20);
                    doc.text(lines, margin + 13, y + 10);
                    y += lines.length * 4 + 8;
                } else y += 12;
            });
        }
        y += 4;

        // ── Section: Penutup ────────────────────────────────────
        y = this._section(doc, 'KETERANGAN PENUTUP', y, margin);
        const lastProgress = steps[steps.length - 1];
        const komentar = lastProgress?.komentar || 'Laporan telah diselesaikan dengan baik.';
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
        const klLines = doc.splitTextToSize(komentar, cw - 8);
        doc.text(klLines, margin + 4, y + 6);
        y += klLines.length * 5 + 16;

        // ── Signature Area ──────────────────────────────────────
        // Check if we need a new page
        if (y > 240) { doc.addPage(); y = 20; }

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
        doc.text('Garut, ' + fmt.date(laporan.updated_at || new Date().toISOString()), W - margin - 2, y, { align: 'right' });
        y += 6;
        doc.text('Yang Menyelesaikan,', W - margin - 2, y, { align: 'right' });
        y += 24;
        // Signature line
        doc.setDrawColor(15, 23, 42);
        doc.line(W - margin - 55, y, W - margin - 2, y);
        y += 5;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text(adminNama, W - margin - 2, y, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.text('Administrator Suara Kampus', W - margin - 2, y + 5, { align: 'right' });

        // QR placeholder
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, y - 28, 36, 36, 3, 3, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y - 28, 36, 36, 3, 3, 'S');
        doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
        doc.text('QR VERIFIKASI', margin + 18, y - 13, { align: 'center' });
        doc.text(laporan.tiket, margin + 18, y - 7, { align: 'center' });

        // ── Footer ─────────────────────────────────────────────
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFillColor(248, 250, 252);
            doc.rect(0, 282, W, 15, 'F');
            doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
            doc.text('Dokumen ini diterbitkan secara digital oleh Sistem Suara Kampus — Institut Teknologi Garut', W/2, 288, { align: 'center' });
            doc.text(`Halaman ${i} dari ${totalPages}`, W - margin, 288, { align: 'right' });
        }

        // ── Save ────────────────────────────────────────────────
        doc.save(`LaporanPenyelesaian_${laporan.tiket}.pdf`);
    },

    // Preview in modal (returns data URL)
    preview(laporan, adminNama) {
        if (typeof window.jspdf === 'undefined') return null;
        const { jsPDF } = window.jspdf;
        const tempDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        return tempDoc.output('datauristring');
    },

    // Helper: section heading
    _section(doc, title, y, margin) {
        doc.setFillColor(239, 246, 255);
        doc.rect(margin, y, 210 - margin*2, 8, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(37, 99, 235);
        doc.text(title, margin + 4, y + 5.5);
        return y + 12;
    },

    // Helper: 2-column key-value table
    _table(doc, rows, y, margin, cw) {
        rows.forEach((row, i) => {
            if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(margin, y, cw, 7, 'F'); }
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
            doc.text(row[0], margin + 4, y + 5);
            doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
            doc.text(String(row[1] || '-'), margin + cw/2, y + 5);
            y += 7;
        });
        return y;
    }
};

export default PdfGenerator;
