/**
 * SUARA KAMPUS - Real-time Chat UI
 * WhatsApp/Messenger-style chat interface
 */

import ChatService from '../services/chat.js';
import { Toast, fmt } from './components.js';

export const ChatUI = {
    currentLaporanId: null,
    currentRole: 'mahasiswa',
    typingTimer: null,
    unsubscribe: null,

    /**
     * Render the full chat component into a container element
     */
    render(containerId, laporanId, role = 'mahasiswa') {
        const container = document.getElementById(containerId);
        if (!container) return;
        this.currentLaporanId = laporanId;
        this.currentRole = role;

        container.innerHTML = `
            <div style="border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;display:flex;flex-direction:column;height:480px">
                <!-- Chat Header -->
                <div style="padding:14px 16px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px">
                    <div style="width:36px;height:36px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px">A</div>
                    <div style="flex:1">
                        <div style="font-size:14px;font-weight:600;color:var(--text-primary)">${role === 'admin' ? 'Chat dengan Mahasiswa' : 'Chat dengan Admin'}</div>
                        <div id="chat-status-${laporanId}" style="font-size:12px;color:var(--success)">● Online</div>
                    </div>
                </div>

                <!-- Messages Area -->
                <div id="chat-messages-${laporanId}" class="chat-container" style="flex:1">
                    <div style="text-align:center;padding:16px 0">
                        <span style="font-size:11px;color:var(--text-tertiary);background:var(--bg-secondary);padding:4px 12px;border-radius:var(--radius-full)">Percakapan terkait laporan ini</span>
                    </div>
                    <div id="chat-messages-body-${laporanId}">
                        <div style="text-align:center;padding:20px"><div class="skeleton skeleton-text" style="width:60%;margin:0 auto 8px"></div><div class="skeleton skeleton-text" style="width:40%;margin:0 auto"></div></div>
                    </div>
                </div>

                <!-- Typing Indicator -->
                <div id="typing-indicator-${laporanId}" class="typing-indicator" style="padding:6px 16px">
                    <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
                    <span style="font-size:12px;color:var(--text-tertiary);margin-left:4px">${role === 'admin' ? 'Mahasiswa' : 'Admin'} sedang mengetik...</span>
                </div>

                <!-- Input Bar -->
                <div class="chat-input-bar">
                    <input id="chat-input-${laporanId}" type="text" placeholder="Ketik pesan..." 
                        style="flex:1;border:1.5px solid var(--border);border-radius:var(--radius-full);padding:10px 16px;font-size:14px;background:var(--bg-secondary);transition:all 0.2s;outline:none"
                        autocomplete="off">
                    <button id="chat-send-${laporanId}" class="btn btn-primary btn-icon" style="border-radius:50%;width:40px;height:40px;padding:0;flex-shrink:0" title="Kirim">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>`;

        this._loadMessages(laporanId);
        this._bindInputEvents(laporanId);
        this._subscribeNew(laporanId);
    },

    async _loadMessages(laporanId) {
        try {
            const { data } = await ChatService.getMessages(laporanId);
            this._renderMessages(laporanId, data);
            await ChatService.markRead(laporanId);
        } catch (e) {
            document.getElementById(`chat-messages-body-${laporanId}`).innerHTML =
                '<div style="text-align:center;padding:20px;color:var(--text-tertiary)">Gagal memuat pesan.</div>';
        }
    },

    _renderMessages(laporanId, messages) {
        const body = document.getElementById(`chat-messages-body-${laporanId}`);
        if (!body) return;
        if (messages.length === 0) {
            body.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-tertiary);font-size:13px">Belum ada pesan. Mulai percakapan!</div>';
            return;
        }
        let lastDate = null;
        body.innerHTML = messages.map(msg => {
            const msgDate = fmt.date(msg.timestamp);
            const dateDiv = msgDate !== lastDate
                ? `<div style="text-align:center;margin:12px 0"><span style="font-size:11px;color:var(--text-tertiary);background:var(--bg-secondary);padding:3px 12px;border-radius:var(--radius-full)">${msgDate}</span></div>`
                : '';
            lastDate = msgDate;
            const isSent = (this.currentRole === 'mahasiswa' && msg.sender === 'mahasiswa') ||
                           (this.currentRole === 'admin' && msg.sender === 'admin');
            const checkmark = isSent ? `<span class="chat-status ${msg.is_read ? 'read' : ''}">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    ${msg.is_read ? '<polyline points="1 12 5 16 11 10"></polyline><polyline points="9 12 13 16 23 6"></polyline>' : '<polyline points="20 6 9 17 4 12"></polyline>'}
                </svg></span>` : '';
            return `${dateDiv}<div class="chat-bubble ${isSent ? 'sent' : 'received'}" data-id="${msg.id}">
                ${!isSent ? `<div style="font-size:11px;font-weight:600;margin-bottom:4px;opacity:0.7">${msg.nama}</div>` : ''}
                ${msg.message}
                <div class="chat-meta">
                    <span>${fmt.time(msg.timestamp)}</span>
                    ${isSent ? checkmark : ''}
                </div>
            </div>`;
        }).join('');
        this._scrollToBottom(laporanId);
    },

    appendMessage(laporanId, msg) {
        const body = document.getElementById(`chat-messages-body-${laporanId}`);
        if (!body) return;
        const empty = body.querySelector('[style*="Belum ada pesan"]');
        if (empty) empty.remove();
        const isSent = (this.currentRole === 'mahasiswa' && msg.sender === 'mahasiswa') ||
                       (this.currentRole === 'admin' && msg.sender === 'admin');
        const div = document.createElement('div');
        div.className = `chat-bubble ${isSent ? 'sent' : 'received'}`;
        div.innerHTML = `
            ${!isSent ? `<div style="font-size:11px;font-weight:600;margin-bottom:4px;opacity:0.7">${msg.nama}</div>` : ''}
            ${msg.message}
            <div class="chat-meta">
                <span>${fmt.time(msg.timestamp)}</span>
                ${isSent ? `<span class="chat-status"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>` : ''}
            </div>`;
        body.appendChild(div);
        this._scrollToBottom(laporanId);
    },

    _scrollToBottom(laporanId) {
        const container = document.getElementById(`chat-messages-${laporanId}`);
        if (container) setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
    },

    _bindInputEvents(laporanId) {
        const input = document.getElementById(`chat-input-${laporanId}`);
        const sendBtn = document.getElementById(`chat-send-${laporanId}`);
        if (!input || !sendBtn) return;

        // Input focus styling
        input.addEventListener('focus', () => input.style.borderColor = 'var(--primary)');
        input.addEventListener('blur', () => input.style.borderColor = 'var(--border)');

        // Typing indicator emit
        input.addEventListener('input', () => {
            ChatService.emitTyping(laporanId, true);
            clearTimeout(this.typingTimer);
            this.typingTimer = setTimeout(() => ChatService.emitTyping(laporanId, false), 2000);
        });

        // Send on Enter
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._send(laporanId, input, sendBtn); }
        });
        sendBtn.addEventListener('click', () => this._send(laporanId, input, sendBtn));

        // Listen for typing events (Socket.IO)
        document.addEventListener('chat:typing', (e) => {
            if (e.detail.laporan_id == laporanId) {
                const indicator = document.getElementById(`typing-indicator-${laporanId}`);
                if (indicator) indicator.classList.toggle('active', e.detail.is_typing);
            }
        });
    },

    async _send(laporanId, input, sendBtn) {
        const msg = input.value.trim();
        if (!msg) return;
        input.value = '';
        sendBtn.disabled = true;
        try {
            const { data } = await ChatService.sendMessage(laporanId, msg, this.currentRole);
            if (this.currentRole !== data.sender || !this._otherTabListening) {
                this.appendMessage(laporanId, data);
            }
            // Simulate admin auto-reply in demo mode
            if (this.currentRole === 'mahasiswa') {
                this._simulateReply(laporanId);
            }
        } catch (e) {
            Toast.error('Gagal mengirim pesan.');
        } finally {
            sendBtn.disabled = false;
            input.focus();
        }
    },

    _subscribeNew(laporanId) {
        if (this.unsubscribe) this.unsubscribe();
        this.unsubscribe = ChatService.subscribe(laporanId, (msg) => {
            const isSelf = (this.currentRole === msg.sender);
            if (!isSelf) this.appendMessage(laporanId, msg);
        });
    },

    // Demo: simulate admin reply after a short delay
    _simulateReply(laporanId) {
        const indicator = document.getElementById(`typing-indicator-${laporanId}`);
        const replies = [
            'Baik, kami akan segera tindak lanjuti.',
            'Terima kasih atas informasinya. Tim kami sedang menangani.',
            'Sudah kami catat. Mohon bersabar ya.',
            'Kami akan menghubungi kembali setelah inspeksi selesai.',
        ];
        setTimeout(() => {
            if (indicator) indicator.classList.add('active');
            setTimeout(async () => {
                if (indicator) indicator.classList.remove('active');
                const reply = replies[Math.floor(Math.random() * replies.length)];
                const { data } = await ChatService.sendMessage(laporanId, reply, 'admin');
                this.appendMessage(laporanId, data);
            }, 2000 + Math.random() * 1500);
        }, 500);
    },

    destroy() {
        if (this.unsubscribe) this.unsubscribe();
        clearTimeout(this.typingTimer);
    }
};

export default ChatUI;
