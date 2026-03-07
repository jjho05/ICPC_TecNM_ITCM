/**
 * ConcursoSecurity — Módulo de seguridad para la Arena de Concurso.
 * Implementa restricciones de Fullscreen, Teclado y Mouse (Anti-Cheat).
 */
export const ConcursoSecurity = {
    isActive: false,

    init() {
        if (this.isActive) return;
        this.isActive = true;

        // 1. Bloqueo de Interacciones de Mouse
        document.addEventListener('contextmenu', this.preventEvent);
        document.body.style.userSelect = 'none';

        // 2. Bloqueo de Teclado (Copiar, Pegar, F12, PrintScreen)
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('copy', this.preventEvent);
        document.addEventListener('cut', this.preventEvent);
        document.addEventListener('paste', this.preventEvent);

        // 3. Detección de Foco (Visibility API)
        document.addEventListener('visibilitychange', this.handleVisibilityChange);

        console.log("🛡️ Seguridad de Concurso Activada.");
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

        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
        }

        console.log("🛡️ Seguridad de Concurso Desactivada.");
    },

    preventEvent(e) {
        e.preventDefault();
        return false;
    },

    handleKeyDown(e) {
        // Bloquear F12
        if (e.key === 'F12') return ConcursoSecurity.preventEvent(e);

        // Bloquear Ctrl+Shift+I / J / C (DevTools)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
            return ConcursoSecurity.preventEvent(e);
        }

        // Bloquear Ctrl+U (View Source)
        if (e.ctrlKey && e.key === 'u') return ConcursoSecurity.preventEvent(e);

        // Bloquear PrintScreen (No siempre capturable por JS, pero se intenta)
        if (e.key === 'PrintScreen') {
            alert("⚠️ Las capturas de pantalla están prohibidas durante el concurso.");
            return ConcursoSecurity.preventEvent(e);
        }
    },

    handleVisibilityChange() {
        if (document.hidden && ConcursoSecurity.isActive) {
            console.warn("🚩 El usuario salió de la pestaña del concurso.");
            // En una fase futura aquí se enviaría una alerta al Juez vía Supabase
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
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement && this.isActive) {
                callback();
            }
        });
    }
};
