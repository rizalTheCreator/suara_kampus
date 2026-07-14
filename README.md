# Suara Kampus ITG

Platform pengaduan dan aspirasi resmi mahasiswa Institut Teknologi Garut.

## Fitur

- **Autentikasi**: Registrasi & login dengan NIM dan email otomatis `nim@itg.ac.id`
- **Pengaduan Terstruktur**: Laporan fasilitas, layanan, dan evaluasi dosen
- **Pelacakan Real-Time**: Timeline status laporan (Diajukan → Diproses → Selesai)
- **Chat**: Komunikasi langsung mahasiswa-admin (coming soon)
- **Papan Aspirasi**: Publik anonim dengan like/dislike
- **Generate PDF**: Laporan resmi dengan kop surat dan tanda tangan (coming soon)
- **Anti-Spam**: Batas 2 laporan/hari, deteksi duplikat

## Tech Stack

- **Backend**: Python, Flask, Flask-SQLAlchemy, Flask-Login
- **Database**: SQLite
- **Frontend**: HTML5, CSS3, Bootstrap 5, Bootstrap Icons
- **Auth**: Bcrypt password hashing, session-based

## Deployment

### 1. Local Development

```bash
# Clone/download project
cd suara_kampus

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run application
python app.py
```

Akses di: `http://localhost:5000`

### 2. PythonAnywhere Deployment

1. Upload project ke PythonAnywhere
2. Buat virtual environment dan install requirements
3. Setup WSGI file:

```python
import sys
path = '/home/yourusername/suara_kampus'
if path not in sys.path:
    sys.path.append(path)

from app import app as application
```

4. Jalankan `python app.py` sekali untuk inisialisasi database
5. Reload web app

### 3. Default Accounts

| Role | NIM/Email | Password |
|------|-----------|----------|
| Admin | ADMIN001 / admin@itg.ac.id | admin123 |
| Student | (register new) | (your password) |

## Struktur Folder

```
suara_kampus/
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── instance/
│   └── suara_kampus.db    # SQLite database (auto-generated)
├── static/
│   ├── css/               # Custom styles
│   ├── js/                # Custom scripts
│   └── images/
│       └── logo.png       # Logo ITG
└── templates/             # Jinja2 HTML templates
    ├── base.html
    ├── index.html
    ├── login.html
    ├── register.html
    ├── dashboard.html
    ├── admin_dashboard.html
    ├── new_report.html
    ├── report_detail.html
    ├── aspirations.html
    ├── notifications.html
    ├── 404.html
    └── 500.html
```

## Tim Pengembang

Kelompok 1 - Analisis & Perancangan Sistem Informasi
- Azki Zainur Ramadhan (2407048) - Project Manager
- M Nurhuda Awarul Rizal (2407043) - UI/UX Designer
- Insan Siti Rahmawati (2407046) - Frontend Developer
- Repaldi (2407016) - Backend Developer

© 2026 Institut Teknologi Garut
