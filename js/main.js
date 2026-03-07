import { initRouter } from './core/router.js';
import { AuthState } from './core/authState.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Iniciando Plataforma ICPC TecNM...");
    AuthState.init();
    initRouter();
});
