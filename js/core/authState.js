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

    async _hash(text) {
        const msgUint8 = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

    loginAsAlumno(email, team, nombre = '') {
        this.user = { type: 'alumno', email, team, nombre };
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
        async getCategorias() {
            const { data, error } = await supabase.from('icpc_categorias').select('*');
            if (error) { console.error("Error fetching categorias", error); return []; }
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
                fecha_inicio: concurso.fecha_inicio,
                fecha_fin: concurso.fecha_fin,
                jueces_ids: concurso.jueces_ids || [],
                coaches_ids: concurso.coaches_ids || [],
                problemas: concurso.problemas || [],
                categoria_id: concurso.categoria_id || 'division2',
                max_integrantes: concurso.max_integrantes || 3,
                min_integrantes: concurso.min_integrantes || 1
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

        // --- Problemas (Supabase: icpc_problemas) ---
        async getProblemas(filters = {}) {
            // Siempre devuelve un ARRAY — usado en arena, práctica y banco admin
            let query = supabase.from('icpc_problemas').select('*');
            if (filters.search) query = query.or(`titulo.ilike.%${filters.search}%`);
            if (filters.dificultad) query = query.eq('dificultad', filters.dificultad);
            if (filters.fuente) query = query.eq('fuente', filters.fuente);
            if (filters.publicado !== undefined) query = query.eq('publicado', filters.publicado);
            const { data, error } = await query.order('dificultad', { ascending: true });
            if (error) { console.error('getProblemas:', error); return []; }
            return data || [];
        },
        async getProblemasPaginados(page = 1, pageSize = 20, filters = {}) {
            // Versión para el admin con paginación y conteo (devuelve {data, count})
            let query = supabase.from('icpc_problemas').select('*', { count: 'exact' });
            if (filters.search) query = query.or(`titulo.ilike.%${filters.search}%`);
            if (filters.dificultad) query = query.eq('dificultad', filters.dificultad);
            if (filters.fuente) query = query.eq('fuente', filters.fuente);
            if (filters.publicado !== undefined) query = query.eq('publicado', filters.publicado);
            const start = (page - 1) * pageSize;
            const { data, error, count } = await query
                .order('dificultad', { ascending: true })
                .range(start, start + pageSize - 1);
            if (error) { console.error('getProblemasPaginados:', error); return { data: [], count: 0 }; }
            return { data: data || [], count: count || 0 };
        },
        async getProblemaById(id) {
            const { data, error } = await supabase.from('icpc_problemas').select('*').eq('id', id).single();
            if (error) return null;
            return data;
        },
        async saveProblema(problema) {
            const { error } = await supabase.from('icpc_problemas').upsert({
                id: problema.id,
                titulo: problema.titulo,
                descripcion: problema.descripcion || '',
                dificultad: problema.dificultad || 1000,
                tags: problema.tags || [],
                fuente: problema.fuente || 'admin',
                tiempo_limite: problema.tiempo_limite || 2000,
                memoria_limite: problema.memoria_limite || 256,
                casos_prueba: problema.casos_prueba || [],
                publicado: problema.publicado || false,
                creado_por: problema.creado_por || null
            });
            if (error) { console.error('saveProblema:', error); throw error; }
            return true;
        },
        async saveProblemasLote(lista) {
            // Batch upsert para seed inicial
            const rows = lista.map(p => ({
                id: p.id || crypto.randomUUID(),
                titulo: p.titulo,
                descripcion: p.descripcion || '',
                dificultad: p.dificultad || 1000,
                tags: p.tags || [],
                fuente: p.fuente || 'local',
                tiempo_limite: p.tiempo_limite || 2000,
                memoria_limite: p.memoria_limite || 256,
                casos_prueba: p.casos_prueba || p.ejemplos || [],
                publicado: true,
                creado_por: 'seed'
            }));
            const { error } = await supabase.from('icpc_problemas').upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
            if (error) console.error('saveProblemasLote:', error);
        },
        async deleteProblema(id) {
            const { error } = await supabase.from('icpc_problemas').delete().eq('id', id);
            if (error) throw error;
        },

        // ─── Participantes Normalizados (icpc_participantes) ────────────────
        async getParticipantesByCoachYConcurso(emailCoach, concursoId) {
            const { data, error } = await supabase
                .from('icpc_participantes')
                .select('*')
                .eq('coach_email', emailCoach)
                .eq('concurso_id', concursoId);
            if (error) { console.error('getParticipantes:', error); return []; }
            return data || [];
        },

        async getParticipantesByCoach(emailCoach) {
            // Mantener compatibilidad: devuelve todos los alumnos de este coach
            const { data, error } = await supabase
                .from('icpc_participantes')
                .select('*')
                .eq('coach_email', emailCoach);
            if (error) { console.error('getParticipantesByCoach:', error); return []; }
            return data || [];
        },

        async saveParticipante(emailCoach, alumno, concursoId) {
            const emailNormal = alumno.email.toLowerCase().trim();
            const nombreNormal = alumno.nombre.toUpperCase().trim();
            const equipoNormal = alumno.equipo.trim();

            const { error } = await supabase.from('icpc_participantes').upsert({
                email: emailNormal,
                nombre: nombreNormal,
                equipo: equipoNormal,
                concurso_id: concursoId,
                coach_email: emailCoach,
                checkin: alumno.checkin || false
            }, { onConflict: 'email,concurso_id' });

            if (error) { console.error('saveParticipante:', error); throw error; }
            return true;
        },

        async deleteParticipante(emailAlumno, concursoId) {
            const { error } = await supabase
                .from('icpc_participantes')
                .delete()
                .eq('email', emailAlumno.toLowerCase())
                .eq('concurso_id', concursoId);
            if (error) throw error;
            return true;
        },

        async isAlumnoPermitido(email, concursoId = null) {
            const emailLower = email.toLowerCase().trim();
            let query = supabase.from('icpc_participantes').select('email, concurso_id').eq('email', emailLower);
            if (concursoId) query = query.eq('concurso_id', concursoId);
            const { data, error } = await query.limit(1);
            if (error) return { permitido: false, concursoId: null, equipo: null };
            if (!data || data.length === 0) return { permitido: false, concursoId: null, equipo: null };
            return { permitido: true, concursoId: data[0].concurso_id, equipo: data[0].equipo, nombre: data[0].nombre };
        },

        async setCheckin(email, concursoId) {
            const { error } = await supabase.from('icpc_participantes')
                .update({ checkin: true })
                .eq('email', email.toLowerCase())
                .eq('concurso_id', concursoId);
            if (error) console.error('setCheckin:', error);
        },


        // --- Usuarios (Profesores/Coaches/Jueces) ---
        async getUsuarios() {
            const { data, error } = await supabase.from('icpc_usuarios').select('*').order('nombre', { ascending: true });
            if (error) { console.error('getUsuarios:', error); return []; }
            return data || [];
        },
        async validateUsuario(email, password) {
            const h = await AuthState._hash(password);
            const { data, error } = await supabase.from('icpc_usuarios')
                .select('*')
                .eq('email', email.toLowerCase())
                .eq('password', h) // Comparamos el hash
                .single();
            if (error || !data) {
                // Fallback temporal para contraseñas en texto plano (migración)
                const { data: legacy } = await supabase.from('icpc_usuarios')
                    .select('*')
                    .eq('email', email.toLowerCase())
                    .eq('password', password)
                    .single();
                if (legacy) {
                    // Si entró con texto plano, actualizar a hash proactivamente
                    await supabase.from('icpc_usuarios').update({ password: h }).eq('email', email.toLowerCase());
                    return legacy;
                }
                return null;
            }
            return data;
        },
        async registerUsuario(user) {
            const h = await AuthState._hash(user.password);
            const { data, error } = await supabase.from('icpc_usuarios').insert({
                email: user.email.toLowerCase(),
                nombre: user.name,
                password: h, // Guardamos el hash
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

        // --- Submissions (Tiempo Real Supabase) ---
        async addSubmission(sub) {
            const concursoId = sub.concurso_id || window.currentConcursoId || 'GLOBAL';
            const { data, error } = await supabase.from('icpc_submissions').insert({
                concurso_id: concursoId,
                problema_id: sub.problema_id,
                alumno_email: sub.alumno_email || null,
                equipo: sub.equipo,
                veredicto: sub.veredicto,
                codigo_fuente: sub.codigo_fuente || '',
                lenguaje: sub.lenguaje || 'cpp',
                tiempo_ms: sub.tiempo_ms || 0,
                memoria_kb: sub.memoria_kb || 0,
                timestamp: Date.now()
            }).select().single();

            if (error) {
                console.error("Error addSubmission:", error);
                return;
            }

            // ── Lógica de Globos (Sprint 2) ──
            if (sub.veredicto === 'AC') {
                const { data: config } = await supabase.from('icpc_globos_config')
                    .select('color')
                    .eq('concurso_id', concursoId)
                    .eq('problema_id', sub.problema_id)
                    .single();

                const color = config?.color || '#cbd5e1';

                await supabase.from('icpc_globos_delivery').insert({
                    concurso_id: concursoId,
                    equipo_nombre: sub.equipo,
                    problema_id: sub.problema_id,
                    color: color,
                    entregado: false,
                    ts_ac: new Date().toISOString()
                });
            }
        },
        async getSubmissionsByConcurso(concurso_id) {
            const { data, error } = await supabase.from('icpc_submissions')
                .select('*')
                .eq('concurso_id', concurso_id)
                .order('timestamp', { ascending: true }); // ascendente para procesar cronológicamente
            if (error) { console.error("Error fetching subs", error); return []; }
            return data || [];
        },
        async addAnuncio(concurso_id, mensaje, titulo = 'Actualización del Juez', tipo = 'info') {
            await supabase.from('icpc_anuncios').insert({ concurso_id, titulo, mensaje, tipo });
        },
        async registrarAuditoria(dataLog) {
            try {
                await supabase.from('icpc_auditoria').insert(dataLog);
            } catch (err) {
                console.error("Auditoría: Fallo al registrar evento de seguridad", err);
            }
        }
    }
};
