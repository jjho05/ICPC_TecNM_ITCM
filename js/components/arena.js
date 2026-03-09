import { AuthState } from '../core/authState.js';
import { JudgeSim, VEREDICTOS } from '../core/judgeSim.js';
import { Judge0 } from '../core/judge0.js';
import { ConcursoSecurity } from '../core/concursoSecurity.js';
import { UIModal } from './ui/modal.js';

// ══════════════════════════════════════════════════════
//  La Arena — Editor de código + Juez + Scoreboard
// ══════════════════════════════════════════════════════

// ── Templates de código por lenguaje ─────────────────────────────────────
const CODE_TEMPLATES = {
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Tu solución aquí
    
    return 0;
}`,
    java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        
        // Tu solución aquí
        
    }
}`,
    python: `import sys
input = sys.stdin.readline

def solve():
    # Tu solución aquí
    pass

solve()`
};

let arenaTimer = null;
let concursoEndTime = null;
let problemaActivo = null;


export const ArenaView = () => {
    // Activar modo arena INMEDIATAMENTE (oculta footer/navbar)
    document.body.classList.add('arena-mode');

    setTimeout(async () => {
        if (!AuthState.isAlumno()) {
            document.body.classList.remove('arena-mode');
            window.router.navigate('/');
            return;
        }

        // Activar Seguridad
        ConcursoSecurity.init();

        const goFullscreen = await UIModal.confirm(
            '🛡️ Modo Concurso Activado',
            'Esta competencia requiere Pantalla Completa obligatoria. No podrás copiar, pegar ni salir de la pestaña sin ser detectado. ¿Deseas entrar?'
        );

        if (goFullscreen) {
            await ConcursoSecurity.requestFullscreen();
            initArena();
        } else {
            ConcursoSecurity.destroy();
            document.body.classList.remove('arena-mode');
            window.router.navigate('/');
        }

        ConcursoSecurity.handleFullscreenExit(() => {
            if (ConcursoSecurity.isActive) {
                UIModal.alert('⚠️ Alerta de Seguridad', 'Has salido del modo pantalla completa. Atención: esto es registrado.');
            }
        });

        const onNav = () => {
            document.body.classList.remove('arena-mode');
            ConcursoSecurity.destroy();
            if (arenaTimer) clearInterval(arenaTimer);
            window.removeEventListener('popstate', onNav);
        };
        window.addEventListener('popstate', onNav);
    }, 100);

    return `
    <div class="arena-root view-enter">

        <!-- ═══ TOPBAR DE LA ARENA ═══ -->
        <header class="arena-topbar">
            <div class="arena-topbar-left">
                <span class="arena-brand">
                    <i class="fa-solid fa-code" style="color:var(--tecnm-gold);"></i>
                    ICPC <strong>Arena</strong>
                </span>
                <div class="arena-prob-pills" id="arena-prob-pills">
                    <!-- Pills de problema se llenan por JS -->
                </div>
            </div>
            <div class="arena-topbar-center">
                <div id="arena-timer" class="arena-timer-topbar">
                    <i class="fa-regular fa-clock"></i>
                    <span id="arena-timer-val">--:--:--</span>
                </div>
            </div>
            <div class="arena-topbar-right">
                <span class="arena-team-badge">
                    <i class="fa-solid fa-users"></i>
                    <span id="arena-team-name">—</span>
                </span>
                <button class="arena-exit-btn" onclick="window.router.navigate('/')">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>
        </header>

        <!-- ═══ MAIN SPLIT LAYOUT ═══ -->
        <div class="arena-split">

            <!-- Panel Izquierdo: Problema + Ranking + Clarificaciones -->
            <aside class="arena-left">
                <nav class="arena-left-tabs">
                    <button class="arena-tab active" data-apanel="ap-problema">
                        <i class="fa-solid fa-file-code"></i> Problema
                    </button>
                    <button class="arena-tab" data-apanel="ap-ranking">
                        <i class="fa-solid fa-ranking-star"></i> Ranking
                    </button>
                    <button class="arena-tab" data-apanel="ap-historial">
                        <i class="fa-solid fa-clock-rotate-left"></i> Envíos
                    </button>
                    <button class="arena-tab" data-apanel="ap-clarif" id="arena-tab-clarif">
                        <i class="fa-solid fa-comment-dots"></i> Clarif.
                        <span id="arena-clarif-badge" class="arena-notif-dot" style="display:none;">!</span>
                    </button>
                </nav>

                <div id="ap-problema" class="arena-tab-content">
                    <div id="arena-prob-content" class="arena-prob-render">
                        <div class="arena-waiting">
                            <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
                            <p>Cargando concurso...</p>
                        </div>
                    </div>
                </div>

                <div id="ap-ranking" class="arena-tab-content" style="display:none;">
                    <div id="arena-scoreboard" class="arena-scoreboard-wrap"></div>
                </div>

                <!-- Panel: Historial de Envíos del equipo -->
                <div id="ap-historial" class="arena-tab-content" style="display:none;">
                    <div class="arena-clarif-wrap">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem;">
                            <h4 class="arena-clarif-title" style="margin:0;"><i class="fa-solid fa-clock-rotate-left"></i> Mis Envíos</h4>
                            <button class="btn-tbl" id="btn-refresh-historial"><i class="fa-solid fa-rotate"></i></button>
                        </div>
                        <div id="arena-historial-list">
                            <p style="opacity:.4;font-size:.85rem;">Cargando...</p>
                        </div>
                    </div>
                </div>

                <div id="ap-clarif" class="arena-tab-content arena-clarif-wrap" style="display:none;">
                    <div class="arena-clarif-form">
                        <h4 class="arena-clarif-title"><i class="fa-solid fa-comment-question"></i> Nueva Clarificaci&#243;n</h4>
                        <select id="clarif-problema-sel" class="arena-lang-sel" style="width:100%;margin-bottom:.6rem;">
                            <option value="">&#8212; General (sin problema espec&#237;fico) &#8212;</option>
                        </select>
                        <textarea id="clarif-pregunta" class="arena-clarif-textarea" rows="3" placeholder="Describe tu duda sobre el enunciado..."></textarea>
                        <button class="arena-btn arena-btn--submit" id="btn-enviar-clarif" style="width:100%;margin-top:.6rem;">
                            <i class="fa-solid fa-paper-plane"></i> Enviar
                        </button>
                    </div>
                    <div class="arena-clarif-history">
                        <h4 class="arena-clarif-title" style="margin-top:1rem;"><i class="fa-solid fa-list-check"></i> Mis Preguntas</h4>
                        <div id="arena-clarif-list"><p style="opacity:.4;font-size:.85rem;">No has enviado preguntas.</p></div>
                    </div>
                    <div class="arena-clarif-history">
                        <h4 class="arena-clarif-title" style="margin-top:1rem;"><i class="fa-solid fa-bullhorn"></i> Clarificaciones P&#250;blicas</h4>
                        <div id="arena-clarif-public"><p style="opacity:.4;font-size:.85rem;">Sin clarificaciones p&#250;blicas a&#250;n.</p></div>
                    </div>
                </div>
            </aside>

            <!-- Panel Derecho: Editor de Código -->
            <main class="arena-right">
                <!-- Toolbar del editor -->
                <div class="arena-editor-bar">
                    <div class="arena-editor-bar-left">
                        <i class="fa-brands fa-codepen" style="color:var(--tecnm-gold);"></i>
                        <select id="arena-lang" class="arena-lang-sel">
                            <option value="cpp">C++ 17</option>
                            <option value="java">Java 17</option>
                            <option value="python">Python 3</option>
                        </select>
                    </div>
                    <div class="arena-editor-bar-right">
                        <button class="arena-btn arena-btn--ghost" id="btn-arena-probar">
                            <i class="fa-solid fa-play"></i> Probar
                        </button>
                        <button class="arena-btn arena-btn--submit" id="btn-arena-enviar" disabled>
                            <i class="fa-solid fa-paper-plane"></i> Enviar
                        </button>
                    </div>
                </div>

                <!-- Editor -->
                <div class="arena-editor-wrap">
                    <div class="arena-line-nums" id="arena-line-nums">1</div>
                    <textarea
                        id="arena-code"
                        class="arena-code"
                        spellcheck="false"
                        autocomplete="off"
                        autocorrect="off"
                        placeholder="// Escribe tu solución aquí...&#10;#include &lt;bits/stdc++.h&gt;&#10;using namespace std;&#10;&#10;int main() {&#10;    &#10;}"
                    ></textarea>
                </div>

                <!-- Panel Output/Veredicto -->
                <div id="arena-output-panel" class="arena-output">
                    <div class="arena-output-bar">
                        <span id="arena-output-title" class="arena-output-label">Output</span>
                        <span id="arena-verd-badge"></span>
                        <button class="arena-output-clear" onclick="document.getElementById('arena-output-pre').textContent=''">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                    <pre id="arena-output-pre" class="arena-output-pre">Selecciona un problema y escribe tu código.</pre>
                </div>
            </main>
        </div>
    </div>`;
};


async function initArena() {
    const all = await AuthState.db.getConcursos();
    // Aceptar activo o programado
    const concurso = all.find(c => c.estado === 'activo' || c.estado === 'programado');

    if (!concurso) {
        document.getElementById('arena-prob-content').innerHTML = `
            <div class="arena-waiting">
                <i class="fa-solid fa-hourglass-half fa-2x" style="color:var(--tecnm-gold);"></i>
                <h3 style="color:white;">Sin concurso activo</h3>
                <p>No hay competencias en este momento.</p>
                <button onclick="window.router.navigate('/')" class="arena-btn arena-btn--ghost" style="margin-top:1rem;">
                    <i class="fa-solid fa-arrow-left"></i> Volver
                </button>
            </div>`;
        return;
    }

    window.currentConcursoId = concurso.id;

    // ── Pre-Concurso (Countdown) ──
    if (concurso.estado === 'programado') {
        renderCountdown(concurso);
        return; // Salimos de initArena tempranamente, el layout principal se oculta
    }

    // ── Si está activo, inicialización normal ──
    // Nombre del equipo
    document.getElementById('arena-team-name').textContent =
        AuthState.user.team || AuthState.user.email;

    // ── Cargar problemas desde Supabase (async) ──────────────────────
    const todosProb = await AuthState.db.getProblemas();
    const problemas = (concurso.problemas || [])
        .map(id => todosProb.find(p => p.id === id))
        .filter(Boolean);

    renderProbPills(problemas);
    if (problemas.length) {
        seleccionarProblema(problemas[0]);
        document.getElementById('btn-arena-enviar').disabled = false;
    }

    // ── Populate selector de clarificaciones ─────────────────────────
    const clarifSel = document.getElementById('clarif-problema-sel');
    if (clarifSel) {
        problemas.forEach((p, i) => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${String.fromCharCode(65 + i)}. ${p.titulo}`;
            clarifSel.appendChild(opt);
        });
    }

    // ── Cronómetro ───────────────────────────────────────────────────
    if (concurso.ts_fin) {
        concursoEndTime = new Date(concurso.ts_fin).getTime();
        actualizarTimer();
        if (arenaTimer) clearInterval(arenaTimer);
        arenaTimer = setInterval(actualizarTimer, 1000);
    }

    // ── Suscripciones Realtime ────────────────────────────────────────
    subscribeToScoreboard(concurso.id);
    subscribeToAnuncios(concurso.id);
    subscribeToClarificaciones(concurso.id);

    // ── Tabs ─────────────────────────────────────────────────────────
    document.querySelectorAll('.arena-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.arena-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.arena-tab-content').forEach(c => c.style.display = 'none');
            const target = document.getElementById(btn.dataset.apanel);
            if (target) target.style.display = 'block';

            if (btn.dataset.apanel === 'ap-ranking') renderArenaScoreboardById(concurso.id);

            if (btn.dataset.apanel === 'ap-historial') {
                cargarHistorialEnvios(concurso.id);
            }

            if (btn.dataset.apanel === 'ap-clarif') {
                // Quitar badge de notificación al abrir
                const badge = document.getElementById('arena-clarif-badge');
                if (badge) badge.style.display = 'none';
                cargarMisClarificaciones(concurso.id);
            }
        });
    });

    // ── Botón refrescar historial manual ──
    const btnRefHist = document.getElementById('btn-refresh-historial');
    if (btnRefHist) btnRefHist.addEventListener('click', () => cargarHistorialEnvios(concurso.id));


    // ── Evento: enviar clarificación ──────────────────────────────────
    document.getElementById('btn-enviar-clarif').addEventListener('click', () => enviarClarificacion(concurso.id));

    document.getElementById('btn-arena-probar').addEventListener('click', () => probarCodigo(false));
    document.getElementById('btn-arena-enviar').addEventListener('click', () => probarCodigo(true));
    document.getElementById('arena-code').addEventListener('input', updateLineNums);

    // Template inicial
    const codeEl = document.getElementById('arena-code');
    const langSel = document.getElementById('arena-lang');
    codeEl.value = CODE_TEMPLATES[langSel.value] || CODE_TEMPLATES.cpp;
    updateLineNums();

    // Cambio de lenguaje → cargar template si el editor está sin código real
    langSel.addEventListener('change', () => {
        const currentCode = codeEl.value.trim();
        const isTemplate = Object.values(CODE_TEMPLATES).some(t => t.trim() === currentCode);
        if (!currentCode || isTemplate) {
            codeEl.value = CODE_TEMPLATES[langSel.value] || '';
            updateLineNums();
        }
    });

    // Ctrl+Enter = Enviar
    codeEl.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); probarCodigo(true); }
        if (e.key === 'Tab') { e.preventDefault(); const s = codeEl.selectionStart; codeEl.value = codeEl.value.substring(0, s) + '    ' + codeEl.value.substring(codeEl.selectionEnd); codeEl.selectionStart = codeEl.selectionEnd = s + 4; }
    });


    // ── Cargar clarificaciones públicas iniciales ─────────────────────
    cargarClarificacionesPublicas(concurso.id);
}

// ── Clarificaciones ───────────────────────────────────────────────────────

async function enviarClarificacion(concursoId) {
    const pregunta = document.getElementById('clarif-pregunta').value.trim();
    const probId = document.getElementById('clarif-problema-sel')?.value || null;
    const btn = document.getElementById('btn-enviar-clarif');

    if (!pregunta) { UIModal.alert('Campo vacío', 'Escribe tu pregunta antes de enviar.'); return; }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    const { error } = await supabase.from('icpc_clarificaciones').insert({
        concurso_id: concursoId,
        problema_id: probId || null,
        equipo_nombre: AuthState.user.team || AuthState.user.email,
        pregunta
    });

    if (error) {
        UIModal.alert('Error', 'No se pudo enviar la clarificación.');
    } else {
        document.getElementById('clarif-pregunta').value = '';
        await cargarMisClarificaciones(concursoId);
        UIModal.alert('✅ Enviada', 'Tu clarificación fue enviada al Juez. Revisa aquí la respuesta.');
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar';
}

async function cargarMisClarificaciones(concursoId) {
    const listEl = document.getElementById('arena-clarif-list');
    if (!listEl) return;

    const equipo = AuthState.user.team || AuthState.user.email;
    const { data, error } = await supabase
        .from('icpc_clarificaciones')
        .select('*')
        .eq('concurso_id', concursoId)
        .eq('equipo_nombre', equipo)
        .order('ts_pregunta', { ascending: false });

    if (error || !data?.length) {
        listEl.innerHTML = '<p style="opacity:.4;font-size:.85rem;">No has enviado preguntas aún.</p>';
        return;
    }

    listEl.innerHTML = data.map(c => `
        <div class="clarif-item ${c.respuesta ? 'clarif-respondida' : 'clarif-pendiente'}">
            <div class="clarif-pregunta"><i class="fa-solid fa-circle-question"></i> ${c.pregunta}</div>
            <div class="clarif-respuesta">
                ${c.respuesta
            ? `<i class="fa-solid fa-circle-check" style="color:var(--status-ac);"></i> <strong>Juez:</strong> ${c.respuesta}`
            : `<i class="fa-solid fa-clock" style="color:var(--tecnm-gold);"></i> <em>Pendiente de respuesta...</em>`}
            </div>
            <div class="clarif-ts">${new Date(c.ts_pregunta).toLocaleTimeString('es-MX')}</div>
        </div>`).join('');
}

async function cargarClarificacionesPublicas(concursoId) {
    const pubEl = document.getElementById('arena-clarif-public');
    if (!pubEl) return;

    const { data } = await supabase
        .from('icpc_clarificaciones')
        .select('*')
        .eq('concurso_id', concursoId)
        .eq('visible_todos', true)
        .order('ts_respuesta', { ascending: false });

    if (!data?.length) {
        pubEl.innerHTML = '<p style="opacity:.4;font-size:.85rem;">Sin clarificaciones públicas aún.</p>';
        return;
    }

    pubEl.innerHTML = data.map(c => `
        <div class="clarif-item clarif-respondida">
            <div class="clarif-pregunta"><i class="fa-solid fa-users"></i> ${c.pregunta}</div>
            <div class="clarif-respuesta"><i class="fa-solid fa-circle-check" style="color:var(--status-ac);"></i> <strong>Juez:</strong> ${c.respuesta}</div>
        </div>`).join('');
}

// ── Anuncios Realtime (Broadcast del Juez) ────────────────────────────────

function subscribeToAnuncios(concursoId) {
    supabase.channel(`anuncios_${concursoId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'icpc_anuncios',
            filter: `concurso_id=eq.${concursoId}`
        }, payload => {
            mostrarToastAnuncio(payload.new);
        })
        .subscribe();
}

function mostrarToastAnuncio(anuncio) {
    const container = document.getElementById('arena-anuncios-container');
    if (!container) return;

    const colorMap = { info: '#3b82f6', warning: '#f59e0b', critico: '#ef4444', problema_corregido: '#22c55e' };
    const iconMap = { info: 'fa-circle-info', warning: 'fa-triangle-exclamation', critico: 'fa-siren-on', problema_corregido: 'fa-wrench' };
    const color = colorMap[anuncio.tipo] || '#3b82f6';
    const icon = iconMap[anuncio.tipo] || 'fa-circle-info';

    const toast = document.createElement('div');
    toast.className = 'arena-toast';
    toast.style.cssText = `
        background: rgba(20,20,35,0.95);
        border-left: 4px solid ${color};
        border-radius: 8px;
        padding: .85rem 1.1rem;
        min-width: 280px; max-width: 380px;
        box-shadow: 0 8px 30px rgba(0,0,0,.6);
        pointer-events: all;
        animation: slideInRight .3s ease;
        font-family: var(--font-display,'Inter',sans-serif);
    `;
    toast.innerHTML = `
        <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.3rem;">
            <i class="fa-solid ${icon}" style="color:${color};font-size:1rem;"></i>
            <strong style="color:white;font-size:.9rem;">${anuncio.titulo || 'Anuncio del Juez'}</strong>
        </div>
        <p style="color:rgba(255,255,255,.75);font-size:.83rem;margin:0;">${anuncio.mensaje}</p>
        <div style="text-align:right;margin-top:.4rem;">
            <small style="color:rgba(255,255,255,.3);font-size:.75rem;">${new Date().toLocaleTimeString('es-MX')}</small>
        </div>`;
    container.appendChild(toast);

    // Auto-dismiss a los 12 segundos (crítico: 30s)
    const delay = anuncio.tipo === 'critico' ? 30000 : 12000;
    setTimeout(() => toast.remove(), delay);
}

// ── Suscripción a Clarificaciones Públicas en tiempo real ─────────────────

function subscribeToClarificaciones(concursoId) {
    supabase.channel(`clarif_public_${concursoId}`)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'icpc_clarificaciones',
            filter: `concurso_id=eq.${concursoId}`
        }, payload => {
            const updated = payload.new;
            // Notificar si se respondió una pregunta del equipo
            const equipo = AuthState.user.team || AuthState.user.email;
            if (updated.equipo_nombre === equipo && updated.respuesta) {
                const badge = document.getElementById('arena-clarif-badge');
                if (badge) badge.style.display = 'inline';
                mostrarToastAnuncio({
                    tipo: 'info',
                    titulo: '✉️ Respuesta a tu Clarificación',
                    mensaje: `Juez: ${updated.respuesta}`
                });
                // Refrescar lista si está visible
                const tab = document.getElementById('ap-clarif');
                if (tab && tab.style.display !== 'none') cargarMisClarificaciones(concursoId);
            }
            // Si es pública, refrescar sección de públicas
            if (updated.visible_todos) cargarClarificacionesPublicas(concursoId);
        })
        .subscribe();
}


function renderProbPills(problemas) {
    const pills = document.getElementById('arena-prob-pills');
    if (!pills) return;
    pills.innerHTML = problemas.map((p, i) => `
        <button class="arena-prob-pill ${i === 0 ? 'active' : ''}" data-pid="${p.id}">
            ${String.fromCharCode(65 + i)}. ${p.titulo}
        </button>`).join('');

    pills.querySelectorAll('.arena-prob-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            const prob = AuthState.db.getProblemaById(btn.dataset.pid);
            if (prob) {
                pills.querySelectorAll('.arena-prob-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                seleccionarProblema(prob);
            }
        });
    });
}

function seleccionarProblema(prob) {
    problemaActivo = prob;
    const content = document.getElementById('arena-prob-content');
    if (!content) return;

    const ejemplos = (prob.ejemplos || []).slice(0, 2).map(ej => `
        <div class="ejemplo-block">
            <div class="ejemplo-col">
                <div class="ejemplo-header">Input</div>
                <pre class="ejemplo-pre">${ej.input}</pre>
            </div>
            <div class="ejemplo-col">
                <div class="ejemplo-header">Output</div>
                <pre class="ejemplo-pre">${ej.output}</pre>
            </div>
        </div>`).join('');

    content.innerHTML = `
        <div class="prob-render">
            ${prob.desc || '<p>Sin descripción.</p>'}
            ${ejemplos ? `<h4 class="ejemplos-title">Ejemplos</h4>${ejemplos}` : ''}
        </div>`;

    // Actualizar output panel
    document.getElementById('arena-output-pre').textContent = 'Escribe tu código y presiona Probar o Enviar.';
    document.getElementById('arena-verd-badge').innerHTML = '';
}

async function probarCodigo(esEnvio) {
    if (!problemaActivo) {
        UIModal.alert('Selecciona un problema', 'Debes elegir un problema antes de enviar.');
        return;
    }
    const code = document.getElementById('arena-code').value?.trim();
    const lang = document.getElementById('arena-lang').value;

    if (!code || code.length < 5) {
        UIModal.alert('Código vacío', 'Escribe tu solución antes de enviar.'); return;
    }

    const outputPanel = document.getElementById('arena-output-panel');
    const outputPre = document.getElementById('arena-output-pre');
    const verdBadge = document.getElementById('arena-verd-badge');
    const outputTitle = document.getElementById('arena-output-title');
    const btnEnviar = document.getElementById('btn-arena-enviar');
    const btnProbar = document.getElementById('btn-arena-probar');

    outputPanel.className = 'arena-output-panel loading';
    outputPre.textContent = esEnvio
        ? '⏳ Ejecutando código REAL en servidor... (puede tardar 3–8 segundos)'
        : '⏳ Ejecutando en servidor...';
    verdBadge.innerHTML = '';
    if (btnEnviar) btnEnviar.disabled = true;
    if (btnProbar) btnProbar.disabled = true;

    const casos = problemaActivo.casos_prueba || problemaActivo.testcases || problemaActivo.ejemplos || [];
    const primer = casos[0] || {};
    const stdin = primer.entrada || primer.input || '';
    const expected = (primer.salida_esperada || primer.output || primer.expected || '').trim();

    let resultado;
    try {
        if (esEnvio) {
            resultado = await Judge0.evaluate(
                code, lang, stdin, expected,
                (problemaActivo.tiempo_limite || 2000) / 1000,
                (problemaActivo.memoria_limite || 256) * 1024
            );
            if (resultado.veredicto === 'SE') {
                outputPre.textContent = '⚠️ Judge0 no disponible, usando simulación...';
                await new Promise(r => setTimeout(r, 600));
                const sim = JudgeSim.evaluate(code, lang, problemaActivo);
                resultado = { ...sim, output: sim.output || sim.mensaje };
            }
        } else {
            resultado = await Judge0.run(code, lang, primer);
            if (resultado.veredicto === 'SE') {
                const sim = JudgeSim.run(code, lang, primer);
                resultado = { ok: sim.ok, output: sim.output, veredicto: sim.ok ? 'AC' : 'WA' };
            }
        }
    } catch (e) {
        resultado = { veredicto: 'SE', output: 'Error de red.', mensaje: e.message };
    }

    const v = esEnvio ? resultado.veredicto : (resultado.ok ? 'AC' : (resultado.veredicto || 'WA'));
    const vInfo = VEREDICTOS[v] || { nombre: v, color: '#888', icon: 'fa-circle-question' };

    verdBadge.innerHTML = `
        <span style="background:${vInfo.color}20;color:${vInfo.color};border:1px solid ${vInfo.color}40;
            padding:.28rem .8rem;border-radius:20px;font-weight:700;font-size:.82rem;display:inline-flex;align-items:center;gap:.4rem;">
            <i class="fa-solid ${vInfo.icon}"></i>${v} &mdash; ${vInfo.nombre}
        </span>`;

    outputPanel.className = `arena-output-panel vp-${v.toLowerCase()}`;
    const timeTxt = resultado.tiempo_ms ? `${resultado.tiempo_ms}ms` : '';
    const memTxt = resultado.memoria_kb ? `${Math.round(resultado.memoria_kb / 1024)}MB` : '';
    outputTitle.textContent = [esEnvio ? 'Envío' : 'Prueba', timeTxt, memTxt].filter(Boolean).join(' | ');

    const errExtra = resultado.error && resultado.error !== resultado.output ? `\n-- Stderr --\n${resultado.error}` : '';
    outputPre.textContent = (resultado.output + errExtra).trim() || resultado.mensaje || '(sin salida)';

    if (esEnvio && AuthState.isAlumno() && window.currentConcursoId) {
        await AuthState.db.addSubmission({
            alumno_email: AuthState.user.email,
            equipo: AuthState.user.team || AuthState.user.email,
            problema_id: problemaActivo.id,
            concurso_id: window.currentConcursoId,
            veredicto: v,
            tiempo_ms: resultado.tiempo_ms || 0,
            memoria_kb: resultado.memoria_kb || 0,
            codigo_fuente: code,
            lenguaje: lang
        });
        const histTab = document.getElementById('ap-historial');
        if (histTab && histTab.style.display !== 'none') cargarHistorialEnvios(window.currentConcursoId);
    }

    if (btnEnviar) btnEnviar.disabled = false;
    if (btnProbar) btnProbar.disabled = false;
}

// ── Historial de Envíos del equipo ─────────────────────────────────────────

async function cargarHistorialEnvios(concursoId) {
    const el = document.getElementById('arena-historial-list');
    if (!el) return;

    const equipo = AuthState.user.team || AuthState.user.email;
    const { data } = await supabase
        .from('icpc_submissions')
        .select('*')
        .eq('concurso_id', concursoId)
        .eq('equipo', equipo)
        .order('timestamp', { ascending: false })
        .limit(50);

    if (!data?.length) {
        el.innerHTML = '<p style="opacity:.4;font-size:.85rem;text-align:center;padding:1rem;">¡Aún no has enviado nada!</p>';
        return;
    }

    const VMAP = { AC: '#22c55e', WA: '#ef4444', TLE: '#f59e0b', MLE: '#8b5cf6', RE: '#f97316', CE: '#6b7280', PE: '#06b6d4', SE: '#dc2626' };
    el.innerHTML = data.map(s => {
        const color = VMAP[s.veredicto] || '#888';
        const ts = new Date(s.timestamp || s.ts_servidor || 0).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return `<div style="display:grid;grid-template-columns:3.5rem 1fr auto auto;gap:.5rem;align-items:center;
            padding:.45rem .7rem;border-radius:6px;margin-bottom:.3rem;background:rgba(255,255,255,0.03);border-left:3px solid ${color};">
            <span style="font-weight:800;color:${color};font-size:.8rem;">${s.veredicto}</span>
            <span style="color:rgba(255,255,255,.7);font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.problema_id || ''}</span>
            <span style="color:rgba(255,255,255,.35);font-size:.72rem;">${s.tiempo_ms ? s.tiempo_ms + 'ms' : ''}</span>
            <span style="color:rgba(255,255,255,.3);font-size:.7rem;">${ts}</span>
        </div>`;
    }).join('');
}




// ── SISTEMA DE TIEMPO REAL Y SINCRONIZACIÓN ──

async function getServerTime() {
    // Supabase no tiene una función sencilla de "now" via REST, 
    // pero podemos hacer un select de una función RPC o simplemente confiar en el drift mínimo
    // si sincronizamos una vez al inicio. Para máxima precisión:
    return Date.now(); // Por ahora, implementaremos drift compensation si es necesario
}

let sbSubscription = null;

function subscribeToScoreboard(concursoId) {
    if (sbSubscription) supabase.removeChannel(sbSubscription);

    sbSubscription = supabase.channel('schema-db-changes')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'icpc_submissions',
            filter: `concurso_id=eq.${concursoId}`
        }, (payload) => {
            console.log('Nuevos envíos detectados!', payload);
            renderArenaScoreboardById(concursoId);
        })
        .subscribe();
}

async function renderArenaScoreboardById(concursoId) {
    const wrap = document.getElementById('arena-scoreboard');
    if (!wrap) return;

    const concurso = await AuthState.db.getConcursoById(concursoId);
    if (!concurso) return;

    const problemas = (concurso.problemas || []).map(id => AuthState.db.getProblemaById(id)).filter(Boolean);
    const subs = await AuthState.db.getSubmissionsByConcurso(concursoId);

    const equipos = {};
    subs.forEach(s => {
        if (!equipos[s.equipo]) equipos[s.equipo] = { probs: {}, total: 0, penalty: 0 };
        if (!equipos[s.equipo].probs[s.problema_id]) equipos[s.equipo].probs[s.problema_id] = { ac: false, tries: 0 };

        if (s.veredicto === 'AC' && !equipos[s.equipo].probs[s.problema_id].ac) {
            equipos[s.equipo].probs[s.problema_id].ac = true;
            equipos[s.equipo].total++;
            // Penalización: (tries * 20) + min_desde_inicio (simplificado)
            equipos[s.equipo].penalty += (equipos[s.equipo].probs[s.problema_id].tries * 20);
        } else if (s.veredicto !== 'AC' && !equipos[s.equipo].probs[s.problema_id].ac) {
            equipos[s.equipo].probs[s.problema_id].tries++;
        }
    });

    const rows = Object.entries(equipos).sort((a, b) => b[1].total - a[1].total || a[1].penalty - b[1].penalty);

    if (!rows.length) {
        wrap.innerHTML = '<div class="coach-empty-state"><i class="fa-solid fa-hourglass-start"></i><p>Esperando primeros envíos...</p></div>';
        return;
    }

    wrap.innerHTML = `<table class="scoreboard-table arena-score-sm">
        <thead><tr><th>#</th><th>Equipo</th>${problemas.map((_, i) => `<th>${String.fromCharCode(65 + i)}</th>`).join('')}<th>AC</th><th>PEN</th></tr></thead>
        <tbody>${rows.map(([eq, data], i) => `
            <tr class="${i === 0 ? 'rank-1' : ''} ${i === 1 ? 'rank-2' : ''}">
                <td>${i + 1}</td>
                <td style="text-align:left; font-weight:600;">${eq}</td>
                ${problemas.map(p => {
        const st = data.probs[p.id];
        const cls = st?.ac ? 'sb-ac' : (st?.tries > 0 ? 'sb-wa' : 'sb-empty');
        return `<td class="${cls}">${st?.ac ? '✓' : (st?.tries > 0 ? `-${st.tries}` : '—')}</td>`;
    }).join('')}
                <td class="sb-total">${data.total}</td>
                <td style="font-size:0.75rem; opacity:0.7;">${data.penalty}</td>
            </tr>`).join('')}
        </tbody></table>`;
}

function actualizarTimer() {
    const timerEl = document.getElementById('arena-timer');
    const valEl = document.getElementById('arena-timer-val');
    if (!valEl || !concursoEndTime) return;

    const diff = concursoEndTime - Date.now();
    if (diff <= 0) {
        valEl.textContent = '00:00:00';
        if (timerEl) timerEl.className = 'arena-timer-topbar danger';
        clearInterval(arenaTimer);
        const btn = document.getElementById('btn-arena-enviar');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-lock"></i> Tiempo agotado'; }
        return;
    }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    valEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (timerEl) {
        timerEl.className = diff < 300000 ? 'arena-timer-topbar danger'
            : diff < 900000 ? 'arena-timer-topbar warning'
                : 'arena-timer-topbar';
    }
}

function updateLineNums() {
    const code = document.getElementById('arena-code')?.value || '';
    const lines = code.split('\n').length;
    const nums = document.getElementById('arena-line-nums');
    if (nums) nums.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
}

function renderArenaScoreboard(concurso) {
    const wrap = document.getElementById('arena-scoreboard');
    if (!wrap) return;
    const problemas = (concurso.problemas || []).map(id => AuthState.db.getProblemaById(id)).filter(Boolean);
    const subs = AuthState.db.getSubmissionsByConcurso(concurso.id);

    const equipos = {};
    subs.forEach(s => {
        if (!equipos[s.equipo]) equipos[s.equipo] = { probs: {}, total: 0 };
        if (!equipos[s.equipo].probs[s.problema_id]) equipos[s.equipo].probs[s.problema_id] = false;
        if (s.veredicto === 'AC') { equipos[s.equipo].probs[s.problema_id] = true; equipos[s.equipo].total++; }
    });

    const rows = Object.entries(equipos).sort((a, b) => b[1].total - a[1].total);
    if (!rows.length) { wrap.innerHTML = '<p style="color:rgba(255,255,255,.3);padding:2rem;text-align:center;">Sin submissions.</p>'; return; }

    wrap.innerHTML = `<table class="scoreboard-table arena-score-sm">
        <thead><tr><th>#</th><th>Equipo</th>${problemas.map((_, i) => `<th>${String.fromCharCode(65 + i)}</th>`).join('')}<th>AC</th></tr></thead>
        <tbody>${rows.map(([eq, data], i) => `
            <tr class="${i === 0 ? 'rank-1' : ''}">
                <td>${i + 1}</td><td>${eq}</td>
                ${problemas.map(p => `<td class="${data.probs[p.id] ? 'sb-ac' : 'sb-empty'}">${data.probs[p.id] ? '✓' : '—'}</td>`).join('')}
                <td class="sb-total">${data.total}</td>
            </tr>`).join('')}
        </tbody></table>`;
}

// ── Sala de Espera Pre-Concurso (Countdown) ──
let preTimerInterval = null;

function renderCountdown(concurso) {
    const root = document.getElementById('arena-root');
    if (!root) return;

    root.innerHTML = `
        <div style="min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; 
                    background:linear-gradient(to bottom, var(--tecnm-blue), #0f172a); color:white; padding:2rem; text-align:center;">
            
            <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); 
                        padding:3rem 4rem; border-radius:16px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5); 
                        backdrop-filter:blur(10px); max-width:600px;">
                
                <i class="fa-solid fa-rocket fa-3x" style="color:var(--tecnm-gold); margin-bottom:1.5rem; animation:pulse 2s infinite;"></i>
                
                <h1 style="font-size:2rem; margin-bottom:0.5rem; font-weight:800;">${concurso.nombre}</h1>
                <p style="color:rgba(255,255,255,0.7); font-size:1.1rem; margin-bottom:2rem;">El concurso está programado, pero aún no inicia.</p>
                
                <div style="display:flex; justify-content:center; gap:1.5rem; margin-bottom:2.5rem;">
                    <div class="cd-box"><span id="cd-h">00</span><small>Horas</small></div>
                    <div class="cd-box"><span id="cd-m">00</span><small>Minutos</small></div>
                    <div class="cd-box"><span id="cd-s">00</span><small>Segundos</small></div>
                </div>

                <div style="text-align:center;">
                    <button id="btn-cd-volver" class="arena-btn arena-btn--ghost" style="font-size:1rem; padding:0.6rem 2rem;">
                        <i class="fa-solid fa-arrow-left"></i> Volver al Inicio
                    </button>
                    <p style="margin-top:1rem; font-size:0.8rem; color:rgba(255,255,255,0.4);">
                        La página se recargará automáticamente cuando inicie.
                    </p>
                </div>
            </div>
            <style>
                .cd-box { background:rgba(0,0,0,0.3); padding:1rem 1.5rem; border-radius:12px; border:1px solid rgba(255,255,255,0.05); min-width:80px; }
                .cd-box span { display:block; font-size:2.5rem; font-weight:800; font-family:'Courier New', monospace; color:white; line-height:1; }
                .cd-box small { display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--tecnm-gold); margin-top:0.5rem; font-weight:600; }
                @keyframes pulse { 0%, 100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.1) translateY(-5px); opacity:0.8; } }
            </style>
        </div>
    `;

    document.getElementById('btn-cd-volver')?.addEventListener('click', () => {
        if (preTimerInterval) clearInterval(preTimerInterval);
        window.router.navigate('/');
    });

    const inicio = new Date(concurso.ts_inicio).getTime();

    // Iniciar timer
    if (preTimerInterval) clearInterval(preTimerInterval);
    actualizarCountdownTimer(inicio);
    preTimerInterval = setInterval(() => actualizarCountdownTimer(inicio), 1000);
}

function actualizarCountdownTimer(inicioMs) {
    const diff = inicioMs - Date.now();

    // Si el tiempo llegó a 0, recargar para entrar a la arena
    if (diff <= 0) {
        if (preTimerInterval) clearInterval(preTimerInterval);
        window.location.reload();
        return;
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    const elH = document.getElementById('cd-h');
    const elM = document.getElementById('cd-m');
    const elS = document.getElementById('cd-s');

    if (elH) elH.textContent = String(h).padStart(2, '0');
    if (elM) elM.textContent = String(m).padStart(2, '0');
    if (elS) elS.textContent = String(s).padStart(2, '0');
}
