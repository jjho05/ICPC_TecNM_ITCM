/**
 * UIToast — Sistema de Notificaciones Fluidas para ICPC TecNM
 * Evita el uso de alerts bloqueantes para avisos efímeros.
 */
export const UIToast = {
    _container: null,

    _init() {
        if (this._container) return;
        this._container = document.createElement('div');
        this._container.id = 'toast-container';
        this._container.className = 'toast-container';
        document.body.appendChild(this._container);

        const style = document.createElement('style');
        style.textContent = `
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            }
            .toast-item {
                min-width: 280px;
                max-width: 400px;
                background: #1e293b;
                color: white;
                padding: 12px 16px;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                border-left: 4px solid var(--tecnm-gold);
                display: flex;
                align-items: center;
                gap: 12px;
                pointer-events: auto;
                animation: toast-in 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
                opacity: 0;
            }
            .toast-item--success { border-left-color: #22c55e; }
            .toast-item--error { border-left-color: #ef4444; }
            .toast-item--info { border-left-color: #3b82f6; }
            
            .toast-icon { font-size: 1.2rem; }
            .toast-content { flex: 1; font-size: 0.9rem; font-weight: 500; }
            
            .toast-exit {
                animation: toast-out 0.3s ease forwards;
            }

            @keyframes toast-in {
                from { transform: translateX(100%) scale(0.9); opacity: 0; }
                to { transform: translateX(0) scale(1); opacity: 1; }
            }
            @keyframes toast-out {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(20%) opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    },

    show(message, type = 'info', duration = 4000) {
        this._init();
        const item = document.createElement('div');
        item.className = `toast-item toast-item--${type}`;

        let icon = 'info-circle';
        if (type === 'success') icon = 'circle-check';
        if (type === 'error') icon = 'triangle-exclamation';
        if (type === 'warning') icon = 'circle-exclamation';

        item.innerHTML = `
            <i class="fa-solid fa-${icon} toast-icon"></i>
            <div class="toast-content">${message}</div>
        `;

        this._container.appendChild(item);

        setTimeout(() => {
            item.classList.add('toast-exit');
            setTimeout(() => item.remove(), 300);
        }, duration);
    },

    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
    info(msg) { this.show(msg, 'info'); },
    warn(msg) { this.show(msg, 'warning'); }
};

window.UIToast = UIToast;
