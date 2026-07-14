from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'suara-kampus-secret-key-2026'

# Check if running on Vercel
IS_VERCEL = os.environ.get('VERCEL') == '1'

if IS_VERCEL:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/suara_kampus.db'
    app.config['UPLOAD_FOLDER'] = '/tmp/uploads'
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///suara_kampus.db'
    app.config['UPLOAD_FOLDER'] = 'static/uploads'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Ensure upload folder exists
try:
    if IS_VERCEL:
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    else:
        os.makedirs(os.path.join(app.root_path, app.config['UPLOAD_FOLDER']), exist_ok=True)
except OSError:
    pass

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Silakan login terlebih dahulu.'
login_manager.login_message_category = 'warning'

# ==================== MODELS ====================

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nim = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default='student')  # student, admin
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    reports = db.relationship('Report', backref='user', lazy=True)
    aspirations = db.relationship('Aspiration', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    reports = db.relationship('Report', backref='category', lazy=True)

class Report(db.Model):
    __tablename__ = 'reports'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.String(36), db.ForeignKey('categories.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    photo_url = db.Column(db.String(500))
    status = db.Column(db.String(50), default='Diajukan')  # Diajukan, Diproses, Selesai, Ditolak
    is_lecturer_report = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lecturer_report = db.relationship('LecturerReport', backref='report', uselist=False, lazy=True)
    report_logs = db.relationship('ReportLog', backref='report', lazy=True, order_by='ReportLog.created_at.desc()')
    chats = db.relationship('Chat', backref='report', lazy=True, order_by='Chat.sent_at.asc()')
    pdf_report = db.relationship('PdfReport', backref='report', uselist=False, lazy=True)

class LecturerReport(db.Model):
    __tablename__ = 'lecturer_reports'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = db.Column(db.String(36), db.ForeignKey('reports.id'), unique=True)
    lecturer_name = db.Column(db.String(100), nullable=False)
    course = db.Column(db.String(100), nullable=False)
    class_name = db.Column(db.String(50), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    impact = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ReportLog(db.Model):
    __tablename__ = 'report_logs'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = db.Column(db.String(36), db.ForeignKey('reports.id'), nullable=False)
    status_from = db.Column(db.String(50))
    status_to = db.Column(db.String(50), nullable=False)
    changed_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    note = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    changed_by_user = db.relationship('User', foreign_keys=[changed_by])

class Aspiration(db.Model):
    __tablename__ = 'aspirations'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50))
    likes_count = db.Column(db.Integer, default=0)
    dislikes_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    votes = db.relationship('AspirationVote', backref='aspiration', lazy=True)

class AspirationVote(db.Model):
    __tablename__ = 'aspiration_votes'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    aspiration_id = db.Column(db.String(36), db.ForeignKey('aspirations.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    vote_type = db.Column(db.String(10), nullable=False)  # like, dislike
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('aspiration_id', 'user_id', name='unique_aspiration_vote'),)

class Chat(db.Model):
    __tablename__ = 'chats'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = db.Column(db.String(36), db.ForeignKey('reports.id'), nullable=False)
    sender_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)

    sender = db.relationship('User', foreign_keys=[sender_id])

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # status_update, new_chat, pdf_ready
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class PdfReport(db.Model):
    __tablename__ = 'pdf_reports'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = db.Column(db.String(36), db.ForeignKey('reports.id'), nullable=False)
    file_url = db.Column(db.String(500), nullable=False)
    generated_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)

# ==================== LOGIN MANAGER ====================

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(user_id)

# ==================== ROUTES ====================

@app.route('/')
def index():
    stats = {
        'total_reports': Report.query.count(),
        'resolved_reports': Report.query.filter_by(status='Selesai').count(),
        'total_aspirations': Aspiration.query.count(),
        'response_rate': 98
    }

    # Get popular aspirations
    popular_aspirations = Aspiration.query.order_by(
        (Aspiration.likes_count - Aspiration.dislikes_count).desc()
    ).limit(3).all()

    return render_template('index.html', stats=stats, aspirations=popular_aspirations)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        nim = request.form.get('nim', '').strip()
        full_name = request.form.get('full_name', '').strip()
        password = request.form.get('password', '')

        # Validate NIM
        if not nim or not nim.isdigit():
            flash('NIM harus berupa angka.', 'danger')
            return redirect(url_for('register'))

        # Check if NIM already exists
        if User.query.filter_by(nim=nim).first():
            flash('NIM sudah terdaftar. Silakan login.', 'warning')
            return redirect(url_for('login'))

        # Auto-generate email: nim@itg.ac.id
        email = f"{nim}@itg.ac.id"

        if User.query.filter_by(email=email).first():
            flash('Email sudah terdaftar.', 'danger')
            return redirect(url_for('register'))

        # Create user
        user = User(
            nim=nim,
            email=email,
            full_name=full_name,
            role='student'
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        flash('Registrasi berhasil! Silakan login.', 'success')
        return redirect(url_for('login'))

    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        nim = request.form.get('nim', '').strip()
        password = request.form.get('password', '')

        user = User.query.filter_by(nim=nim).first()

        if user and user.check_password(password):
            login_user(user)
            flash(f'Selamat datang, {user.full_name}!', 'success')

            next_page = request.args.get('next')
            if next_page:
                return redirect(next_page)

            if user.role == 'admin':
                return redirect(url_for('admin_dashboard'))
            return redirect(url_for('dashboard'))

        flash('NIM atau password salah.', 'danger')

    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Anda telah logout.', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    if current_user.role == 'admin':
        return redirect(url_for('admin_dashboard'))

    # Student dashboard stats
    total_reports = Report.query.filter_by(user_id=current_user.id).count()
    processing_reports = Report.query.filter_by(user_id=current_user.id, status='Diproses').count()
    completed_reports = Report.query.filter_by(user_id=current_user.id, status='Selesai').count()

    recent_reports = Report.query.filter_by(user_id=current_user.id).order_by(Report.created_at.desc()).limit(5).all()

    return render_template('dashboard.html',
                         total_reports=total_reports,
                         processing_reports=processing_reports,
                         completed_reports=completed_reports,
                         recent_reports=recent_reports)

@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    if current_user.role != 'admin':
        flash('Akses ditolak.', 'danger')
        return redirect(url_for('dashboard'))

    total_reports = Report.query.count()
    pending_reports = Report.query.filter_by(status='Diajukan').count()
    processing_reports = Report.query.filter_by(status='Diproses').count()
    completed_reports = Report.query.filter_by(status='Selesai').count()

    recent_reports = Report.query.order_by(Report.created_at.desc()).limit(10).all()

    return render_template('admin_dashboard.html',
                         total_reports=total_reports,
                         pending_reports=pending_reports,
                         processing_reports=processing_reports,
                         completed_reports=completed_reports,
                         recent_reports=recent_reports)

@app.route('/reports/new', methods=['GET', 'POST'])
@login_required
def new_report():
    if current_user.role != 'student':
        flash('Hanya mahasiswa yang dapat membuat laporan.', 'warning')
        return redirect(url_for('dashboard'))

    # Anti-spam: max 2 reports per day
    today = datetime.utcnow().date()
    today_reports = Report.query.filter(
        Report.user_id == current_user.id,
        db.func.date(Report.created_at) == today
    ).count()

    if today_reports >= 2:
        flash('Batas 2 laporan per hari telah tercapai. Coba lagi besok.', 'warning')
        return redirect(url_for('dashboard'))

    categories = Category.query.all()

    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        category_id = request.form.get('category_id')

        # Check for duplicate (80% similarity)
        recent_user_reports = Report.query.filter_by(user_id=current_user.id).order_by(Report.created_at.desc()).limit(5).all()
        for recent in recent_user_reports:
            if title.lower() in recent.title.lower() or recent.title.lower() in title.lower():
                flash('Laporan serupa terdeteksi. Mohon periksa kembali.', 'warning')
                return redirect(url_for('new_report'))

        report = Report(
            user_id=current_user.id,
            category_id=category_id,
            title=title,
            description=description,
            status='Diajukan'
        )

        db.session.add(report)
        db.session.commit()

        # Create initial log
        log = ReportLog(
            report_id=report.id,
            status_to='Diajukan',
            changed_by=current_user.id,
            note='Laporan diajukan oleh mahasiswa'
        )
        db.session.add(log)
        db.session.commit()

        flash('Laporan berhasil dikirim!', 'success')
        return redirect(url_for('dashboard'))

    return render_template('new_report.html', categories=categories)

@app.route('/reports/<report_id>')
@login_required
def report_detail(report_id):
    report = Report.query.get_or_404(report_id)

    # Check permission
    if current_user.role == 'student' and report.user_id != current_user.id:
        flash('Akses ditolak.', 'danger')
        return redirect(url_for('dashboard'))

    return render_template('report_detail.html', report=report)

@app.route('/reports/<report_id>/update_status', methods=['POST'])
@login_required
def update_report_status(report_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    report = Report.query.get_or_404(report_id)
    new_status = request.form.get('status')
    note = request.form.get('note', '')

    if new_status not in ['Diajukan', 'Diproses', 'Selesai', 'Ditolak']:
        return jsonify({'error': 'Invalid status'}), 400

    old_status = report.status
    report.status = new_status
    report.updated_at = datetime.utcnow()

    log = ReportLog(
        report_id=report.id,
        status_from=old_status,
        status_to=new_status,
        changed_by=current_user.id,
        note=note
    )

    # Create notification for student
    notification = Notification(
        user_id=report.user_id,
        type='status_update',
        title='Status Laporan Diubah',
        message=f'Status laporan "{report.title}" berubah dari {old_status} menjadi {new_status}'
    )

    db.session.add(log)
    db.session.add(notification)
    db.session.commit()

    flash(f'Status laporan diubah menjadi {new_status}', 'success')
    return redirect(url_for('report_detail', report_id=report_id))

@app.route('/aspirations')
def aspirations():
    sort = request.args.get('sort', 'popular')

    if sort == 'popular':
        aspirations = Aspiration.query.order_by(
            (Aspiration.likes_count - Aspiration.dislikes_count).desc()
        ).all()
    else:
        aspirations = Aspiration.query.order_by(Aspiration.created_at.desc()).all()

    return render_template('aspirations.html', aspirations=aspirations, sort=sort)

@app.route('/aspirations/new', methods=['POST'])
@login_required
def new_aspiration():
    if current_user.role != 'student':
        flash('Hanya mahasiswa yang dapat membuat aspirasi.', 'warning')
        return redirect(url_for('aspirations'))

    # Anti-spam: max 2 aspirations per day
    today = datetime.utcnow().date()
    today_aspirations = Aspiration.query.filter(
        Aspiration.user_id == current_user.id,
        db.func.date(Aspiration.created_at) == today
    ).count()

    if today_aspirations >= 2:
        flash('Batas 2 aspirasi per hari telah tercapai.', 'warning')
        return redirect(url_for('aspirations'))

    content = request.form.get('content', '').strip()
    category = request.form.get('category', '')

    if not content:
        flash('Konten aspirasi tidak boleh kosong.', 'danger')
        return redirect(url_for('aspirations'))

    aspiration = Aspiration(
        user_id=current_user.id,
        content=content,
        category=category
    )

    db.session.add(aspiration)
    db.session.commit()

    flash('Aspirasi berhasil dipublikasikan!', 'success')
    return redirect(url_for('aspirations'))

@app.route('/aspirations/<aspiration_id>/vote', methods=['POST'])
@login_required
def vote_aspiration(aspiration_id):
    vote_type = request.form.get('vote_type')

    if vote_type not in ['like', 'dislike']:
        return jsonify({'error': 'Invalid vote type'}), 400

    existing_vote = AspirationVote.query.filter_by(
        aspiration_id=aspiration_id,
        user_id=current_user.id
    ).first()

    aspiration = Aspiration.query.get_or_404(aspiration_id)

    if existing_vote:
        if existing_vote.vote_type == vote_type:
            # Remove vote (toggle off)
            db.session.delete(existing_vote)
            if vote_type == 'like':
                aspiration.likes_count -= 1
            else:
                aspiration.dislikes_count -= 1
        else:
            # Change vote
            if existing_vote.vote_type == 'like':
                aspiration.likes_count -= 1
                aspiration.dislikes_count += 1
            else:
                aspiration.dislikes_count -= 1
                aspiration.likes_count += 1
            existing_vote.vote_type = vote_type
    else:
        # New vote
        vote = AspirationVote(
            aspiration_id=aspiration_id,
            user_id=current_user.id,
            vote_type=vote_type
        )
        db.session.add(vote)
        if vote_type == 'like':
            aspiration.likes_count += 1
        else:
            aspiration.dislikes_count += 1

    db.session.commit()

    return jsonify({
        'likes': aspiration.likes_count,
        'dislikes': aspiration.dislikes_count
    })

@app.route('/notifications')
@login_required
def notifications():
    notifs = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).all()

    # Mark all as read
    for n in notifs:
        if not n.is_read:
            n.is_read = True
    db.session.commit()

    return render_template('notifications.html', notifications=notifs)

@app.route('/api/notifications/unread')
@login_required
def unread_notifications():
    count = Notification.query.filter_by(user_id=current_user.id, is_read=False).count()
    return jsonify({'count': count})

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('500.html'), 500

# ==================== INIT DATABASE ====================

def init_db():
    with app.app_context():
        db.create_all()

        # Create default categories
        if not Category.query.first():
            categories = [
                Category(name='Fasilitas Kelas', description='Keluhan terkait fasilitas ruang kelas'),
                Category(name='Fasilitas Lab', description='Keluhan terkait laboratorium'),
                Category(name='Fasilitas Kampus', description='Keluhan terkait fasilitas umum kampus'),
                Category(name='Himpunan Mahasiswa', description='Keluhan terkait kegiatan himpunan'),
                Category(name='Layanan TUK', description='Keluhan terkait layanan Tata Usaha Kampus'),
                Category(name='Layanan PRODI', description='Keluhan terkait layanan Program Studi'),
                Category(name='Layanan Kampus', description='Keluhan terkait layanan umum kampus')
            ]
            db.session.add_all(categories)

        # Create default admin
        if not User.query.filter_by(role='admin').first():
            admin = User(
                nim='ADMIN001',
                email='admin@itg.ac.id',
                full_name='Administrator Kampus',
                role='admin'
            )
            admin.set_password('admin123')
            db.session.add(admin)

        db.session.commit()
        print('Database initialized!')

if IS_VERCEL:
    init_db()

if __name__ == '__main__':
    if not IS_VERCEL:
        init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
