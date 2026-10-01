// Desarrollado por Marcos Alonso Álvarez

let CANTIDAD_BOMBAS = 10
let TAMANYO_TABLERO = 10
let casillasDescubiertas = 0
let partida_terminada = false
let bombasGeneradas = false

/**
 * Array tridimensional que sirve para manejar el tablero de forma oculta e interna mediante el javascript
 * 
 * La primera dimensión (arrayTablero[0][6][7] por ejemplo) maneja la visibilidad de las casillas, de ello
 * depende si se muestran ocultas (0), con bandera (1), o ya destapadas (2)
 * 
 * La segunda dimensión contiene el número de cada casilla que representa la cantidad de bombas adyacentes
 * a la casilla en cuestión, pudiendo ir desde 0 si no hay bombas adyacentes hasta un teórico 8. La única 
 * excepción es el número 9 que representa la bomba en si
 */
let arrayTablero = Array.from({ length: 2 }, () =>
    Array.from({ length: TAMANYO_TABLERO }, () =>
        Array(TAMANYO_TABLERO).fill(0)
    )
)

let casillasHtml = Array.from(
    { length: TAMANYO_TABLERO },
    () => Array(TAMANYO_TABLERO)
)

/**
 * Caché con los vecinos válidos de cada casilla
 * Se calcula una única vez al arrancar, ya que las posiciones relativas
 * de los vecinos nunca cambian mientras el tamaño del tablero sea fijo
 */
let vecinosCache = null

document.addEventListener("DOMContentLoaded", () => {

    precalcularVecinos()

    const tableroHtml = document.getElementById("tablero")

    for (let fila = 0; fila < arrayTablero[0].length; fila++) {
        for (let columna = 0; columna < arrayTablero[0][0].length; columna++) {

            const casilla = document.createElement("button")
            casilla.className = "casilla"

            casilla.addEventListener("mousedown", (event) => {

                pulsarCasilla(fila, columna, event)
            })

            casilla.addEventListener("contextmenu", (event) => {
                event.preventDefault()
            })

            casillasHtml[fila][columna] = casilla

            tableroHtml.appendChild(casilla)
        }
    }

    document.getElementById("btnReiniciar").addEventListener("mousedown", () => {
        reiniciarPartida()

    })
})

const reiniciarPartida = () => {

    casillasDescubiertas = 0
    partida_terminada = false
    bombasGeneradas = false

    arrayTablero = Array.from({ length: 2 }, () =>
        Array.from({ length: TAMANYO_TABLERO }, () =>
            Array(TAMANYO_TABLERO).fill(0)
        )
    )

    for (let y = 0; y < TAMANYO_TABLERO; y++) {
        for (let x = 0; x < TAMANYO_TABLERO; x++) {

            const casilla = casillasHtml[y][x]

            casilla.textContent = ""

            casilla.className = "casilla"
        }
    }

    document.getElementById("mensaje").textContent = ""
}


/**
 * Calcula y guarda en caché los vecinos de cada casilla del tablero
 */
const precalcularVecinos = () => {
    vecinosCache = Array.from({ length: TAMANYO_TABLERO }, () =>
        Array(TAMANYO_TABLERO)
    )

    for (let y = 0; y < TAMANYO_TABLERO; y++) {
        for (let x = 0; x < TAMANYO_TABLERO; x++) {

            const vecinos = []

            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {

                    if (dx === 0 && dy === 0) {
                        continue
                    }

                    const nuevaX = x + dx
                    const nuevaY = y + dy

                    if (
                        nuevaX >= 0 && nuevaX < TAMANYO_TABLERO &&
                        nuevaY >= 0 && nuevaY < TAMANYO_TABLERO
                    ) {
                        vecinos.push([nuevaY, nuevaX])
                    }
                }
            }

            vecinosCache[y][x] = vecinos
        }
    }
}

/**
 * Devuelve los vecinos válidos de una casilla
 */
const obtenerVecinos = (y, x) => vecinosCache[y][x]

const pulsarCasilla = (y, x, event) => {
    if (!partida_terminada) {
        if (event.button === 0) {
            pulsadaDescubrir(y, x);
        } else if (event.button === 2) {
            pulsadaBandera(y, x);
        }
    }
}

const pulsadaBandera = (y, x) => {

    const casilla = casillasHtml[y][x]
    const contenido = arrayTablero[0][y][x]

    if (contenido == 0) {
        arrayTablero[0][y][x] = 1
        casilla.textContent = "🚩"
        casilla.classList.add(`bandera`)
    }

    if (contenido == 1) {
        arrayTablero[0][y][x] = 0
        casilla.textContent = ""
        casilla.classList = ""
        casilla.classList.add(`casilla`)
    }
}

/**
 * Descubre una casilla y, si procede, expande en cascada las casillas
 * vecinas sin contenido (valor 0)
 */
const pulsadaDescubrir = (yInicial, xInicial) => {

    const mensaje = document.getElementById("mensaje")

    // Fuera del tablero
    if (
        xInicial < 0 || xInicial >= TAMANYO_TABLERO ||
        yInicial < 0 || yInicial >= TAMANYO_TABLERO
    ) {
        return
    }

    // Si ya estaba descubierta, se valora un posible descubrimiento de casillas adyacentes
    if (arrayTablero[0][yInicial][xInicial] === 2) {
        descubrirVecinos(yInicial, xInicial)
        return
    }

    // En el primer descubrimiento real se generan las bombas, evitando esta casilla y sus vecinas
    if (!bombasGeneradas && arrayTablero[0][yInicial][xInicial] === 0) {
        rellenarTablero(yInicial, xInicial)
        bombasGeneradas = true
    }

    const pila = [[yInicial, xInicial]]

    while (pila.length > 0) {

        const [y, x] = pila.pop()

        if (arrayTablero[0][y][x] !== 0) {
            continue
        }

        arrayTablero[0][y][x] = 2
        casillasDescubiertas++

        const casilla = casillasHtml[y][x]
        const contenido = arrayTablero[1][y][x]

        casilla.classList.add("vista")

        if (contenido === 9) {
            casilla.textContent = "💣"
            casilla.classList.add("bomba")

            mensaje.textContent = "Has perdido"
            destaparTableroAlPerder(y, x)
            partida_terminada = true
            return
        }

        if (contenido > 0) {
            casilla.textContent = contenido
            casilla.classList.add(`numero-${contenido}`)
            continue
        }

        // Si es 0, encolar vecinos ocultos para seguir expandiendo
        for (const [ny, nx] of obtenerVecinos(y, x)) {
            if (arrayTablero[0][ny][nx] === 0) {
                pila.push([ny, nx])
            }
        }
    }

    if (comprobarVictoria()) {
        mensaje.textContent = "Has ganado"
        partida_terminada = true
    }
}

/**
 * Al pulsar una casilla ya descubierta, comprueba si el número de banderas
 * a su alrededor coincide con su valor y, en tal caso, destapa el resto
 * de vecinos ocultos
 */
const descubrirVecinos = (y, x) => {

    const contenido = arrayTablero[1][y][x]
    const vecinos = obtenerVecinos(y, x)

    const banderas = vecinos.reduce(
        (total, [ny, nx]) => total + (arrayTablero[0][ny][nx] === 1 ? 1 : 0),
        0
    )

    if (banderas !== contenido) {
        return
    }

    for (const [ny, nx] of vecinos) {
        if (arrayTablero[0][ny][nx] === 0) {
            pulsadaDescubrir(ny, nx)
        }
    }
}

const comprobarVictoria = () => {
    const casillasSinBombas =
        TAMANYO_TABLERO * TAMANYO_TABLERO - CANTIDAD_BOMBAS

    return casillasDescubiertas === casillasSinBombas
}

const destaparTableroAlPerder = (yPerdedora, xPerdedora) => {

    for (let y = 0; y < TAMANYO_TABLERO; y++) {
        for (let x = 0; x < TAMANYO_TABLERO; x++) {

            const casilla = casillasHtml[y][x]
            const estado = arrayTablero[0][y][x]
            const contenido = arrayTablero[1][y][x]

            casilla.classList.remove(
                "bomba-revelada",
                "bomba-perdedora",
                "bomba-bandera",
                "bandera-incorrecta"
            )

            casilla.classList.add("vista")

            if (estado === 1) {

                casilla.textContent = "🚩"

                if (contenido === 9) {
                    casilla.classList.add("bomba-bandera")
                } else {
                    casilla.classList.add("bandera-incorrecta")
                }

                continue
            }

            if (contenido === 9) {

                casilla.textContent = "💣"

                if (y === yPerdedora && x === xPerdedora) {
                    casilla.classList.add("bomba-perdedora")
                } else {
                    casilla.classList.add("bomba-revelada")
                }

                continue
            }

            if (contenido === 0) {
                casilla.textContent = ""
            } else {
                casilla.textContent = contenido
                casilla.classList.add(`numero-${contenido}`)
            }
        }
    }
}

const rellenarTablero = (ySegura, xSegura) => {

    // Casilla pulsada y sus vecinas
    const zonaSegura = new Set(
        [[ySegura, xSegura], ...obtenerVecinos(ySegura, xSegura)]
            .map(([y, x]) => y * TAMANYO_TABLERO + x)
    )

    let casillas = conseguirCasillas()
        .filter(([y, x]) => !zonaSegura.has(y * TAMANYO_TABLERO + x))

    // Se randomizan todas las casillas disponibles
    for (let i = casillas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))

        const temporal = casillas[i]
        casillas[i] = casillas[j]
        casillas[j] = temporal
    }

    // Se ponen las bombas en las 10 primeras casillas, como están randomizadas a efectos prácticos se ponen al azar
    for (let i = 0; i < CANTIDAD_BOMBAS; i++) {
        const [y, x] = casillas[i]
        arrayTablero[1][y][x] = 9
    }

    // Calcular números adyacentes reutilizando la caché de vecinos
    for (let y = 0; y < arrayTablero[1].length; y++) {
        for (let x = 0; x < arrayTablero[1][0].length; x++) {

            if (arrayTablero[1][y][x] === 9) {
                continue
            }

            const bombas = obtenerVecinos(y, x).reduce(
                (total, [ny, nx]) => total + (arrayTablero[1][ny][nx] === 9 ? 1 : 0),
                0
            )

            arrayTablero[1][y][x] = bombas
        }
    }
}

/**
 * @returns Todas las posibles casillas del tablero
 */
const conseguirCasillas = () => {
    let casillas = []

    for (let y = 0; y < arrayTablero[0].length; y++) {
        for (let x = 0; x < arrayTablero[0][0].length; x++) {
            casillas.push([y, x])
        }
    }

    return casillas
}