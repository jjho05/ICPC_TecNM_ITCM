// ══════════════════════════════════════════════════════
//  Judge0 — Ejecutor de código REAL
//  Usa la API pública de Judge0 CE (Community Edition)
//  Documentación: https://ce.judge0.com
//  Sin API Key requerida para el free tier (rate limit: ~50 req/min)
// ══════════════════════════════════════════════════════

// Mapa de lenguajes a IDs de Judge0 CE
const JUDGE0_LANG_IDS = {
    cpp: 54,  // C++ (GCC 9.2.0)
    c: 50,  // C (GCC 9.2.0)
    java: 62,  // Java (OpenJDK 13.0.1)
    python: 71,  // Python (3.8.1)
    js: 63,  // JavaScript (Node.js 12.14.0)
    go: 60,  // Go (1.13.5)
    rust: 73,  // Rust (1.40.0)
};

const JUDGE0_BASE = 'https://ce.judge0.com';

// Veredictos de Judge0 (status.id)
const JUDGE0_STATUS = {
    1: 'Queue',
    2: 'Processing',
    3: 'AC',   // Accepted
    4: 'WA',   // Wrong Answer
    5: 'TLE',  // Time Limit Exceeded
    6: 'CE',   // Compilation Error
    7: 'RE',   // SIGSEGV (Segmentation Fault)
    8: 'RE',   // SIGXFSZ
    9: 'RE',   // SIGFPE
    10: 'RE',   // SIGABRT
    11: 'RE',   // NZEC
    12: 'RE',   // Runtime Error (Other)
    13: 'SE',   // Internal Error
    14: 'MLE',  // Exec Format Error
};

export const Judge0 = {

    /**
     * Envía código a Judge0 y espera el resultado.
     * @param {string} sourceCode  - Código fuente
     * @param {string} lang        - 'cpp' | 'java' | 'python'
     * @param {string} stdin       - Entrada estándar para el programa
     * @param {string} expectedOut - Salida esperada (para comparar con AC)
     * @param {number} timeLimitSec - Límite de tiempo en segundos (default: 2)
     * @param {number} memLimitKB  - Límite de memoria en KB (default: 262144 = 256MB)
     * @returns {Promise<{veredicto, tiempo_ms, memoria_kb, output, error, mensaje}>}
     */
    async evaluate(sourceCode, lang, stdin = '', expectedOut = '', timeLimitSec = 2, memLimitKB = 262144) {
        const langId = JUDGE0_LANG_IDS[lang];
        if (!langId) {
            return this._error('CE', `Lenguaje "${lang}" no soportado.`);
        }

        try {
            // 1. Crear submission
            const submitRes = await fetch(`${JUDGE0_BASE}/submissions?base64_encoded=false&wait=false`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language_id: langId,
                    source_code: sourceCode,
                    stdin: stdin,
                    expected_output: expectedOut || undefined,
                    cpu_time_limit: timeLimitSec,
                    memory_limit: memLimitKB,
                    wall_time_limit: timeLimitSec + 2, // Buffer
                })
            });

            if (!submitRes.ok) {
                const errText = await submitRes.text();
                return this._error('SE', `Judge0 no disponible: ${errText}`);
            }

            const { token } = await submitRes.json();
            if (!token) return this._error('SE', 'No se recibió token de Judge0.');

            // 2. Polling hasta que el resultado no sea 1 (Queue) o 2 (Processing)
            return await this._poll(token, expectedOut);

        } catch (err) {
            // Judge0 public API puede estar caída o hay CORS en local
            return this._error('SE', `Error de red al conectar con Judge0: ${err.message}`);
        }
    },

    /**
     * Polling de Judge0 con backoff exponencial (máx. 15 intentos = ~30 segundos)
     */
    async _poll(token, expectedOut) {
        const MAX_ATTEMPTS = 15;
        let delay = 800; // ms

        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            await new Promise(r => setTimeout(r, delay));
            delay = Math.min(delay * 1.3, 3000);

            const res = await fetch(
                `${JUDGE0_BASE}/submissions/${token}?base64_encoded=false&fields=status,stdout,stderr,compile_output,time,memory,message`
            );
            if (!res.ok) continue;

            const data = await res.json();
            const statusId = data.status?.id;

            // Sigue procesando
            if (statusId === 1 || statusId === 2) continue;

            // Resultado final
            const veredicto = JUDGE0_STATUS[statusId] || 'SE';
            const stdout = (data.stdout || '').trim();
            const stderr = (data.stderr || '').trim();
            const compileOut = (data.compile_output || '').trim();
            const tiempo_ms = Math.round((parseFloat(data.time) || 0) * 1000);
            const memoria_kb = data.memory || 0;

            // Si Judge0 no comparó (no había expected_output), comparar manualmente
            let verdFinal = veredicto;
            if (veredicto === 'AC' && expectedOut) {
                const match = stdout === expectedOut.trim();
                verdFinal = match ? 'AC' : 'WA';
            }

            // Salida visible para el alumno
            const displayOutput = compileOut || stdout || stderr || data.message || '(sin salida)';

            let mensaje = '';
            if (verdFinal === 'AC') mensaje = '✅ ¡Respuesta Correcta!';
            if (verdFinal === 'WA') mensaje = '❌ Respuesta Incorrecta';
            if (verdFinal === 'TLE') mensaje = '⏱️ Tiempo Límite Excedido';
            if (verdFinal === 'MLE') mensaje = '🧠 Memoria Límite Excedida';
            if (verdFinal === 'CE') mensaje = '🔧 Error de Compilación';
            if (verdFinal === 'RE') mensaje = '💥 Error de Ejecución';
            if (verdFinal === 'SE') mensaje = '⚠️ Error del servidor de evaluación';

            return {
                veredicto: verdFinal,
                tiempo_ms,
                memoria_kb,
                output: displayOutput,
                raw_stdout: stdout,
                error: stderr || compileOut,
                mensaje
            };
        }

        return this._error('TLE', 'Tiempo de espera agotado. El servidor de evaluación tardó demasiado.');
    },

    /**
     * Modo "Probar" — Ejecuta contra la entrada de un ejemplo sin guardar submission.
     */
    async run(sourceCode, lang, ejemplo) {
        const stdin = ejemplo?.entrada || ejemplo?.input || '';
        const expected = (ejemplo?.salida_esperada || ejemplo?.output || ejemplo?.expected || '').trim();
        const result = await this.evaluate(sourceCode, lang, stdin, expected);
        return {
            output: result.output,
            ok: result.veredicto === 'AC',
            ...result
        };
    },

    _error(veredicto, mensaje) {
        return { veredicto, tiempo_ms: 0, memoria_kb: 0, output: mensaje, error: mensaje, mensaje };
    }
};

// ── Exportar también el mapa de lenguajes para el selector de la Arena ────
export const JUDGE0_LANGUAGES = [
    { id: 'cpp', label: 'C++ 17', langId: 54 },
    { id: 'java', label: 'Java 17', langId: 62 },
    { id: 'python', label: 'Python 3.8', langId: 71 },
];
