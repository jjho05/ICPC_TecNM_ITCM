// ══════════════════════════════════════════════════════
//  AuthState — Estado de sesión y BD ICPC TecNM (Supabase)
//  Persistencia: Supabase (PostgreSQL) + LocalStorage para caché vital
// ══════════════════════════════════════════════════════

import { supabase } from './supabaseClient.js';

export const AuthState = {

    // ── Sesión activa ──────────────────────────────────
    user: null, // { type:'admin'|'coach'|'alumno', email, name, team? }

    init() {
        const stored = localStorage.getItem('icpc_session');
        if (stored) this.user = JSON.parse(stored);
    },

    getRole() { return this.user?.type || null; },
    isAdmin() { return this.user?.type === 'admin'; },
    isProfesor() { return this.user?.type === 'profesor'; },
    isAlumno() { return this.user?.type === 'alumno'; },

    loginAsAdmin(email, name) {
        this.user = { type: 'admin', email, name };
        localStorage.setItem('icpc_session', JSON.stringify(this.user));
    },

    loginAsProfesor(email, name) {
        this.user = { type: 'profesor', email, name };
        localStorage.setItem('icpc_session', JSON.stringify(this.user));
    },

    loginAsAlumno(email, team) {
        this.user = { type: 'alumno', email, team };
        localStorage.setItem('icpc_session', JSON.stringify(this.user));
    },

    logout() {
        this.user = null;
        localStorage.removeItem('icpc_session');
    },

    // ── BD Supabase (PostgreSQL) ───────────────────────
    db: {
        // --- Concursos ---
        async getConcursos() {
            const { data, error } = await supabase.from('icpc_concursos').select('*');
            if (error) { console.error("Error fetching concursos", error); return []; }
            return data;
        },
        async getConcursoById(id) {
            const { data, error } = await supabase.from('icpc_concursos').select('*').eq('id', id).single();
            if (error) return null;
            return data;
        },
        async saveConcurso(concurso) {
            // Upsert (inserta o actualiza si ya existe el ID)
            const { data, error } = await supabase.from('icpc_concursos').upsert({
                id: concurso.id,
                titulo: concurso.titulo,
                estado: concurso.estado || 'programado',
                ts_inicio: concurso.ts_inicio,
                ts_fin: concurso.ts_fin,
                jueces_ids: concurso.jueces_ids || [],
                coaches_ids: concurso.coaches_ids || [],
                problemas: concurso.problemas || []
            }).select();
            if (error) console.error("Error saveConcurso:", error);
            return data;
        },
        async activarConcurso(id) {
            const { error } = await supabase.from('icpc_concursos')
                .update({ estado: 'activo' })
                .eq('id', id);
            if (error) console.error("Error activarConcurso:", error);
        },
        async finalizarConcurso(id) {
            const { error } = await supabase.from('icpc_concursos')
                .update({ estado: 'finalizado' })
                .eq('id', id);
            if (error) console.error("Error finalizarConcurso:", error);
        },

        // --- Manejo Contextual de Roles en Eventos ---
        async addJuezToConcurso(concurso_id, email_profesor) {
            const concurso = await this.getConcursoById(concurso_id);
            if (!concurso) return false;
            if (concurso.coaches_ids.includes(email_profesor)) return false; // Regla

            if (!concurso.jueces_ids.includes(email_profesor)) {
                await supabase.from('icpc_concursos')
                    .update({ jueces_ids: [...concurso.jueces_ids, email_profesor] })
                    .eq('id', concurso_id);
            }
            return true;
        },
        async addCoachToConcurso(concurso_id, email_profesor) {
            const concurso = await this.getConcursoById(concurso_id);
            if (!concurso) return false;
            if (concurso.jueces_ids.includes(email_profesor)) return false; // Regla

            if (!concurso.coaches_ids.includes(email_profesor)) {
                await supabase.from('icpc_concursos')
                    .update({ coaches_ids: [...concurso.coaches_ids, email_profesor] })
                    .eq('id', concurso_id);
            }
            return true;
        },

        // --- Problemas Locales (Se pueden pasar a Supabase después) ---
        // Por compatibilidad de la Fase 4, dejaremos problemas en LocalStorage por ahora
        getProblemas() {
            return JSON.parse(localStorage.getItem('icpc_problemas') || '[]');
        },
        saveProblema(problema) {
            const lista = this.getProblemas();
            const idx = lista.findIndex(p => p.id === problema.id);
            if (idx >= 0) lista[idx] = problema; else lista.push(problema);
            localStorage.setItem('icpc_problemas', JSON.stringify(lista));
        },
        getProblemaById(id) {
            return this.getProblemas().find(p => p.id === id) || null;
        },

        // --- Usuarios (Profesores/Coaches/Jueces) ---
        async validateUsuario(email, password) {
            const { data, error } = await supabase.from('icpc_usuarios')
                .select('*')
                .eq('email', email.toLowerCase())
                .eq('password', password)
                .single();
            if (error || !data) return false;
            return true;
        },
        async registerUsuario(user) {
            const { data, error } = await supabase.from('icpc_usuarios').insert({
                email: user.email.toLowerCase(),
                nombre: user.name,
                password: user.password,
                is_sysadmin: user.is_admin || false,
                equipos_inscritos: []
            }).select();
            if (error) {
                console.error("Error registerUsuario:", error);
                throw error;
            }
            return data;
        },
        async getUsuarioData(email) {
            const { data } = await supabase.from('icpc_usuarios').select('*').eq('email', email).single();
            return data;
        },

        // --- Alumnos Locales ---
        getAlumnos() {
            return JSON.parse(localStorage.getItem('icpc_alumnos') || '[]');
        },
        addAlumno(email, equipo = '') {
            const lista = this.getAlumnos();
            if (!lista.find(a => a.email === email.toLowerCase())) {
                lista.push({ email: email.toLowerCase(), equipo, checkin: false });
                localStorage.setItem('icpc_alumnos', JSON.stringify(lista));
            }
        },
        isAlumnoPermitido(email) {
            return this.getAlumnos().some(a => a.email === email.toLowerCase());
        },

        // --- Submissions (Tiempo Real Supabase) ---
        async addSubmission(sub) {
            const { error } = await supabase.from('icpc_submissions').insert({
                concurso_id: window.currentConcursoId || 'GLOBAL',
                problema_id: sub.problema_id,
                equipo: sub.equipo,
                veredicto: sub.veredicto,
                timestamp: Date.now()
            });
            if (error) console.error("Error addSubmission:", error);
        },
        async getSubmissionsByConcurso(concurso_id) {
            const { data, error } = await supabase.from('icpc_submissions')
                .select('*')
                .eq('concurso_id', concurso_id)
                .order('timestamp', { ascending: false });
            if (error) { console.error("Error fetching subs", error); return []; }
            return data || [];
        }
    }
};
