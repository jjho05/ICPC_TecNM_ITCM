// ══════════════════════════════════════════════════════
//  JudgeSim — Evaluador simulado de código
//  No ejecuta código real, simula veredictos con heurísticas
// ══════════════════════════════════════════════════════

export const JudgeSim = {

    /**
     * Evalúa un envío y retorna un veredicto simulado.
     * @param {string} code     - Código fuente del alumno
     * @param {string} lang     - 'cpp' | 'java' | 'python'
     * @param {object} problema - Objeto del problema con testcases y ejemplos
     * @returns {{ veredicto, tiempo_ms, output, mensaje }}
     */
    evaluate(code, lang, problema) {
        const startTime = performance.now();

        // CE — Código vacío o demasiado corto
        if (!code || code.trim().length < 5) {
            return this._result('CE', 0, '', 'Código fuente vacío o incompleto.');
        }

        // CE — Detectar errores de sintaxis evidentes por lenguaje
        if (lang === 'cpp' && !code.includes('main')) {
            return this._result('CE', 0, '', 'No se encontró función main.');
        }
        if (lang === 'java' && !code.includes('class')) {
            return this._result('CE', 0, '', 'No se encontró definición de clase.');
        }
        if (lang === 'python' && code.includes('def main') === false && code.trim().length < 10) {
            return this._result('CE', 0, '', 'Código Python parece incompleto.');
        }

        // TLE — Loops infinitos evidentes
        const tlePatterns = [/while\s*\(\s*true\s*\)/i, /while\s*\(\s*1\s*\)/, /for\s*\(\s*;\s*;\s*\)/];
        if (tlePatterns.some(p => p.test(code))) {
            return this._result('TLE', 2001, '', 'Límite de tiempo excedido (loop infinito detectado).');
        }

        // Simular tiempo de ejecución (entre 20ms y 1800ms)
        const tiempo_ms = Math.floor(Math.random() * 400) + 20;

        // Evaluar contra casos de prueba del problema
        const testcases = problema.testcases?.length
            ? problema.testcases
            : problema.ejemplos || [];

        if (testcases.length === 0) {
            // Sin casos de prueba → AC por defecto si el código no está vacío
            return this._result('AC', tiempo_ms, '(sin salida real)', '');
        }

        // Simular salida para el primer caso de prueba
        const primerCaso = testcases[0];
        const simulatedOutput = this._simulateOutput(code, lang, primerCaso.input, primerCaso.expected || primerCaso.output);

        const elapsed = performance.now() - startTime;
        const correct = this._compareOutput(simulatedOutput, primerCaso.expected || primerCaso.output);

        // RE — Error de runtime simulado (10% de probabilidad si no está vacío)
        if (!correct && Math.random() < 0.08) {
            return this._result('RE', tiempo_ms, simulatedOutput, 'Runtime Error: excepción en tiempo de ejecución.');
        }

        return this._result(
            correct ? 'AC' : 'WA',
            tiempo_ms,
            simulatedOutput,
            correct ? '¡Respuesta correcta!' : 'Respuesta incorrecta.'
        );
    },

    /**
     * "Probar" — Ejecuta contra el ejemplo visible (modo práctica)
     * Solo verifica el primer ejemplo. No guarda submission.
     */
    run(code, lang, ejemplo) {
        if (!code || code.trim().length < 5) {
            return { output: '-- Error de compilación: código vacío --', ok: false };
        }
        const simulated = this._simulateOutput(code, lang, ejemplo.input, ejemplo.output);
        const ok = this._compareOutput(simulated, ejemplo.output);
        return { output: simulated, ok };
    },

    // ── Internos ───────────────────────────────────────

    _result(veredicto, tiempo_ms, output, mensaje) {
        return { veredicto, tiempo_ms, output, mensaje };
    },

    /**
     * Simula la salida del programa.
     * Si el código contiene literalmente el expected output, retorna AC.
     * De lo contrario genera salida "plausible" o incorrecta.
     */
    _simulateOutput(code, lang, input, expected) {
        const exp = (expected || '').trim();

        // Heurística: si el código menciona el expected output como literal → AC simulado
        if (exp && code.includes(exp)) return exp;

        // Si el código parece resolver el problema (tiene operaciones relevantes)
        const hasArith = /[+\-*\/]/.test(code);
        const hasIO = /print|cout|System\.out|printf|scanf|input/.test(code);

        if (hasIO && hasArith && exp) {
            // 60% de probabilidad de respuesta correcta si el código parece completo
            return Math.random() < 0.6 ? exp : this._mutateOutput(exp);
        }

        return exp ? this._mutateOutput(exp) : '0';
    },

    /** Muta ligeramente el expected output para simular WA */
    _mutateOutput(str) {
        const n = parseInt(str);
        if (!isNaN(n)) return String(n + (Math.random() > 0.5 ? 1 : -1));
        if (str.toLowerCase() === 'yes') return 'No';
        if (str.toLowerCase() === 'no') return 'Yes';
        return str.split('').reverse().join('');
    },

    _compareOutput(actual, expected) {
        if (!actual || !expected) return false;
        return actual.trim().toLowerCase() === expected.trim().toLowerCase();
    }
};
