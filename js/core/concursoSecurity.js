/**
 * ConcursoSecurity — Módulo de seguridad para la Arena de Concurso.
 * Implementa restricciones de Fullscreen, Teclado y Mouse (Anti-Cheat).
 */
export const ConcursoSecurity = {
    isActive: false,
    _fsCallback: null,

    init() {
        if (this.isActive) return;
        this.isActive = true;

        // 1. Bloqueo de Clic Derecho
        document.addEventListener('contextmenu', this.preventEvent);
        document.body.style.userSelect = 'none';

        // 2. Bloqueo de Teclado (F12, DevTools, Ver Fuente)
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('copy', this.preventEvent);
        document.addEventListener('cut', this.preventEvent);
        document.addEventListener('paste', this.preventEvent);

        // 3. Detección de visibilidad (respaldo ligero — el registro real lo hace initArena)
        document.addEventListener('visibilitychange', this.handleVisibilityChange);

        console.log('🛡️ Seguridad de Concurso Activada.');
    },

    destroy() {
        this.isActive = false;
        document.removeEventListener('contextmenu', this.preventEvent);
        document.body.style.userSelect = 'auto';
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('copy', this.preventEvent);
        document.removeEventListener('cut', this.preventEvent);
        document.removeEventListener('paste', this.preventEvent);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);

        if (this._fsCallback) {
            document.removeEventListener('fullscreenchange', this._fsCallback);
            this._fsCallback = null;
        }

        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }

        console.log('🛡️ Seguridad de Concurso Desactivada.');
    },

    preventEvent(e) {
        e.preventDefault();
        return false;
    },

    handleKeyDown(e) {
        // Bloquear F12
        if (e.key === 'F12') return ConcursoSecurity.preventEvent(e);

        // Bloquear Ctrl+Shift+I / J / C (DevTools)
        if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) {
            return ConcursoSecurity.preventEvent(e);
        }

        // Bloquear Ctrl+U / Cmd+U (View Source)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
            return ConcursoSecurity.preventEvent(e);
        }

        // PrintScreen: prevenir sin usar alert() nativo (no es confiable en todos los navegadores)
        if (e.key === 'PrintScreen') {
            e.preventDefault();
            // Registrar si el sistema de violaciones ya está listo
            if (typeof window.registrarViolacion === 'function') {
                window.registrarViolacion('screenshot', 'Intento de captura de pantalla (PrintScreen)', 'alta');
            }
        }
    },

    handleVisibilityChange() {
        if (document.hidden && ConcursoSecurity.isActive) {
            // Registrar en Supabase si el sistema está disponible (definido en initArena)
            if (typeof window.registrarViolacion === 'function') {
                window.registrarViolacion('alt_tab', 'El usuario salió de la pestaña del concurso.', 'alta');
            }
        }
    },

    async requestFullscreen() {
        try {
            const elem = document.documentElement;
            if (!document.fullscreenElement) {
                await elem.requestFullscreen();
            }
        } catch (err) {
            console.error(`Error al intentar entrar en pantalla completa: ${err.message}`);
        }
    },

    handleFullscreenExit(callback) {
        if (this._fsCallback) {
            document.removeEventListener('fullscreenchange', this._fsCallback);
        }
        this._fsCallback = () => {
            if (!document.fullscreenElement && this.isActive) {
                callback();
            }
        };
        document.addEventListener('fullscreenchange', this._fsCallback);
    }
};

