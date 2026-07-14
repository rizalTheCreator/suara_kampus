/**
 * SUARA KAMPUS - Reusable UI Components
 * Toast, Modal, Sidebar, Topbar, Skeleton, etc.
 */

// ── Toast System ─────────────────────────────────────────────────
export const Toast = {
    container: null,
    init() {
        this.container = document.getElementById('toast-container') || (() => {
            const el = document.createElement('div');
            el.id = 'toast-container';
            el.className = 'toast-container';
            document.body.appendChild(el);
            return el;
        })();
    },
    show(message, type = 'info', duration = 3500) {
        if (!this.container) this.init();
        const icons = { success: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>', error: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>', warning: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>', info: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>' };
        const el = document.createElement('div');
        el.className = 'toast';
        el.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-msg">${message}</span><button class="toast-close" onclick="this.closest('.toast').remove()"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>`;
        this.container.appendChild(el);
        const timer = setTimeout(() => { el.classList.add('removing'); setTimeout(() => el.remove(), 300); }, duration);
        el.querySelector('.toast-close').addEventListener('click', () => clearTimeout(timer));
    },
    success: (msg) => Toast.show(msg, 'success'),
    error: (msg) => Toast.show(msg, 'error'),
    warning: (msg) => Toast.show(msg, 'warning'),
    info: (msg) => Toast.show(msg, 'info'),
};
Toast.init();

// ── Modal System ─────────────────────────────────────────────────
export const Modal = {
    open(id) {
        const overlay = document.getElementById(id);
        if (!overlay) return;
        overlay.classList.add('active');
        requestAnimationFrame(() => overlay.classList.add('visible'));
        document.body.style.overflow = 'hidden';
    },
    close(id) {
        const overlay = document.getElementById(id);
        if (!overlay) return;
        overlay.classList.remove('visible');
        setTimeout(() => { overlay.classList.remove('active'); document.body.style.overflow = ''; }, 250);
    },
    closeAll() {
        document.querySelectorAll('.modal-overlay.active').forEach(o => Modal.close(o.id));
    },
    confirm({ title, message, confirmText = 'Hapus', cancelText = 'Batal', type = 'danger' } = {}, onConfirm) {
        let modal = document.getElementById('global-confirm-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'global-confirm-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `<div class="modal-box" style="max-width:400px"><div class="modal-header"><h3 id="gcm-title" style="font-size:18px;font-weight:700"></h3></div><div class="modal-body"><p id="gcm-msg" style="color:var(--text-secondary);font-size:14px"></p></div><div class="modal-footer"><button id="gcm-cancel" class="btn btn-secondary"></button><button id="gcm-confirm" class="btn"></button></div></div>`;
            document.body.appendChild(modal);
        }
        document.getElementById('gcm-title').textContent = title || 'Konfirmasi';
        document.getElementById('gcm-msg').textContent = message || 'Apakah Anda yakin?';
        document.getElementById('gcm-cancel').textContent = cancelText;
        const btn = document.getElementById('gcm-confirm');
        btn.textContent = confirmText;
        btn.className = `btn btn-${type}`;
        document.getElementById('gcm-cancel').onclick = () => Modal.close('global-confirm-modal');
        btn.onclick = () => { Modal.close('global-confirm-modal'); onConfirm && onConfirm(); };
        Modal.open('global-confirm-modal');
    }
};

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) Modal.close(e.target.id);
    if (e.target.dataset.closeModal) Modal.close(e.target.dataset.closeModal);
});

// ── Ripple Effect ────────────────────────────────────────────────
export function addRipple(el) {
    el.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height);
        ripple.className = 'ripple-effect';
        ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px;`;
        this.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    });
}
document.querySelectorAll('.btn-primary, .btn-danger, .btn-success').forEach(addRipple);

// ── Skeleton Builder ─────────────────────────────────────────────
export function skeletonCard(n = 3) {
    return Array.from({ length: n }, () => `
        <div class="card" style="gap:12px;display:flex;flex-direction:column">
            <div style="display:flex;gap:12px;align-items:center">
                <div class="skeleton skeleton-avatar"></div>
                <div style="flex:1"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text" style="width:40%"></div></div>
            </div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width:70%"></div>
            <div class="skeleton skeleton-card" style="height:80px"></div>
        </div>`).join('');
}

// ── Active Nav Highlight ─────────────────────────────────────────
export function setActiveNav(pageId) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageId);
    });
}

// ── Page Stagger Animation ───────────────────────────────────────
export function animatePage(container) {
    if (!container) return;
    container.querySelectorAll('.stat-card, .card, .aspiration-card, .category-card').forEach((el, i) => {
        el.style.animationDelay = `${i * 0.05}s`;
        el.classList.add('animate-fade-in-up');
        el.style.opacity = '0';
    });
}

// ── Format helpers ────────────────────────────────────────────────
export const fmt = {
    date: (ts) => new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    dateShort: (ts) => new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    time: (ts) => new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    relative: (ts) => {
        const diff = (Date.now() - new Date(ts)) / 1000;
        if (diff < 60) return 'Baru saja';
        if (diff < 3600) return `${Math.floor(diff/60)} menit lalu`;
        if (diff < 86400) return `${Math.floor(diff/3600)} jam lalu`;
        return `${Math.floor(diff/86400)} hari lalu`;
    },
    initial: (name) => name?.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() || '?',
    avatar: (name, size=40) => `<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${size/3}px;flex-shrink:0">${fmt.initial(name)}</div>`,
};

// ── Status Badge ─────────────────────────────────────────────────
export function statusBadge(status) {
    const map = {
        menunggu: ['neutral', 'Menunggu'], diterima: ['primary', 'Diterima'],
        diproses: ['warning', 'Diproses'], pengerjaan: ['purple', 'Pengerjaan'],
        verifikasi: ['info', 'Verifikasi'], selesai: ['success', 'Selesai'],
        baru: ['neutral', 'Baru'], ditinjau: ['primary', 'Ditinjau'],
        dipertimbangkan: ['warning', 'Dipertimbangkan'], diimplementasikan: ['success', 'Diimplementasikan']
    };
    const [cls, label] = map[status] || ['neutral', status];
    return `<span class="badge badge-${cls}">${label}</span>`;
}

// ── Category icon/color map ───────────────────────────────────────
export const CATEGORIES = [
    { id: 'infrastruktur', label: 'Infrastruktur', icon: 'building-2', color: '#2563EB', bg: '#EFF6FF' },
    { id: 'fasilitas', label: 'Fasilitas', icon: 'monitor', color: '#8B5CF6', bg: '#F5F3FF' },
    { id: 'akademik', label: 'Akademik', icon: 'graduation-cap', color: '#10B981', bg: '#ECFDF5' },
    { id: 'keamanan', label: 'Keamanan', icon: 'shield-check', color: '#EF4444', bg: '#FEF2F2' },
    { id: 'kebersihan', label: 'Kebersihan', icon: 'sparkles', color: '#06B6D4', bg: '#ECFEFF' },
    { id: 'lainnya', label: 'Lainnya', icon: 'more-horizontal', color: '#94A3B8', bg: '#F8FAFC' },
];

export function categoryIcon(kategori) {
    const cat = CATEGORIES.find(c => c.id === kategori?.toLowerCase()) || CATEGORIES[5];
    return cat;
}

// ── Sidebar Toggle (mobile) ──────────────────────────────────────
export function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const hamburger = document.getElementById('hamburger-btn');
    if (!sidebar) return;
    hamburger?.addEventListener('click', () => {
        sidebar.classList.add('open');
        overlay.classList.add('active');
    });
    overlay?.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });
}

// ── Notification Bell ────────────────────────────────────────────
export function initNotifBell(service, role) {
    const bell = document.getElementById('notif-bell');
    const panel = document.getElementById('notif-panel');
    const badge = document.getElementById('notif-badge');
    if (!bell || !panel) return;

    const update = () => {
        const count = service.getUnreadCount(role);
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    };
    update();
    service.subscribe(update);

    bell.addEventListener('click', async (e) => {
        e.stopPropagation();
        panel.classList.toggle('active');
        if (panel.classList.contains('active')) {
            const { data } = await service.getAll(role);
            renderNotifPanel(data, panel, service, role, update);
        }
    });
    document.addEventListener('click', (e) => {
        if (!bell.contains(e.target) && !panel.contains(e.target)) panel.classList.remove('active');
    });
}

function renderNotifPanel(notifications, panel, service, role, update) {
    const body = panel.querySelector('#notif-panel-body');
    if (!body) return;
    body.innerHTML = notifications.length === 0
        ? '<div style="padding:32px;text-align:center;color:var(--text-tertiary)">Tidak ada notifikasi</div>'
        : notifications.map(n => `
            <div class="notif-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}" style="cursor:pointer">
                <div class="notif-icon-wrap" style="background:${n.bg};color:${n.color}">
                    <i data-lucide="${n.icon}" style="width:18px;height:18px"></i>
                </div>
                <div style="flex:1;min-width:0">
                    <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${n.title}</div>
                    <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n.message}</div>
                    <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px">${service.formatTime(n.created_at)}</div>
                </div>
            </div>`).join('');
    body.querySelectorAll('.notif-item').forEach(item => {
        item.addEventListener('click', () => service.markRead(+item.dataset.id, role).then(update));
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
