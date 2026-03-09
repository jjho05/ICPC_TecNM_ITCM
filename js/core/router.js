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
import { AuthState } from './authState.js';

// ── Definición de rutas ───────────────────────────────
const routes = {
    '/': LandingView,
    '/login-profesor': LoginProfesorView,
    '/register-profesor': RegisterProfesorView,
    '/login-admin': LoginAdminView,
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
    let currentPath = window.location.pathname;
    if (currentPath === '/index.html') currentPath = '/';

    window.router = {
        navigate(path) {
            if (currentPath === path) return;
            currentPath = path;
            window.history.pushState({}, '', path);
            render(path);
        },
        current() { return currentPath; }
    };

    const render = (path) => {
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
