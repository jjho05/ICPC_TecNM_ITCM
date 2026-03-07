export const UIModal = {
    overlay: null,
    resolver: null,
    type: null,

    init() {
        if (document.getElementById('icpc-modal-overlay')) return;
        const html = `
        <div id="icpc-modal-overlay" class="icpc-modal-overlay">
            <div class="icpc-modal">
                <h3 id="icpc-modal-title" class="icpc-modal-title">Título</h3>
                <p id="icpc-modal-desc" class="icpc-modal-desc">Descripción</p>
                <input type="text" id="icpc-modal-input" class="icpc-modal-input" autocomplete="off">
                <div class="icpc-modal-actions">
                    <button id="icpc-modal-cancel" class="icpc-modal-btn icpc-btn-cancel">Cancelar</button>
                    <button id="icpc-modal-confirm" class="icpc-modal-btn icpc-btn-confirm">Aceptar</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);

        this.overlay = document.getElementById('icpc-modal-overlay');
        this.title = document.getElementById('icpc-modal-title');
        this.desc = document.getElementById('icpc-modal-desc');
        this.input = document.getElementById('icpc-modal-input');
        this.btnCancel = document.getElementById('icpc-modal-cancel');
        this.btnConfirm = document.getElementById('icpc-modal-confirm');

        this.btnCancel.addEventListener('click', () => this.close(false));
        this.btnConfirm.addEventListener('click', () => this.close(true));

        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.close(true);
            if (e.key === 'Escape') this.close(false);
        });
    },

    open({ title, desc, type = 'alert', placeholder = '', confirmText = 'Aceptar' }) {
        this.init();
        return new Promise((resolve) => {
            this.resolver = resolve;
            this.type = type;

            this.title.textContent = title;
            this.desc.innerHTML = desc; // Permitir HTML simple como saltos de línea (br)
            this.btnConfirm.textContent = confirmText;

            if (type === 'prompt') {
                this.input.style.display = 'block';
                this.input.placeholder = placeholder;
                this.input.value = '';
                this.btnCancel.style.display = 'block';
            } else if (type === 'confirm') {
                this.input.style.display = 'none';
                this.btnCancel.style.display = 'block';
            } else { // alert
                this.input.style.display = 'none';
                this.btnCancel.style.display = 'none';
            }

            this.overlay.classList.add('active');
            if (type === 'prompt') setTimeout(() => this.input.focus(), 100);
            else setTimeout(() => this.btnConfirm.focus(), 100);
        });
    },

    close(confirmed) {
        this.overlay.classList.remove('active');
        if (this.resolver) {
            if (this.type === 'prompt') {
                this.resolver(confirmed ? this.input.value.trim() : null);
            } else {
                this.resolver(confirmed);
            }
            this.resolver = null;
        }
    },

    // Asynchronous shorthands
    async alert(title, desc = '') { return this.open({ title, desc, type: 'alert' }); },
    async confirm(title, desc) { return this.open({ title, desc, type: 'confirm' }); },
    async prompt(title, desc, placeholder = '') { return this.open({ title, desc, type: 'prompt', placeholder }); }
};
