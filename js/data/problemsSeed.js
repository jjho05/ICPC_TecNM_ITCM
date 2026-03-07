// ══════════════════════════════════════════════════════
//  problemsSeed.js — 30 Problemas Clásicos de ICPC/CP
//  Fuente: adaptados de problemas del dominio público
//  Usados en: Área de Práctica + fallback offline del Admin
// ══════════════════════════════════════════════════════

export const PROBLEMS_SEED = [
    {
        id: "local_001", titulo: "A + B Problem", dificultad: 800,
        tags: ["math", "implementation"], fuente: "local",
        desc: `<h3>A + B Problem</h3>
<p>Dados dos enteros A y B, imprime su suma.</p>
<h4>Entrada</h4><p>Una línea con dos enteros A y B (−10⁹ ≤ A, B ≤ 10⁹).</p>
<h4>Salida</h4><p>Un entero: A + B.</p>`,
        ejemplos: [{ input: "3 5", output: "8" }, { input: "-2 7", output: "5" }],
        testcases: [{ input: "3 5", expected: "8" }, { input: "0 0", expected: "0" }, { input: "-1000000000 1000000000", expected: "0" }]
    },
    {
        id: "local_002", titulo: "FizzBuzz", dificultad: 800,
        tags: ["math", "implementation"], fuente: "local",
        desc: `<h3>FizzBuzz</h3>
<p>Dado un entero N, imprime los números del 1 al N. Para múltiplos de 3 imprime "Fizz", de 5 imprime "Buzz", de ambos imprime "FizzBuzz".</p>
<h4>Entrada</h4><p>Un entero N (1 ≤ N ≤ 100).</p>
<h4>Salida</h4><p>N líneas.</p>`,
        ejemplos: [{ input: "5", output: "1\n2\nFizz\n4\nBuzz" }],
        testcases: [{ input: "5", expected: "1\n2\nFizz\n4\nBuzz" }, { input: "15", expected: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz" }]
    },
    {
        id: "local_003", titulo: "Número Primo", dificultad: 900,
        tags: ["math", "number theory"], fuente: "local",
        desc: `<h3>Número Primo</h3>
<p>Dado un entero N, determina si es primo. Imprime "YES" o "NO".</p>
<h4>Entrada</h4><p>Un entero N (2 ≤ N ≤ 10⁶).</p>`,
        ejemplos: [{ input: "7", output: "YES" }, { input: "4", output: "NO" }],
        testcases: [{ input: "7", expected: "YES" }, { input: "4", expected: "NO" }, { input: "999983", expected: "YES" }]
    },
    {
        id: "local_004", titulo: "Fibonacci", dificultad: 900,
        tags: ["math", "dp"], fuente: "local",
        desc: `<h3>Fibonacci</h3>
<p>Dado N, imprime el N-ésimo número de Fibonacci (F(1)=1, F(2)=1).</p>
<h4>Entrada</h4><p>Un entero N (1 ≤ N ≤ 40).</p>`,
        ejemplos: [{ input: "6", output: "8" }, { input: "10", output: "55" }],
        testcases: [{ input: "1", expected: "1" }, { input: "6", expected: "8" }, { input: "40", expected: "102334155" }]
    },
    {
        id: "local_005", titulo: "Palíndromo", dificultad: 900,
        tags: ["strings"], fuente: "local",
        desc: `<h3>Palíndromo</h3>
<p>Determina si una cadena es palíndromo. Imprime "YES" o "NO".</p>
<h4>Entrada</h4><p>Una cadena S (1 ≤ |S| ≤ 100, solo minúsculas).</p>`,
        ejemplos: [{ input: "racecar", output: "YES" }, { input: "hello", output: "NO" }],
        testcases: [{ input: "racecar", expected: "YES" }, { input: "hello", expected: "NO" }, { input: "a", expected: "YES" }]
    },
    {
        id: "local_006", titulo: "Suma de Dígitos", dificultad: 900,
        tags: ["math", "implementation"], fuente: "local",
        desc: `<h3>Suma de Dígitos</h3>
<p>Dado un entero N, calcula la suma de sus dígitos.</p>
<h4>Entrada</h4><p>Un entero N (1 ≤ N ≤ 10¹⁸).</p>`,
        ejemplos: [{ input: "1234", output: "10" }, { input: "9999", output: "36" }],
        testcases: [{ input: "1234", expected: "10" }, { input: "0", expected: "0" }, { input: "9999999999", expected: "90" }]
    },
    {
        id: "local_007", titulo: "Mayor de Tres", dificultad: 800,
        tags: ["implementation"], fuente: "local",
        desc: `<h3>Mayor de Tres</h3>
<p>Dados tres enteros, imprime el mayor.</p>
<h4>Entrada</h4><p>Tres enteros A, B, C (−10⁹ ≤ A, B, C ≤ 10⁹).</p>`,
        ejemplos: [{ input: "3 7 2", output: "7" }],
        testcases: [{ input: "3 7 2", expected: "7" }, { input: "-5 -3 -10", expected: "-3" }]
    },
    {
        id: "local_008", titulo: "Anagrama", dificultad: 1000,
        tags: ["strings", "sorting"], fuente: "local",
        desc: `<h3>Anagrama</h3>
<p>Dadas dos cadenas, determina si son anagramas. Imprime "YES" o "NO".</p>
<h4>Entrada</h4><p>Dos cadenas en líneas separadas (solo minúsculas, longitud ≤ 100).</p>`,
        ejemplos: [{ input: "listen\nsilent", output: "YES" }, { input: "hello\nworld", output: "NO" }],
        testcases: [{ input: "listen\nsilent", expected: "YES" }, { input: "hello\nworld", expected: "NO" }]
    },
    {
        id: "local_009", titulo: "BFS — Distancia Mínima", dificultad: 1400,
        tags: ["graphs", "bfs", "shortest paths"], fuente: "local",
        desc: `<h3>BFS — Distancia Mínima</h3>
<p>Dado un grafo no dirigido con N nodos y M aristas, calcula la distancia mínima del nodo 1 al nodo N. Si no existe camino imprime -1.</p>
<h4>Entrada</h4><p>Primera línea: N M. Siguientes M líneas: u v (arista entre u y v).</p>`,
        ejemplos: [{ input: "4 4\n1 2\n2 3\n3 4\n1 4", output: "1" }],
        testcases: [{ input: "4 4\n1 2\n2 3\n3 4\n1 4", expected: "1" }, { input: "3 1\n1 2", expected: "-1" }]
    },
    {
        id: "local_010", titulo: "Inversiones", dificultad: 1500,
        tags: ["dp", "sorting"], fuente: "local",
        desc: `<h3>Inversiones</h3>
<p>Dado un arreglo de N enteros, cuenta el número de inversiones (pares (i,j) donde i < j pero A[i] > A[j]).</p>
<h4>Entrada</h4><p>Primera línea: N. Segunda línea: N enteros.</p>`,
        ejemplos: [{ input: "5\n2 4 1 3 5", output: "3" }],
        testcases: [{ input: "5\n2 4 1 3 5", expected: "3" }, { input: "3\n1 2 3", expected: "0" }]
    },
    {
        id: "local_011", titulo: "Torres de Hanói", dificultad: 1100,
        tags: ["recursion", "math"], fuente: "local",
        desc: `<h3>Torres de Hanói</h3>
<p>Dado N discos, calcula el mínimo número de movimientos para resolver las Torres de Hanói.</p>
<h4>Entrada</h4><p>Un entero N (1 ≤ N ≤ 30).</p>`,
        ejemplos: [{ input: "3", output: "7" }, { input: "1", output: "1" }],
        testcases: [{ input: "3", expected: "7" }, { input: "10", expected: "1023" }]
    },
    {
        id: "local_012", titulo: "MCD y MCM", dificultad: 1000,
        tags: ["math", "number theory"], fuente: "local",
        desc: `<h3>MCD y MCM</h3>
<p>Dados dos enteros A y B, imprime su Máximo Común Divisor y Mínimo Común Múltiplo.</p>
<h4>Entrada</h4><p>Dos enteros A y B (1 ≤ A, B ≤ 10⁹).</p>`,
        ejemplos: [{ input: "12 8", output: "4 24" }],
        testcases: [{ input: "12 8", expected: "4 24" }, { input: "7 13", expected: "1 91" }]
    },
    {
        id: "local_013", titulo: "Ordenamiento de Burbuja — Conteo", dificultad: 1200,
        tags: ["sorting", "implementation"], fuente: "local",
        desc: `<h3>Conteo de Intercambios en Burbuja</h3>
<p>Dado un arreglo de N enteros, calcula cuántos intercambios realiza el algoritmo Bubble Sort.</p>
<h4>Entrada</h4><p>Primera línea: N. Segunda línea: N enteros.</p>`,
        ejemplos: [{ input: "4\n4 3 2 1", output: "6" }],
        testcases: [{ input: "4\n4 3 2 1", expected: "6" }, { input: "3\n1 2 3", expected: "0" }]
    },
    {
        id: "local_014", titulo: "Suma de Subconjuntos", dificultad: 1300,
        tags: ["dp", "combinatorics"], fuente: "local",
        desc: `<h3>Suma de Subconjuntos</h3>
<p>Dado un conjunto de N enteros y un objetivo S, determina si existe un subconjunto cuya suma sea S. Imprime "YES" o "NO".</p>
<h4>Entrada</h4><p>Primera línea: N S. Segunda línea: N enteros.</p>`,
        ejemplos: [{ input: "4 9\n1 3 5 7", output: "YES" }],
        testcases: [{ input: "4 9\n1 3 5 7", expected: "YES" }, { input: "3 10\n1 2 4", expected: "NO" }]
    },
    {
        id: "local_015", titulo: "Árbol de Expansión Mínima", dificultad: 1600,
        tags: ["graphs", "greedy", "mst"], fuente: "local",
        desc: `<h3>Árbol de Expansión Mínima</h3>
<p>Dado un grafo ponderado, calcula el peso del Árbol de Expansión Mínima (Kruskal/Prim).</p>
<h4>Entrada</h4><p>Primera línea: N M. Siguientes M líneas: u v w (arista con peso w).</p>`,
        ejemplos: [{ input: "4 5\n1 2 1\n1 3 2\n2 3 3\n2 4 4\n3 4 1", output: "4" }],
        testcases: [{ input: "4 5\n1 2 1\n1 3 2\n2 3 3\n2 4 4\n3 4 1", expected: "4" }]
    },
    {
        id: "local_016", titulo: "Potencia Rápida", dificultad: 1100,
        tags: ["math", "implementation"], fuente: "local",
        desc: `<h3>Potencia Rápida (mod 10⁹+7)</h3>
<p>Calcula (A^B) mod (10⁹+7).</p>
<h4>Entrada</h4><p>Dos enteros A y B (0 ≤ A ≤ 10⁹, 0 ≤ B ≤ 10¹⁸).</p>`,
        ejemplos: [{ input: "2 10", output: "1024" }, { input: "3 3", output: "27" }],
        testcases: [{ input: "2 10", expected: "1024" }, { input: "2 30", expected: "1073741824" }]
    },
    {
        id: "local_017", titulo: "Camino más Corto (Dijkstra)", dificultad: 1700,
        tags: ["graphs", "shortest paths", "dijkstra"], fuente: "local",
        desc: `<h3>Dijkstra — Camino más Corto</h3>
<p>Grafo dirigido ponderado. Calcula la distancia mínima del nodo 1 a todos los demás. Imprime N valores (0 si es el origen, INF si no hay camino).</p>
<h4>Entrada</h4><p>Primera línea: N M. Siguientes M líneas: u v w.</p>`,
        ejemplos: [{ input: "3 3\n1 2 4\n1 3 1\n3 2 2", output: "0 3 1" }],
        testcases: [{ input: "3 3\n1 2 4\n1 3 1\n3 2 2", expected: "0 3 1" }]
    },
    {
        id: "local_018", titulo: "LCS — Subsecuencia Común más Larga", dificultad: 1500,
        tags: ["dp", "strings"], fuente: "local",
        desc: `<h3>LCS</h3>
<p>Dadas dos cadenas A y B, calcula la longitud de su Subsecuencia Común más Larga.</p>
<h4>Entrada</h4><p>Dos líneas, una por cadena (solo letras minúsculas, longitud ≤ 1000).</p>`,
        ejemplos: [{ input: "abcde\nace", output: "3" }],
        testcases: [{ input: "abcde\nace", expected: "3" }, { input: "abc\ndef", expected: "0" }]
    },
    {
        id: "local_019", titulo: "Problema de la Mochila (0/1 Knapsack)", dificultad: 1600,
        tags: ["dp", "greedy"], fuente: "local",
        desc: `<h3>0/1 Knapsack</h3>
<p>Dados N objetos con peso w[i] y valor v[i], y una mochila de capacidad W, maximiza el valor total.</p>
<h4>Entrada</h4><p>Primera línea: N W. Siguientes N líneas: w[i] v[i].</p>`,
        ejemplos: [{ input: "3 4\n1 1\n3 4\n4 5", output: "5" }],
        testcases: [{ input: "3 4\n1 1\n3 4\n4 5", expected: "5" }]
    },
    {
        id: "local_020", titulo: "Parentheses Matching", dificultad: 1200,
        tags: ["strings", "stack", "implementation"], fuente: "local",
        desc: `<h3>Parentheses Matching</h3>
<p>Dada una cadena con paréntesis, corchetes y llaves, determina si está correctamente balanceada. Imprime "YES" o "NO".</p>`,
        ejemplos: [{ input: "({[]})", output: "YES" }, { input: "([)]", output: "NO" }],
        testcases: [{ input: "({[]})", expected: "YES" }, { input: "([)]", expected: "NO" }, { input: "", expected: "YES" }]
    },
    {
        id: "local_021", titulo: "Número de Armstrong", dificultad: 800,
        tags: ["math", "implementation"], fuente: "local",
        desc: `<h3>Número de Armstrong</h3>
<p>Determina si N es un número de Armstrong (suma de sus dígitos elevados a la potencia de la cantidad de dígitos = N). Imprime "YES" o "NO".</p>`,
        ejemplos: [{ input: "153", output: "YES" }, { input: "100", output: "NO" }],
        testcases: [{ input: "153", expected: "YES" }, { input: "370", expected: "YES" }, { input: "100", expected: "NO" }]
    },
    {
        id: "local_022", titulo: "Componentes Conexas", dificultad: 1400,
        tags: ["graphs", "dfs", "union find"], fuente: "local",
        desc: `<h3>Componentes Conexas</h3>
<p>Dado un grafo no dirigido, cuenta el número de componentes conexas.</p>
<h4>Entrada</h4><p>Primera línea: N M. Siguientes M líneas: u v.</p>`,
        ejemplos: [{ input: "5 3\n1 2\n3 4\n4 5", output: "2" }],
        testcases: [{ input: "5 3\n1 2\n3 4\n4 5", expected: "2" }, { input: "3 0", expected: "3" }]
    },
    {
        id: "local_023", titulo: "Búsqueda Binaria", dificultad: 1100,
        tags: ["binary search", "implementation"], fuente: "local",
        desc: `<h3>Búsqueda Binaria</h3>
<p>Dado un arreglo ordenado de N enteros y un valor X, encuentra la posición de X (indexado en 1) o imprime -1 si no existe.</p>`,
        ejemplos: [{ input: "5 3\n1 3 5 7 9", output: "2" }],
        testcases: [{ input: "5 3\n1 3 5 7 9", expected: "2" }, { input: "3 4\n1 2 3", expected: "-1" }]
    },
    {
        id: "local_024", titulo: "Ciclo de Euler", dificultad: 1800,
        tags: ["graphs", "euler path"], fuente: "local",
        desc: `<h3>Ciclo de Euler</h3>
<p>Dado un grafo no dirigido, determina si contiene un Ciclo de Euler. Imprime "YES" o "NO".</p>
<p>Un grafo tiene ciclo de Euler si es conexo y todos sus nodos tienen grado par.</p>`,
        ejemplos: [{ input: "3 3\n1 2\n2 3\n3 1", output: "YES" }],
        testcases: [{ input: "3 3\n1 2\n2 3\n3 1", expected: "YES" }, { input: "4 3\n1 2\n2 3\n3 4", expected: "NO" }]
    },
    {
        id: "local_025", titulo: "Conteo de Bits", dificultad: 900,
        tags: ["math", "bit manipulation"], fuente: "local",
        desc: `<h3>Conteo de Bits (Popcount)</h3>
<p>Dado un entero N, imprime cuántos bits en 1 tiene su representación binaria.</p>`,
        ejemplos: [{ input: "7", output: "3" }, { input: "8", output: "1" }],
        testcases: [{ input: "7", expected: "3" }, { input: "255", expected: "8" }, { input: "0", expected: "0" }]
    },
    {
        id: "local_026", titulo: "Triángulo de Pascal", dificultad: 1000,
        tags: ["math", "combinatorics"], fuente: "local",
        desc: `<h3>Triángulo de Pascal</h3>
<p>Imprime las primeras N filas del Triángulo de Pascal. Cada fila en una línea, números separados por espacio.</p>`,
        ejemplos: [{ input: "4", output: "1\n1 1\n1 2 1\n1 3 3 1" }],
        testcases: [{ input: "4", expected: "1\n1 1\n1 2 1\n1 3 3 1" }]
    },
    {
        id: "local_027", titulo: "Número de Catalan", dificultad: 1300,
        tags: ["math", "dp", "combinatorics"], fuente: "local",
        desc: `<h3>Número de Catalan</h3>
<p>Dado N, calcula el N-ésimo número de Catalan mod 10⁹+7. C(0)=1, C(1)=1, C(n)=Σ C(i)*C(n-1-i).</p>`,
        ejemplos: [{ input: "5", output: "42" }],
        testcases: [{ input: "0", expected: "1" }, { input: "5", expected: "42" }, { input: "10", expected: "16796" }]
    },
    {
        id: "local_028", titulo: "Subcadena Más Larga sin Repetición", dificultad: 1400,
        tags: ["strings", "sliding window", "two pointers"], fuente: "local",
        desc: `<h3>Subcadena Más Larga sin Repetición</h3>
<p>Dada una cadena S, encuentra la longitud de la subcadena más larga sin caracteres repetidos.</p>`,
        ejemplos: [{ input: "abcabcbb", output: "3" }, { input: "bbbbb", output: "1" }],
        testcases: [{ input: "abcabcbb", expected: "3" }, { input: "pwwkew", expected: "3" }, { input: "bbbbb", expected: "1" }]
    },
    {
        id: "local_029", titulo: "Máximo Subarreglo (Kadane)", dificultad: 1200,
        tags: ["dp", "implementation"], fuente: "local",
        desc: `<h3>Máximo Subarreglo (Kadane's Algorithm)</h3>
<p>Dado un arreglo de N enteros, encuentra la suma máxima de un subarreglo contiguo.</p>`,
        ejemplos: [{ input: "8\n-2 1 -3 4 -1 2 1 -5 4", output: "6" }],
        testcases: [{ input: "8\n-2 1 -3 4 -1 2 1 -5 4", expected: "6" }, { input: "1\n-1", expected: "-1" }]
    },
    {
        id: "local_030", titulo: "Ordenación Topológica", dificultad: 1700,
        tags: ["graphs", "topological sort", "dfs"], fuente: "local",
        desc: `<h3>Ordenación Topológica</h3>
<p>Dado un DAG (Grafo Dirigido Acíclico) con N nodos y M aristas, imprime uno de sus ordenamientos topológicos válidos (nodos separados por espacio).</p>`,
        ejemplos: [{ input: "4 4\n1 2\n1 3\n2 4\n3 4", output: "1 2 3 4" }],
        testcases: [{ input: "4 4\n1 2\n1 3\n2 4\n3 4", expected: "1 2 3 4" }]
    }
];
