import { LandingView } from '../components/landing.js';
import { LoginProfesorView } from '../components/loginProfesor.js';
import { RegisterProfesorView } from '../components/registerProfesor.js';
import { LoginAdminView } from '../components/loginAdmin.js';
import { DashboardProfesorView } from '../components/dashboardProfesor.js';
import { AdminPanelView } from '../components/adminPanel.js';
import { CheckinAlumnoView } from '../components/checkinAlumno.js';
import { ArenaView } from '../components/arena.js';
import { PracticaView } from '../components/practica.js';
import { StaffDashboardView } from '../components/staffDashboard.js';
import { ProfileView } from '../components/profile.js';
import { RegisterAdminView } from '../components/registerAdmin.js';
import { AuthState } from './authState.js';

// ── Definición de rutas ───────────────────────────────
const routes = {
    '/': LandingView,
    '/login-profesor': LoginProfesorView,
    '/register-profesor': RegisterProfesorView,
    '/login-admin': LoginAdminView,
    '/register-admin': RegisterAdminView,
    '/dashboard-profesor': guardProfesor(DashboardProfesorView),
    '/admin': guardAdmin(AdminPanelView),
    '/checkin-alumno': CheckinAlumnoView,
    '/arena': guardAlumno(ArenaView),
    '/practica': PracticaView,
    '/staff': guardStaff(StaffDashboardView),
    '/perfil': guardAuth(ProfileView),
};

function guardProfesor(view) { return () => AuthState.isProfesor() ? view() : redirect('/login-profesor'); }
function guardAdmin(view) { return () => AuthState.isAdmin() ? view() : redirect('/login-admin'); }
function guardAlumno(view) { return () => AuthState.isAlumno() ? view() : redirect('/checkin-alumno'); }
function guardStaff(view) { return () => (AuthState.isProfesor() || AuthState.isAdmin()) ? view() : redirect('/'); }
function guardAuth(view) { return () => AuthState.user ? view() : redirect('/'); }
function redirect(to) { setTimeout(() => window.router.navigate(to), 0); return '<div></div>'; }

// ── Router ────────────────────────────────────────────
export const initRouter = () => {
    const appRoot = document.getElementById('app-root');

    // Función para obtener la ruta normalizada ignorando subdirectorios (ej: GitHub Pages)
    const getNormalizedPath = () => {
        let path = window.location.pathname;
        if (path.includes('index.html')) {
            path = path.split('index.html')[0];
        }
        // Asume que si hay un prefijo de repositorio, lo ignoramos o obtenemos solo el final.
        // Forma robusta: si startsWith('/') y tiene más segmentos, intentamos extraer la ruta de la APP.
        // Pero para la SPA que usa history API o anclas, lo mejor es basarse en el hash si fuera hash router.
        // Como usamos history API, debemos forzar a que el punto de entrada sea '/' lógico.
        // Obtener el segmento final, o forzar siempre rutas como '/practica', '/arena'.
        // Si estamos en github pages, pathname es /ICPC_TecNM_ITCM/
        const basePath = '/ICPC_TecNM_ITCM';
        if (path.startsWith(basePath)) {
            path = path.slice(basePath.length);
        }
        if (path === '' || path === '/' || path.endsWith('index.html')) return '/';
        return path;
    };

    let currentPath = getNormalizedPath();

    window.router = {
        navigate(path) {
            if (currentPath === path) return;
            currentPath = path;
            // Al hacer pushState en subdirectorios hay que tener cuidado. 
            // Añadir el basePath si estamos empujando a la URL
            const isProd = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
            const basePath = isProd ? '/ICPC_TecNM_ITCM' : '';
            window.history.pushState({}, '', basePath + path);
            render(path);
        },
        current() { return currentPath; }
    };

    const render = (path) => {
        // En caso de que se intente ir a una ruta no mapeada, vuelve a inicio
        const view = routes[path] || routes['/'];
        appRoot.innerHTML = typeof view === 'function' ? view() : '';

        const navPractica = document.getElementById('nav-practica');
        if (navPractica) navPractica.style.display = (path === '/arena') ? 'none' : '';

        window.scrollTo(0, 0);
    };

    // Manejar el botón "Atrás" del navegador
    window.addEventListener('popstate', () => {
        let path = window.location.pathname;
        if (path === '/index.html') path = '/';
        currentPath = path;
        render(path);
    });

    document.body.addEventListener('click', e => {
        const target = e.target.closest('[data-route]');
        if (target) {
            e.preventDefault();
            window.router.navigate(target.getAttribute('data-route'));
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && currentPath !== '/') window.router.navigate('/');
    });

    render(currentPath);
};
