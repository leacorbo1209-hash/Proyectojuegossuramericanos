// ========================================
// MODO CLARO / OSCUROO
// ========================================

const themeButton = document.getElementById("themeButton");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");

function actualizarTema() {
    const modoOscuro = document.body.classList.contains("dark");

    themeIcon.textContent = modoOscuro ? "☀️" : "🌙";
    themeText.textContent = modoOscuro
        ? "Modo claro"
        : "Modo oscuro";
}

function cambiarTema() {
    document.body.classList.toggle("dark");

    const modoOscuro =
        document.body.classList.contains("dark");

    localStorage.setItem(
        "tema",
        modoOscuro ? "oscuro" : "claro"
    );

    actualizarTema();
}

const temaGuardado = localStorage.getItem("tema");

if (temaGuardado === "oscuro") {
    document.body.classList.add("dark");
}

actualizarTema();

themeButton.addEventListener("click", cambiarTema);


// ========================================
// API
// ========================================

const API_BASE =
    "https://proyectojuegossuramericanos.leacorbo1209.workers.dev";

const CHAMP = "JSUD2026";
const LANG = "en";


// ========================================
// DATOS COMPRIMIDOS
// ========================================

async function obtenerDatos(url) {
    const respuesta = await fetch(url);

    if (!respuesta.ok) {
        throw new Error(`HTTP ${respuesta.status}`);
    }

    const textoComprimido =
        await respuesta.text();

    const bytes =
        new Uint8Array(textoComprimido.length);

    for (
        let i = 0;
        i < textoComprimido.length;
        i++
    ) {
        bytes[i] =
            textoComprimido.charCodeAt(i) & 255;
    }

    const ds =
        new DecompressionStream("deflate");

    const stream =
        new Blob([bytes])
            .stream()
            .pipeThrough(ds);

    const json =
        await new Response(stream).text();

    return JSON.parse(json);
}
//==========================
//MEDALLERO
//=========================
function obtenerMedallero() {
    const medallero = new Map();

    const nombresPaises = {
        ARG: "Argentina",
        BOL: "Bolivia",
        BRA: "Brasil",
        CHI: "Chile",
        COL: "Colombia",
        ECU: "Ecuador",
        PAN: "Panamá",
        PAR: "Paraguay",
        PER: "Perú",
        URU: "Uruguay",
        VEN: "Venezuela"
    };

    function asegurarPais(pais) {
        if (!pais) return;

        if (!medallero.has(pais)) {
            medallero.set(pais, {
                pais: pais,
                nombre: nombresPaises[pais] || pais,
                oro: 0,
                plata: 0,
                bronce: 0,
                total: 0
            });
        }
    }

    function agregarMedalla(pais, tipo) {
        if (!pais) return;

        asegurarPais(pais);

        const registro = medallero.get(pais);

        if (tipo === "oro") {
            registro.oro++;
        }

        if (tipo === "plata") {
            registro.plata++;
        }

        if (tipo === "bronce") {
            registro.bronce++;
        }

        registro.total =
            registro.oro +
            registro.plata +
            registro.bronce;
    }

    const eventosMedalla = eventosActuales.filter(evento =>
        evento &&
        evento.estado === "OFFICIAL" &&
        evento.esEnfrentamiento === true &&
        Array.isArray(evento.participantes) &&
        (
            evento.unidadNombre.includes("Gold Medal Match") ||
            evento.unidadNombre.includes("Bronze Medal Match")
        )
    );

    for (const evento of eventosMedalla) {

        const participantes = evento.participantes;

        if (participantes.length < 2) {
            continue;
        }

        const ganador =
            participantes.find(p => p.ganador === true);

        const perdedor =
            participantes.find(p => p.ganador !== true);

        if (!ganador) {
            continue;
        }

        if (
            evento.unidadNombre.includes("Gold Medal Match")
        ) {
            agregarMedalla(
                ganador.pais,
                "oro"
            );

            if (perdedor) {
                agregarMedalla(
                    perdedor.pais,
                    "plata"
                );
            }
        }

        if (
            evento.unidadNombre.includes("Bronze Medal Match")
        ) {
            agregarMedalla(
                ganador.pais,
                "bronce"
            );
        }
    }

    return Array.from(medallero.values());
}
// ========================================
// DISCIPLINAS
// ========================================

async function obtenerDisciplinas() {
    const url =
        `${API_BASE}/api/s/${CHAMP}/${LANG}/ALL/disc/list`;

    return await obtenerDatos(url);
}

const DISCIPLINAS_EQUIPO = [
    "FBL", // Football
    "HBL", // Handball
    "HOC", // Hockey
    "RU7", // Rugby Sevens
    "SBL", // Softball
    "VVO", // Volleyball
    "VBV", // Beach Volleyball
    "WPO"  // Water Polo
];

function esDisciplinaDeEquipo(codigo) {
    return DISCIPLINAS_EQUIPO.includes(codigo);
}

function esDisciplinaIndividual(codigo) {
    return !esDisciplinaDeEquipo(codigo);
}
function obtenerEventosIndividuales() {

    const todosLosEventos = [
        ...eventosActuales,
        ...eventosEnVivo
    ];

    const mapa = new Map();

    for (const evento of todosLosEventos) {

        if (!evento) continue;

        if (!esDisciplinaIndividual(evento.codigoDeporte)) {
            continue;
        }

        const clave = obtenerClaveFavorito(
            evento.codigoDeporte,
            evento.clave
        );

        if (!clave) continue;

        mapa.set(clave, {
            ...evento,
            participantes:
                Array.isArray(evento.participantes)
                    ? evento.participantes
                    : []
        });
    }

    return [...mapa.values()];
}
function renderIndividuales() {

    const contenedor =
        document.getElementById("eventosIndividuales");

    if (!contenedor) {
        console.error("❌ No existe #eventosIndividuales");
        return;
    }

    const eventos = obtenerEventosIndividuales();

    contenedor.innerHTML = "";

    const contador =
        document.getElementById("contadorIndividuales");

    if (contador) {
        contador.textContent =
            `${eventos.length} eventos individuales`;
    }

    if (eventos.length === 0) {
        contenedor.innerHTML = `
            <p class="mensaje-vacio">
                No hay eventos individuales para mostrar.
            </p>
        `;
        return;
    }

    const eventosPorDeporte = new Map();

    for (const evento of eventos) {

        const codigo = evento.codigoDeporte;

        if (!eventosPorDeporte.has(codigo)) {
            eventosPorDeporte.set(codigo, []);
        }

        eventosPorDeporte
            .get(codigo)
            .push(evento);
    }

    for (const disciplina of disciplinas) {

        const codigo = disciplina.Key;

        if (!eventosPorDeporte.has(codigo)) {
            continue;
        }

        const eventosDelDeporte =
            eventosPorDeporte.get(codigo);

        const seccion =
            document.createElement("section");

        seccion.className = "sport-section";

        seccion.innerHTML = `
            <div class="section-title">
                <span>🏃</span>
                <h2>${disciplina.Desc}</h2>
            </div>

            <div class="events-grid"></div>
        `;

        const grid =
            seccion.querySelector(".events-grid");

        for (const evento of eventosDelDeporte) {

            const tarjeta =
                crearTarjetaEventoLive(evento);

            if (tarjeta) {
                grid.appendChild(tarjeta);
            }
        }

        contenedor.appendChild(seccion);
    }

    console.log(
        `🏃 Individuales renderizados: ${eventos.length}`
    );

    console.log(
        `🏃 Deportes individuales mostrados: ${eventosPorDeporte.size}`
    );
}
function obtenerEventosEquipos() {

    const todosLosEventos = [
        ...eventosActuales,
        ...eventosEnVivo
    ];

    const mapa = new Map();

    for (const evento of todosLosEventos) {

        if (!evento) continue;

        if (!esDisciplinaDeEquipo(evento.codigoDeporte)) {
            continue;
        }

        const clave = obtenerClaveFavorito(
            evento.codigoDeporte,
            evento.clave
        );

        if (!clave) continue;

        mapa.set(clave, {
            ...evento,
            participantes:
                Array.isArray(evento.participantes)
                    ? evento.participantes
                    : []
        });
    }

    return [...mapa.values()];
}

function renderEquipos() {

    const contenedor = document.getElementById("eventosEquipos");

    if (!contenedor) {
        console.error("❌ No existe #eventosEquipos");
        return;
    }

    const eventos = obtenerEventosEquipos();

    contenedor.innerHTML = "";

    const contador = document.getElementById("contadorEquipos");

    if (contador) {
        contador.textContent =
            `${eventos.length} eventos de equipos`;
    }

    if (eventos.length === 0) {
        contenedor.innerHTML = `
            <p class="mensaje-vacio">
                No hay eventos de equipos para mostrar.
            </p>
        `;
        return;
    }

    function obtenerMedallero() {
    const medallero = new Map();

    function asegurarPais(pais, nombre) {
        if (!pais) return;

        if (!medallero.has(pais)) {
            medallero.set(pais, {
                pais: pais,
                nombre: nombre || pais,
                oro: 0,
                plata: 0,
                bronce: 0,
                total: 0
            });
        }
    }
async function obtenerMedalleroCompleto() {
    const medallero = new Map();
    const errores = [];

    function asegurarPais(pais) {
        if (!pais) return;

        if (!medallero.has(pais)) {
            medallero.set(pais, {
                pais: pais,
                oro: 0,
                plata: 0,
                bronce: 0,
                total: 0
            });
        }
    }

    function agregarMedalla(pais, tipo) {
        if (!pais) return;

        asegurarPais(pais);

        const registro = medallero.get(pais);

        if (tipo === "ME_GOLD") {
            registro.oro++;
        }

        if (tipo === "ME_SILVER") {
            registro.plata++;
        }

        if (tipo === "ME_BRONZE") {
            registro.bronce++;
        }

        registro.total =
            registro.oro +
            registro.plata +
            registro.bronce;
    }

    const eventosConResultados =
        eventosActuales.filter(evento =>
            evento &&
            evento.estado === "OFFICIAL" &&
            evento.mostrarResultados === true &&
            evento.resCode &&
            evento.codigoDeporte
        );

    console.log(
        "Eventos oficiales con resultados:",
        eventosConResultados.length
    );

    for (const evento of eventosConResultados) {

        try {

            const resultado =
                await obtenerResultadoSilencioso(
                    evento.codigoDeporte,
                    evento.resCode
                );

            const competidores =
                resultado?.Competitors || [];

            for (const competidor of competidores) {

                const medalla =
                    String(
                        competidor.Medal || ""
                    ).toUpperCase();

                if (
                    medalla === "ME_GOLD" ||
                    medalla === "ME_SILVER" ||
                    medalla === "ME_BRONZE"
                ) {
                    agregarMedalla(
                        competidor.Org,
                        medalla
                    );
                }
            }

        } catch (error) {

            errores.push({
                deporte: evento.codigoDeporte,
                evento: evento.eventoNombre,
                resCode: evento.resCode,
                error: error.message
            });

        }
    }

    const nombresPaises = {
        ARG: "Argentina",
        BOL: "Bolivia",
        BRA: "Brasil",
        CHI: "Chile",
        COL: "Colombia",
        ECU: "Ecuador",
        PAN: "Panamá",
        PAR: "Paraguay",
        PER: "Perú",
        URU: "Uruguay",
        VEN: "Venezuela"
    };

    const resultado =
        Array.from(medallero.values())
            .map(pais => ({
                ...pais,
                nombre:
                    nombresPaises[pais.pais] ||
                    pais.pais
            }))
            .sort((a, b) => {
                if (b.oro !== a.oro) {
                    return b.oro - a.oro;
                }

                if (b.plata !== a.plata) {
                    return b.plata - a.plata;
                }

                return b.bronce - a.bronce;
            });

    window.erroresMedallero = errores;

    console.log(
        "🏅 Medallero completo calculado:",
        resultado
    );

    console.log(
        "⚠️ Errores:",
        errores.length
    );

    return resultado;
}
    function agregarMedalla(pais, nombre, tipo) {
        if (!pais) return;

        asegurarPais(pais, nombre);

        const registro = medallero.get(pais);

        if (tipo === "oro") {
            registro.oro++;
        }

        if (tipo === "plata") {
            registro.plata++;
        }

        if (tipo === "bronce") {
            registro.bronce++;
        }

        registro.total =
            registro.oro +
            registro.plata +
            registro.bronce;
    }

    const eventosMedalla = eventosActuales.filter(evento =>
        evento &&
        evento.estado === "OFFICIAL" &&
        evento.esEnfrentamiento === true &&
        Array.isArray(evento.participantes) &&
        (
            evento.unidadNombre.includes("Gold Medal Match") ||
            evento.unidadNombre.includes("Bronze Medal Match")
        )
    );

    for (const evento of eventosMedalla) {

        const participantes = evento.participantes;

        if (participantes.length < 2) {
            continue;
        }

        const ganador = participantes.find(p => p.ganador === true);
        const perdedor = participantes.find(p => p.ganador !== true);

        if (!ganador) {
            continue;
        }

        if (evento.unidadNombre.includes("Gold Medal Match")) {

            // Ganador del partido por el oro
            agregarMedalla(
                ganador.pais,
                ganador.nombre,
                "oro"
            );

            // Perdedor del partido por el oro
            if (perdedor) {
                agregarMedalla(
                    perdedor.pais,
                    perdedor.nombre,
                    "plata"
                );
            }
        }

        if (evento.unidadNombre.includes("Bronze Medal Match")) {

            // Ganador del partido por el bronce
            agregarMedalla(
                ganador.pais,
                ganador.nombre,
                "bronce"
            );
        }
    }

    return Array.from(medallero.values());
}
    const medalleroPrueba = obtenerMedallero();

console.table(medalleroPrueba);
    // Agrupar eventos por disciplina
    const eventosPorDeporte = new Map();

    for (const evento of eventos) {

        const codigo = evento.codigoDeporte;

        if (!eventosPorDeporte.has(codigo)) {
            eventosPorDeporte.set(codigo, []);
        }

        eventosPorDeporte.get(codigo).push(evento);
    }

    // Recorrer las disciplinas en el orden oficial
    for (const disciplina of disciplinas) {

        const codigo = disciplina.Key;

        if (!eventosPorDeporte.has(codigo)) {
            continue;
        }

        const eventosDelDeporte =
            eventosPorDeporte.get(codigo);

        const seccion = document.createElement("section");

        seccion.className = "sport-section";

        seccion.innerHTML = `
            <div class="section-title">
                <span>🏟️</span>
                <h2>${disciplina.Desc}</h2>
            </div>

            <div class="events-grid"></div>
        `;

        const grid =
            seccion.querySelector(".events-grid");

        for (const evento of eventosDelDeporte) {

            const tarjeta =
                crearTarjetaEventoLive(evento);

            if (tarjeta) {
                grid.appendChild(tarjeta);
            }
        }

        contenedor.appendChild(seccion);
    }

    console.log(
        `🏟️ Equipos renderizados: ${eventos.length}`
    );

    console.log(
        `🏟️ Deportes de equipo mostrados: ${eventosPorDeporte.size}`
    );
}
function obtenerEventosPaises() {

    const todosLosEventos = [
        ...eventosActuales,
        ...eventosEnVivo
    ];

    const paises = new Map();

    for (const evento of todosLosEventos) {

        if (!evento) continue;

        const claveEvento =
            obtenerClaveFavorito(
                evento.codigoDeporte,
                evento.clave
            );

        if (!claveEvento) continue;

        const participantes =
            Array.isArray(evento.participantes)
                ? evento.participantes
                : [];

        for (const participante of participantes) {

            const pais = participante.pais;

            if (!pais) continue;

            if (!paises.has(pais)) {
                paises.set(pais, new Map());
            }

            paises
                .get(pais)
                .set(claveEvento, evento);
        }
    }

    const resultado = new Map();

    for (const [pais, eventos] of paises) {
        resultado.set(pais, [...eventos.values()]);
    }

    return resultado;
}
function renderPaises() {

    const contenedor =
        document.getElementById("eventosPaises");

    if (!contenedor) {
        console.error("❌ No existe #eventosPaises");
        return;
    }

    const paises = obtenerEventosPaises();

    contenedor.innerHTML = "";

    const contador =
        document.getElementById("contadorPaises");

    if (contador) {
        contador.textContent =
            `${paises.size} países`;
    }

    if (paises.size === 0) {

        contenedor.innerHTML = `
            <p class="mensaje-vacio">
                No hay eventos con países disponibles.
            </p>
        `;

        return;
    }

    /*
     * Ordenar países alfabéticamente.
     */
    const paisesOrdenados =
        [...paises.entries()]
            .sort((a, b) =>
                a[0].localeCompare(
                    b[0],
                    "es",
                    { sensitivity: "base" }
                )
            );

    for (const [pais, eventos] of paisesOrdenados) {

        const seccion =
            document.createElement("section");

        seccion.className = "sport-section";

        seccion.innerHTML = `
            <div class="section-title">
                <span>🌎</span>
                <h2>${pais}</h2>
            </div>

            <div class="events-grid"></div>
        `;

        const grid =
            seccion.querySelector(".events-grid");

        /*
         * Ordenar los eventos del país por fecha.
         */
        eventos.sort((a, b) => {

            const fechaA =
                new Date(a.fecha || 0).getTime();

            const fechaB =
                new Date(b.fecha || 0).getTime();

            return fechaA - fechaB;
        });

        for (const evento of eventos) {

            const tarjeta =
                crearTarjetaEventoLive(evento);

            if (tarjeta) {
                grid.appendChild(tarjeta);
            }
        }

        contenedor.appendChild(seccion);
    }

    console.log(
        `🌎 Países renderizados: ${paises.size}`
    );

    console.log(
        `🌎 Eventos distribuidos entre países`
    );
}
// ========================================
// VARIABLES GLOBALES
// ========================================

let disciplinas = [];
let catalogoDisciplinas = [];


// ========================================
// CONSTRUIR CATÁLOGO
// ========================================

async function cargarDisciplinas() {

    try {

        disciplinas =
            await obtenerDisciplinas();

        catalogoDisciplinas =
            disciplinas
                .map(disc => ({
                    codigo: disc.Key,
                    nombre: disc.Desc,
                    orden: disc.Order,
                    noSport: disc.NonSport,
                    eventOrder: disc.EventOrder,
                    hasRecords: disc.HasRecords,
                    hasReports: disc.HasReports
                }))
                .sort((a, b) =>
                    a.nombre.localeCompare(
                        b.nombre,
                        "es",
                        {
                            sensitivity: "base"
                        }
                    )
                );

        // Hacerlas accesibles desde la consola
        window.disciplinas =
            disciplinas;

        window.catalogoDisciplinas =
            catalogoDisciplinas;


        console.log(
            "API conectada correctamente."
        );

        console.log(
            "Cantidad de disciplinas:",
            disciplinas.length
        );

        console.log(
            "Catálogo de disciplinas:"
        );

        console.table(
            catalogoDisciplinas
        );

    } catch (error) {

        console.error(
            "Error conectando con la API:",
            error
        );

        disciplinas = [];
        catalogoDisciplinas = [];

        throw error;
    }
}

// ========================================
// ANALIZAR LAS 60 DISCIPLINAS
// ========================================

async function analizarDisciplinas() {

    const resultados = [];

    for (const disc of disciplinas) {

        try {

            const data = await obtenerDatos(
                `${API_BASE}/api/s/${CHAMP}/${LANG}/${disc.Key}/disc/data`
            );

            resultados.push({
                codigo: disc.Key,
                nombre: disc.Desc,
                eventos: data.Events?.length ?? 0,
                dias: data.Days?.length ?? 0,
                grupos: data.HasGroups ?? false,
                brackets: data.HasBracket ?? false,
                rankingFinal: data.HasFRank ?? false,
                records: data.Config?.HasRecords ?? false,
                stats: data.Config?.HasStats ?? false,
                entradas: data.Config?.HasEntries ?? false
            });

        } catch (error) {

            resultados.push({
                codigo: disc.Key,
                nombre: disc.Desc,
                error: error.message
            });
        }
    }

    window.analisisDisciplinas = resultados;

    console.log(
        "Análisis real de las 60 disciplinas:"
    );

    console.table(resultados);

    return resultados;
}

// ========================================
// EVENTOS Y UNIDADES DE LAS 60 DISCIPLINAS
// ========================================

async function analizarEventosTodasLasDisciplinas() {

    const resultados = [];

    for (const disc of disciplinas) {

        try {

            const data = await obtenerDatos(
                `${API_BASE}/api/s/${CHAMP}/${LANG}/${disc.Key}/events/phases/units`
            );

            const eventos = data || [];

            const fases = eventos.flatMap(
                evento => evento.Phases || []
            );

            const unidades = fases.flatMap(
                fase => fase.Units || []
            );

            resultados.push({
                codigo: disc.Key,
                nombre: disc.Desc,
                eventos: eventos.length,
                fases: fases.length,
                unidades: unidades.length,
                conResCode: unidades.filter(
                    u => u.ResCode
                ).length,
                conResultados: unidades.filter(
                    u => u.ShowResults === true
                ).length,
                enVivo: unidades.filter(
                    u => u.IsLive === true
                ).length
            });

        } catch (error) {

            resultados.push({
                codigo: disc.Key,
                nombre: disc.Desc,
                error: error.message
            });

        }
    }

    window.analisisEventos =
        resultados;

    console.log(
        "Análisis de eventos y unidades:"
    );

    console.table(
        resultados
    );

    return resultados;
}

// ========================================
// NORMALIZAR UNA UNIDAD
// ========================================

function normalizarUnidad(unidad) {

    const esEnfrentamiento =
        !!unidad.Home || !!unidad.Away;

    let participantes = [];

    if (esEnfrentamiento) {

        if (unidad.Home) {
            participantes.push({
                lado: "home",
                nombre: unidad.Home.Name || "",
                pais: unidad.Home.Org || "",
                resultado: unidad.Home.Result || "",
                ganador: unidad.Home.Winner === true
            });
        }

        if (unidad.Away) {
            participantes.push({
                lado: "away",
                nombre: unidad.Away.Name || "",
                pais: unidad.Away.Org || "",
                resultado: unidad.Away.Result || "",
                ganador: unidad.Away.Winner === true
            });
        }
    }

    return {

        // IDENTIFICACIÓN
        codigoDeporte: unidad.Disc || "",
        deporte: unidad.DiscDesc || "",

        clave: unidad.Key || "",
        resCode: unidad.ResCode || "",

        // EVENTO
        evento: unidad.Event || "",
        eventoNombre: unidad.EventDesc || "",

        // FASE
        fase: unidad.Phase || "",
        faseNombre: unidad.PhaseDesc || "",
        faseCorta: unidad.PhaseDescA || "",

        // UNIDAD
        unidadNombre: unidad.UnitDesc || "",
        unidadCorta: unidad.UnitDescA || "",
        unidadNumero: unidad.UnitNum || "",

        // FECHA
        fecha: unidad.DateTimeRaw || "",

        // ESTADO
        estado: unidad.Status || "",
        estadoTexto: unidad.StatusDesc || "",
        enVivo: unidad.IsLive === true,
        mostrarResultados: unidad.ShowResults === true,

        // TIPO
        esEnfrentamiento,
        tipo: esEnfrentamiento
            ? "equipo"
            : "individual",

        // PARTICIPANTES
        participantes,

        // UBICACIÓN
        sede: unidad.VenueDesc || "",
        sedeCodigo: unidad.Venue || "",
        ubicacion: unidad.LocDesc || "",
        ubicacionCodigo: unidad.Loc || "",

        // MEDALLA
        medalla: unidad.Medal || "",

        // OTROS
        estimado: unidad.Estimated === true,
        ocultarFecha: unidad.HideStartDate === true,
        ocultarUbicacion: unidad.HideLocation === true

    };
}

// ========================================
// OBTENER UNIDADES DE UNA DISCIPLINA
// ========================================

async function obtenerUnidadesDisciplina(codigo) {

    const data = await obtenerDatos(
        `${API_BASE}/api/s/${CHAMP}/${LANG}/${codigo}/events/phases/units`
    );

    return (data || [])
        .flatMap(evento => evento.Phases || [])
        .flatMap(fase => fase.Units || [])
        .map(normalizarUnidad);
}

// ========================================
// CACHE GLOBAL DE UNIDADES
// ========================================

let unidadesPorDisciplina = {};

async function cargarUnidadesDisciplina(codigo) {

    const unidades =
        await obtenerUnidadesDisciplina(codigo);

    unidadesPorDisciplina[codigo] =
        unidades;

    return unidades;
}

// ========================================
// CARGAR TODAS LAS UNIDADES
// ========================================

async function cargarTodasLasUnidades() {

    const errores = [];

    for (const disc of disciplinas) {

        try {

            const unidades =
                await cargarUnidadesDisciplina(
                    disc.Key
                );

            // Guardamos normalmente
            unidadesPorDisciplina[disc.Key] =
                unidades;

        } catch (error) {

            console.warn(
                `⚠️ No se pudo actualizar ${disc.Key}:`,
                error.message
            );

            errores.push({
                codigo: disc.Key,
                nombre: disc.Desc,
                error: error.message
            });

            /*
             * IMPORTANTE:
             *
             * Si esta disciplina ya tenía datos
             * cargados anteriormente, NO los
             * eliminamos.
             *
             * Así un fallo temporal del servidor
             * no hace desaparecer eventos.
             */

            if (
                !unidadesPorDisciplina[disc.Key]
            ) {

                unidadesPorDisciplina[disc.Key] =
                    [];

            }

        }

    }


    // ========================================
    // EXPONER DATOS
    // ========================================

    window.unidadesPorDisciplina =
        unidadesPorDisciplina;

    window.erroresCargaUnidades =
        errores;


    console.log(
        "📦 Unidades de las 60 disciplinas procesadas."
    );

    console.log(
        "Disciplinas cargadas:",
        Object.keys(
            unidadesPorDisciplina
        ).length
    );


    if (errores.length > 0) {

        console.warn(
            `⚠️ Disciplinas con errores: ${errores.length}`,
            errores
        );

    } else {

        console.log(
            "✅ Todas las disciplinas se actualizaron correctamente."
        );

    }


    return unidadesPorDisciplina;
}
// ========================================
// FÚTBOL — RESULTADOS COMPLETOS
// ========================================

async function obtenerResultado(disc, resCode) {
    const url =
        `${API_BASE}/api/s/${CHAMP}/${LANG}/${disc}/results/${resCode}`;

    console.log("RESULTADO:", url);

    return await obtenerDatos(url);
}


function normalizarEstadisticasFutbol(competitor) {
    const s = competitor.Stats || {};

    const numero = clave => {
        const valor = s[clave];

        if (valor === "" || valor == null) {
            return 0;
        }

        return Number(valor);
    };

    return {
        equipo: competitor.Name,
        pais: competitor.Org,

        remates: numero("ST_SHOTS"),
        rematesAlArco: numero("ST_SHOTS_ON_GOAL"),
        porcentajeRematesAlArco:
            numero("ST_SOG_PERCENT"),

        goles: numero("ST_GOALS"),
        corners: numero("CORNERS"),

        faltas: numero("FOULS"),
        faltasCometidas:
            numero("FOULS_COMMITED"),
        faltasRecibidas:
            numero("FOULS_SUFFERED"),

        atajadas: numero("SAVED"),

        posesion:
            numero("ST_POSSESSION_PERCENT"),

        offsides:
            numero("ST_OFFSIDES"),

        tirosLibres:
            numero("ST_FREEKICK_SHOTS"),

        asistencias:
            numero("ST_ASSIST"),

        bloqueos:
            numero("ST_BLOCKED"),

        amarillas:
            numero("ST_TOTAL_YC"),

        rojas:
            numero("ST_TOTAL_RC"),

        golesPenal:
            numero("ST_PENALTY_GOALS"),

        penalesEjecutados:
            numero("ST_PENALTY_SHOTS"),

        autogoles:
            numero("ST_OWN_GOALS")
    };
}


function obtenerGoleadoresFutbol(resultado) {
    return (resultado.Results?.Extensions || [])
        .filter(e => e.Code === "GOAL_SCORERS")
        .flatMap(e =>
            (e.Value || "")
                .split("|")
                .filter(Boolean)
                .map(gol => ({
                    equipo:
                        e.Pos === 1
                            ? resultado.Competitors[0].Name
                            : resultado.Competitors[1].Name,

                    jugador: gol
                }))
        );
}


function obtenerJugadoresFutbol(resultado) {

    function extension(jugador, codigo) {
        return jugador.Extensions?.find(
            e => e.Code === codigo
        )?.Value || "";
    }

    return resultado.Competitors.flatMap(equipo =>
        equipo.Members.map(jugador => {

            const s = jugador.Stats || {};

            const numero = clave => {
                const valor = s[clave];

                if (valor === "" || valor == null) {
                    return 0;
                }

                return Number(valor);
            };

            const segundos =
                Number(s.ST_TIME_PLAYED || 0);

            return {
                equipo: equipo.Name,
                pais: equipo.Org,

                nombre: jugador.Name,
                camiseta: jugador.Bib,
                posicion:
                    jugador.PosDesc ||
                    jugador.Position,

                titular:
                    !jugador.Substitute,

                enCampo:
                    jugador.InField,

                club:
                    extension(jugador, "Club"),

                fechaNacimiento:
                    extension(
                        jugador,
                        "DateOfBirth"
                    ),

                altura:
                    extension(
                        jugador,
                        "Height"
                    ),

                nombreCamiseta:
                    extension(
                        jugador,
                        "ShirtName"
                    ),

                goles:
                    numero("ST_GOALS"),

                asistencias:
                    numero("ST_ASSIST"),

                remates:
                    numero("ST_SHOTS"),

                rematesAlArco:
                    numero("ST_SHOTS_ON_GOAL"),

                faltas:
                    numero("FOULS"),

                faltasRecibidas:
                    numero("FOULS_SUFFERED"),

                amarillas:
                    numero("ST_TOTAL_YC"),

                rojas:
                    numero("ST_TOTAL_RC"),

                atajadas:
                    numero("SAVED"),

                tiempoJugadoSegundos:
                    segundos,

                tiempoJugadoMinutos:
                    Math.floor(segundos / 60)
            };
        })
    );
}


function obtenerSustitucionesFutbol(resultado) {

    const extension =
        resultado.Results?.Extensions?.find(
            e =>
                e.Code ===
                "SUBSTITUTIONS_BY_WINDOW"
        );

    if (!extension?.Extensions) {
        return [];
    }

    const jugadores =
        resultado.Competitors.flatMap(
            equipo =>
                equipo.Members.map(jugador => ({
                    ...jugador,
                    equipo: equipo.Name,
                    pais: equipo.Org
                }))
        );

    const buscarJugador = id =>
        jugadores.find(
            jugador => jugador.Reg === id
        );

    const sustituciones = [];

    for (const ventana of extension.Extensions) {

        const datos = {};

        for (
            const campo of
            ventana.Extensions || []
        ) {
            datos[campo.Code] = campo.Value;
        }

        const entradas =
            datos.BIB_IN?.split("|") || [];

        const salidas =
            datos.BIB_OUT?.split("|") || [];

        const jugadoresIn =
            datos.PLAYER_IN?.split("|") || [];

        const jugadoresOut =
            datos.PLAYER_OUT?.split("|") || [];

        const equipos =
            datos.TEAM?.split("|") || [];

        const tiempos =
            datos.TIME?.split("|") || [];

        for (
            let i = 0;
            i < entradas.length;
            i++
        ) {

            const jugadorEntra =
                buscarJugador(
                    jugadoresIn[i]
                );

            const jugadorSale =
                buscarJugador(
                    jugadoresOut[i]
                );

            sustituciones.push({
                equipo:
                    jugadorEntra?.equipo ||
                    equipos[i] ||
                    "",

                pais:
                    jugadorEntra?.pais ||
                    "",

                minuto:
                    tiempos[i] || "",

                camisetaEntra:
                    entradas[i] || "",

                nombreEntra:
                    jugadorEntra?.Name || "",

                camisetaSale:
                    salidas[i] || "",

                nombreSale:
                    jugadorSale?.Name || "",

                idEntra:
                    jugadoresIn[i] || "",

                idSale:
                    jugadoresOut[i] || ""
            });
        }
    }

    return sustituciones;
}


async function obtenerPartidoFutbol(unidad) {

    if (!unidad?.resCode) {
        throw new Error(
            "La unidad no tiene ResCode"
        );
    }

    const resultado =
        await obtenerResultado(
            "FBL",
            unidad.resCode
        );

    const info =
        resultado.Info || {};

    const resultados =
        resultado.Results || {};

    return {

        info: {
            fecha:
                info.DateTimeRaw || "",

            deporte:
                info.DiscDesc || "",

            evento:
                info.EventDesc || "",

            fase:
                info.PhaseDesc || "",

            faseCorta:
                info.PhaseDescA || "",

            unidad:
                info.UnitDesc || "",

            estado:
                info.Status || "",

            estadoTexto:
                info.StatusDesc || "",

            estadio:
                info.VenueDesc || "",

            sede:
                info.LocDesc || "",

            sedeCodigo:
                info.Loc || "",

            venueCodigo:
                info.Venue || "",

            enVivo:
                info.IsLive === true
        },

        marcador: {
            resultado:
                resultados.Result || "",

            detalle:
                resultados.ResDetail || "",

            duracion:
                resultados.Duration || "",

            periodoActual:
                resultados.CurrentPeriod || 0
        },

        equipos:
            resultado.Competitors.map(
                normalizarEstadisticasFutbol
            ),

        goleadores:
            obtenerGoleadoresFutbol(
                resultado
            ),

        jugadores:
            obtenerJugadoresFutbol(
                resultado
            ),

        sustituciones:
            obtenerSustitucionesFutbol(
                resultado
            ),

        periodos:
            resultados.Periods || [],

        extensiones:
            resultados.Extensions || []
    };
}

// ========================================
// MOTOR DE EVENTOS DE LA APLICACIÓN
// ========================================

let eventosActuales = [];
let eventosEnVivo = [];
let eventosProximos = [];
let eventosFinalizados = [];

let detallesEventos = {};
let firmasResultadosLive = {};

let intervaloLive = null;
let intervaloAgenda = null;

let actualizandoLive = false;
let actualizandoAgenda = false;


// ========================================
// OBTENER TODOS LOS EVENTOS
// ========================================

function obtenerTodosLosEventos() {

    return Object.values(unidadesPorDisciplina)
        .flat()
        .filter(unidad => unidad?.clave);

}


// ========================================
// COMPROBAR SI UN EVENTO ESTÁ REALMENTE LIVE
// ========================================

function esEventoRealmenteEnVivo(evento) {

    if (!evento || !evento.fecha) {
        return false;
    }

    const fechaEvento =
        new Date(evento.fecha);

    const ahora =
        new Date();

    // La API puede marcar eventos futuros
    // como LIVE/RUNNING anticipadamente.
    if (fechaEvento > ahora) {
        return false;
    }

    return (
        evento.enVivo === true ||
        evento.estado === "RUNNING"
    );
}


// ========================================
// CLASIFICAR EVENTOS
// ========================================

function clasificarEventos() {

    const todos =
        obtenerTodosLosEventos();

    eventosActuales =
        todos;

    eventosEnVivo =
        todos.filter(
            evento =>
                esEventoRealmenteEnVivo(evento)
        );

    eventosFinalizados =
        todos.filter(
            evento =>
                evento.mostrarResultados &&
                [
                    "OFFICIAL",
                    "UNOFFICIAL",
                    "PROVISIONAL"
                ].includes(evento.estado)
        );

    eventosProximos =
        todos.filter(evento => {

            if (
                esEventoRealmenteEnVivo(evento)
            ) {
                return false;
            }

            return [
                "SCHEDULED",
                "START_LIST",
                "GETTING_READY",
                "RUNNING"
            ].includes(evento.estado);
        });


    window.eventosActuales =
        eventosActuales;

    window.eventosEnVivo =
        eventosEnVivo;

    window.eventosProximos =
        eventosProximos;

    window.eventosFinalizados =
        eventosFinalizados;


    return {
        todos:
            eventosActuales,

        enVivo:
            eventosEnVivo,

        proximos:
            eventosProximos,

        finalizados:
            eventosFinalizados
    };

}


// ========================================
// RESUMEN
// ========================================

function obtenerResumenEventos() {

    return {
        total:
            eventosActuales.length,

        enVivo:
            eventosEnVivo.length,

        proximos:
            eventosProximos.length,

        finalizados:
            eventosFinalizados.length
    };

}


// ========================================
// BUSCAR EVENTO
// ========================================

function buscarEvento(codigoDeporte, clave) {

    return eventosActuales.find(
        evento =>
            evento.codigoDeporte === codigoDeporte &&
            evento.clave === clave
    ) || null;

}

// ========================================
// EVENTOS DE UNA DISCIPLINA
// ========================================

function obtenerEventosDisciplina(codigo) {

    return eventosActuales.filter(
        evento =>
            evento.codigoDeporte === codigo
    );

}


// ========================================
// EVENTOS DE UNA FECHA
// ========================================

function obtenerEventosFecha(fecha) {

    if (!fecha) return [];

    const dia =
        fecha.slice(0, 10);

    return eventosActuales.filter(
        evento =>
            evento.fecha &&
            evento.fecha.slice(0, 10) === dia
    );

}


// ========================================
// EVENTOS CON RESULTADOS
// ========================================

function obtenerEventosConResultados() {

    return eventosActuales.filter(
        evento =>
            evento.mostrarResultados &&
            evento.resCode
    );

}


// ========================================
// EVENTOS LIVE + FAVORITOS
// ========================================

let favoritosEventos = new Set(
    JSON.parse(
        localStorage.getItem("favoritosEventos") || "[]"
    )
);


// ========================================
// GUARDAR FAVORITOS
// ========================================

function guardarFavoritosEventos() {

    localStorage.setItem(
        "favoritosEventos",
        JSON.stringify(
            [...favoritosEventos]
        )
    );

}
// ==========================================
// Obtener clave favoritos
// ==========================================

function obtenerClaveFavorito(codigoDeporte, clave) {

    if (!codigoDeporte || !clave) {
        return "";
    }

    return `${codigoDeporte}:${clave}`;

}
// ========================================
// AGREGAR FAVORITO
// ========================================

function agregarFavorito(codigoDeporte, clave) {

    const claveFavorito =
        obtenerClaveFavorito(
            codigoDeporte,
            clave
        );

    if (!claveFavorito) return false;

    favoritosEventos.add(claveFavorito);

    guardarFavoritosEventos();

    console.log(
        "⭐ Evento agregado a favoritos:",
        claveFavorito
    );

    return true;
}

// ========================================
// QUITAR FAVORITO
// ========================================

function quitarFavorito(codigoDeporte, clave) {

    const claveFavorito =
        obtenerClaveFavorito(
            codigoDeporte,
            clave
        );

    if (!claveFavorito) return false;

    favoritosEventos.delete(claveFavorito);

    guardarFavoritosEventos();

    console.log(
        "☆ Evento quitado de favoritos:",
        claveFavorito
    );

    return true;
}

// ========================================
// TOGGLE FAVORITO
// ========================================

function alternarFavorito(codigoDeporte, clave) {

    const claveFavorito =
        obtenerClaveFavorito(
            codigoDeporte,
            clave
        );

    if (!claveFavorito) return false;

    if (favoritosEventos.has(claveFavorito)) {

        return quitarFavorito(
            codigoDeporte,
            clave
        );

    }

    return agregarFavorito(
        codigoDeporte,
        clave
    );

}
// ========================================
// COMPROBAR FAVORITO
// ========================================

function esFavorito(codigoDeporte, clave) {

    const claveFavorito =
        obtenerClaveFavorito(
            codigoDeporte,
            clave
        );

    return favoritosEventos.has(
        claveFavorito
    );

}


// ========================================
// OBTENER EVENTOS LIVE
// ========================================

function obtenerEventosLive() {

    return eventosEnVivo
        .filter(evento => evento && evento.enVivo === true)
        .map(evento => {

            const participantes =
                Array.isArray(evento.participantes)
                    ? evento.participantes.map(participante => ({
                        ...participante
                    }))
                    : [];

            return {
                ...evento,

                participantes,

               favorito:
    esFavorito(
        evento.codigoDeporte,
        evento.clave
    ),
                estado:
                    evento.estado || "",

                estadoTexto:
                    evento.estadoTexto || "",

                enVivo:
                    evento.enVivo === true
            };
        });
}



// ========================================
// OBTENER LIVE FAVORITOS
// ========================================

function obtenerLiveFavoritos() {

    return obtenerEventosLive()
        .filter(evento =>
            evento.favorito
        );

}


// ========================================
// OBTENER LIVE NO FAVORITOS
// ========================================

function obtenerLiveNoFavoritos() {

    return obtenerEventosLive()
        .filter(evento =>
            !evento.favorito
        );

}


// ========================================
// RESUMEN DEL LIVE
// ========================================

function obtenerResumenLive() {

    const eventos =
        obtenerEventosLive();

    return {

        total:
            eventos.length,

        favoritos:
            eventos.filter(
                evento =>
                    evento.favorito
            ).length,

        otros:
            eventos.filter(
                evento =>
                    !evento.favorito
            ).length

    };

}


// ========================================
// EXPONER FUNCIONES
// ========================================

window.favoritosEventos =
    favoritosEventos;

window.obtenerEventosLive =
    obtenerEventosLive;

window.obtenerLiveFavoritos =
    obtenerLiveFavoritos;

window.obtenerLiveNoFavoritos =
    obtenerLiveNoFavoritos;

window.obtenerResumenLive =
    obtenerResumenLive;

window.agregarFavorito =
    agregarFavorito;

window.quitarFavorito =
    quitarFavorito;

window.alternarFavorito =
    alternarFavorito;

window.esFavorito =
    esFavorito;
//=================================
// CARGAR LIVE OFICIAL DISCIPLINA
///////////////////////////////////
async function cargarLiveOficialDisciplina(disc) {
    const url =
        `${API_BASE}/api/s/${CHAMP}/${LANG}/${disc}/schedule/live-now`;

    const datos = await obtenerDatos(url);

    if (!Array.isArray(datos)) {
        return [];
    }

    return datos
        .filter(unidad => unidad && unidad.IsLive === true)
        .map(unidad => ({
            codigoDeporte: unidad.Disc || disc,
            deporte: unidad.DiscDesc || "",
            clave: unidad.Key || "",
            resCode: unidad.ResCode || unidad.Key || "",

            evento: unidad.Event || "",
            eventoNombre: unidad.EventDesc || "",

            fase: unidad.Phase || "",
            faseNombre: unidad.PhaseDesc || "",
            faseCorta: unidad.PhaseDescA || "",

            unidadNombre: unidad.UnitDesc || "",
            unidadCorta: unidad.UnitDescA || "",
            unidadNumero: unidad.UnitNum || "",

            fecha: unidad.DateTimeRaw || "",

            estado: unidad.Status || "",
            estadoTexto: unidad.StatusDesc || "",

            enVivo: unidad.IsLive === true,
            mostrarResultados: unidad.ShowResults === true,

            esEnfrentamiento: !!unidad.Home || !!unidad.Away,
            tipo: unidad.Home || unidad.Away
                ? "equipo"
                : "individual",

            participantes: [
                unidad.Home
                    ? {
                        lado: "home",
                        nombre: unidad.Home.Name || "",
                        pais: unidad.Home.Org || "",
                        resultado: unidad.Home.Result || "",
                        ganador: unidad.Home.Winner === true
                    }
                    : null,

                unidad.Away
                    ? {
                        lado: "away",
                        nombre: unidad.Away.Name || "",
                        pais: unidad.Away.Org || "",
                        resultado: unidad.Away.Result || "",
                        ganador: unidad.Away.Winner === true
                    }
                    : null
            ].filter(Boolean),

            sede: unidad.VenueDesc || "",
            sedeCodigo: unidad.Venue || "",

            ubicacion: unidad.LocDesc || "",
            ubicacionCodigo: unidad.Loc || "",

            medalla: unidad.Medal || "",
            estimado: unidad.Estimated === true,

            ocultarFecha: unidad.HideStartDate || false,
            ocultarUbicacion: unidad.HideLocation || false,

            resultado: null
        }));
}


async function cargarLiveOficial() {
    const resultados = [];
    const errores = [];

    for (const disc of disciplinas) {
        try {
            const eventos = await cargarLiveOficialDisciplina(disc.Key);

            for (const evento of eventos) {
                resultados.push(evento);
            }

        } catch (error) {
            console.warn(
                `⚠️ LIVE ${disc.Key}:`,
                error.message
            );

            errores.push({
                codigo: disc.Key,
                nombre: disc.Desc,
                error: error.message
            });
        }
    }

    window.erroresLiveOficial = errores;

    return resultados;
}



// ========================================
// RESULTADO SILENCIOSO
// ========================================

async function obtenerResultadoSilencioso(
    disc,
    resCode
) {

    const url =
        `${API_BASE}/api/s/${CHAMP}/${LANG}/${disc}/results/${resCode}`;

    return await obtenerDatos(url);

}


// ========================================
// FIRMA DE RESULTADO
// ========================================

function crearFirmaResultado(resultado) {

    if (!resultado) {
        return "";
    }

    /*
     * No usamos DateTime ni otros campos que puedan
     * cambiar sin que haya cambiado el resultado.
     */

    const datos = {

        info: resultado.Info || null,

        results: resultado.Results || null,

        competitors:
            resultado.Competitors || null

    };

    return JSON.stringify(datos);

}


// ========================================
// ACTUALIZAR RESULTADOS LIVE
// ========================================
async function actualizarResultadosLive() {

    if (actualizandoLive) {
        return;
    }

    actualizandoLive = true;

    try {

        // ============================================
        // 1. OBTENER LIVE REAL DESDE LA API OFICIAL
        // ============================================

        const eventosLiveOficiales =
            await cargarLiveOficial();


        // ============================================
        // 2. REEMPLAZAR EL LISTADO LIVE ACTUAL
        // ============================================

        eventosEnVivo = eventosLiveOficiales;

        window.eventosEnVivo = eventosEnVivo;


        // ============================================
        // 3. GUARDAR DETALLES BÁSICOS
        // ============================================

        for (const evento of eventosEnVivo) {

            if (!evento.clave) {
                continue;
            }

            detallesEventos[
    obtenerClaveFavorito(
        evento.codigoDeporte,
        evento.clave
    )
] = {
                Results: {
                    Result: "",
                    ResDetail: ""
                },
                Competitors:
                    evento.participantes.map(participante => ({
                        Name: participante.nombre,
                        Org: participante.pais,
                        Result: participante.resultado,
                        Winner: participante.ganador
                    }))
            };
        }


        window.detallesEventos =
            detallesEventos;


        // ============================================
        // 4. RENDERIZAR EL LIVE
        // ============================================

        renderEventosLive();
if (seccionActual === "favoritos") {
    renderFavoritos();
}

        // ============================================
        // 5. INFORMACIÓN DE DEPURACIÓN
        // ============================================

        console.log(
            `🔴 LIVE OFICIAL: ${eventosEnVivo.length} eventos`
        );

        console.table(
            eventosEnVivo.map(evento => ({
                deporte: evento.deporte,
                evento: evento.eventoNombre,
                estado: evento.estado,
                unidad: evento.unidadCorta,
                clave: evento.clave
            }))
        );


        return eventosEnVivo;

    } catch (error) {

        console.error(
            "❌ Error actualizando LIVE oficial:",
            error
        );

        return [];

    } finally {

        actualizandoLive = false;

    }
}

// ========================================
// ACTUALIZAR AGENDA
// ========================================

async function actualizarAgenda() {

    if (actualizandoAgenda) {
        return;
    }

    actualizandoAgenda = true;

    try {

        console.log(
            "📅 Actualizando agenda..."
        );

        // Actualizar todas las unidades de las 60 disciplinas
        await cargarTodasLasUnidades();

        // Actualizar agenda, próximos y finalizados
        clasificarEventos();

        // Volver a cargar el LIVE desde la fuente oficial
        await actualizarResultadosLive();

        console.log(
            `📅 Agenda actualizada | ` +
            `LIVE oficial: ${eventosEnVivo.length} | ` +
            `próximos: ${eventosProximos.length}`
        );

    } catch (error) {

        console.error(
            "❌ Error actualizando agenda:",
            error
        );

    } finally {

        actualizandoAgenda = false;

    }

}
// ========================================
// ACTUALIZAR UN EVENTO INDIVIDUAL
// ========================================

async function actualizarEventoLive(codigoDeporte, clave) {

    const evento =
        buscarEvento(codigoDeporte, clave);

    if (!evento) {
        return null;
    }

    if (!evento.resCode) {
        return null;
    }

    const resultado =
        await obtenerResultadoSilencioso(
            evento.codigoDeporte,
            evento.resCode
        );

const claveCompuesta =
    obtenerClaveFavorito(
        codigoDeporte,
        clave
    );

detallesEventos[claveCompuesta] =
    resultado;

firmasResultadosLive[claveCompuesta] =
    crearFirmaResultado(resultado);

    window.detallesEventos =
        detallesEventos;

    return {
        unidad: evento,
        resultado
    };

}


// ========================================
// INICIAR ACTUALIZACIÓN AUTOMÁTICA
// ========================================

function iniciarActualizacionAutomatica(
    segundosLive = 10,
    segundosAgenda = 60
) {

    detenerActualizacionAutomatica();


    console.log(
        `🔴 LIVE cada ${segundosLive}s`
    );

    console.log(
        `📅 Agenda cada ${segundosAgenda}s`
    );


    intervaloLive =
        setInterval(
            actualizarResultadosLive,
            segundosLive * 1000
        );


    intervaloAgenda =
        setInterval(
            actualizarAgenda,
            segundosAgenda * 1000
        );


    window.intervaloLive =
        intervaloLive;

    window.intervaloAgenda =
        intervaloAgenda;

}


// ========================================
// DETENER ACTUALIZACIÓN
// ========================================

function detenerActualizacionAutomatica() {

    if (intervaloLive) {

        clearInterval(
            intervaloLive
        );

        intervaloLive = null;

    }

    if (intervaloAgenda) {

        clearInterval(
            intervaloAgenda
        );

        intervaloAgenda = null;

    }

}


// ========================================
// INICIALIZAR MOTOR
// ========================================

async function inicializarMotorEventos() {

    clasificarEventos();

    console.log(
        "📊 Motor de eventos iniciado:",
        obtenerResumenEventos()
    );


    // Primera carga de resultados LIVE
    await actualizarResultadosLive();


    // Primera renderización de la interfaz
    renderEventosLive();


    // ========================================
    // ACTUALIZACIÓN AUTOMÁTICA
    // ========================================

    iniciarActualizacionAutomatica(
        30,
        60
    );

}

// INICIAR
async function iniciarAplicacion() {

    console.log("🚀 Iniciando aplicación...");

    await cargarDisciplinas();

    await cargarTodasLasUnidades();

    await inicializarMotorEventos();

    console.log("✅ Aplicación lista");

    window.appLista = true;
}
iniciarAplicacion();

// ========================================
// UI — EVENTOS EN VIVO
// ========================================

function crearTarjetaEventoLive(evento) {

    const tarjeta = document.createElement("article");

    tarjeta.className =
        "evento-live-card" +
        (evento.favorito ? " favorito" : "");

    tarjeta.dataset.clave =
    obtenerClaveFavorito(
        evento.codigoDeporte,
        evento.clave
    );


    // ========================================
    // CABECERA
    // ========================================

    const cabecera = document.createElement("div");

    cabecera.className =
        "evento-live-cabecera";


    const izquierda = document.createElement("div");

    izquierda.className =
        "evento-live-deporte";


    const indicador =
        document.createElement("span");

    indicador.className =
        "evento-live-indicador";

    indicador.textContent = "🔴 LIVE";


    const deporte =
        document.createElement("strong");

    deporte.textContent =
        evento.deporte || evento.codigoDeporte;


    izquierda.appendChild(indicador);
    izquierda.appendChild(deporte);


    // ========================================
    // FAVORITO
    // ========================================

    const botonFavorito =
        document.createElement("button");

    botonFavorito.className =
        "evento-live-favorito";

    botonFavorito.type = "button";

    botonFavorito.textContent =
        evento.favorito ? "⭐" : "☆";

    botonFavorito.title =
        evento.favorito
            ? "Quitar de favoritos"
            : "Agregar a favoritos";


botonFavorito.addEventListener(
    "click",
    () => {

        alternarFavorito(
            evento.codigoDeporte,
            evento.clave
        );

        if (seccionActual === "favoritos") {
            renderFavoritos();
        } else {
            renderEventosLive();
        }

    }
);


    cabecera.appendChild(izquierda);
    cabecera.appendChild(botonFavorito);


    // ========================================
    // INFORMACIÓN
    // ========================================

    const informacion =
        document.createElement("div");

    informacion.className =
        "evento-live-info";


    const eventoNombre =
        document.createElement("div");

    eventoNombre.className =
        "evento-live-evento";

    eventoNombre.textContent =
        evento.eventoNombre ||
        evento.evento ||
        "Evento";


    const fase =
        document.createElement("div");

    fase.className =
        "evento-live-fase";

    fase.textContent =
        [
            evento.faseNombre,
            evento.unidadNombre
        ]
            .filter(Boolean)
            .join(" · ");


    informacion.appendChild(
        eventoNombre
    );

    if (fase.textContent) {

        informacion.appendChild(
            fase
        );

    }


    // ========================================
    // PARTICIPANTES
    // ========================================

    const participantes =
        document.createElement("div");

    participantes.className =
        "evento-live-participantes";


    if (
        evento.participantes &&
        evento.participantes.length
    ) {

        evento.participantes.forEach(
            participante => {

                const fila =
                    document.createElement("div");

                fila.className =
                    "evento-live-participante";


                const nombre =
                    document.createElement("span");

                nombre.textContent =
                    participante.nombre ||
                    "Participante";


                const pais =
                    document.createElement("span");

                pais.className =
                    "evento-live-pais";

                pais.textContent =
                    participante.pais || "";


                const resultado =
                    document.createElement("strong");

                resultado.className =
                    "evento-live-resultado";

                resultado.textContent =
                    participante.resultado || "";


                fila.appendChild(nombre);

                if (pais.textContent) {

                    fila.appendChild(
                        pais
                    );

                }

                fila.appendChild(
                    resultado
                );


                participantes.appendChild(
                    fila
                );

            }
        );

    }


 // ========================================
// MARCADOR DEL RESULTADO
// ========================================

const marcador =
    document.createElement("div");

marcador.className =
    "evento-live-marcador";

const resultadoAPI =
    evento.resultado?.Results;

if (resultadoAPI) {

    // Resultado principal
    if (resultadoAPI.Result) {

        marcador.textContent =
            resultadoAPI.Result;

    }
    else if (resultadoAPI.ResDetail) {

        marcador.textContent =
            resultadoAPI.ResDetail;

    }

    // Información adicional del partido
    if (
        resultadoAPI.CurrentPeriod ||
        resultadoAPI.Duration
    ) {

        const detalleMarcador =
            document.createElement("div");

        detalleMarcador.className =
            "evento-live-marcador-detalle";

        const partes = [];

        if (resultadoAPI.CurrentPeriod) {
            partes.push(
                `Período ${resultadoAPI.CurrentPeriod}`
            );
        }

        if (resultadoAPI.Duration) {
            partes.push(
                resultadoAPI.Duration
            );
        }

        detalleMarcador.textContent =
            partes.join(" · ");

        marcador.appendChild(
            detalleMarcador
        );
    }

}
    // ========================================
    // PIE
    // ========================================

    const pie =
        document.createElement("div");

    pie.className =
        "evento-live-pie";


    const sede =
        document.createElement("span");

    sede.textContent =
        [
            evento.sede,
            evento.ubicacion
        ]
            .filter(Boolean)
            .join(" · ");


    const estado =
        document.createElement("span");

    estado.textContent =
        evento.estadoTexto ||
        "En vivo";


    pie.appendChild(sede);
    pie.appendChild(estado);


    // ========================================
    // ARMAR TARJETA
    // ========================================

    tarjeta.appendChild(
        cabecera
    );

    tarjeta.appendChild(
        informacion
    );

    if (
        participantes.children.length
    ) {

        tarjeta.appendChild(
            participantes
        );

    }

    if (
        marcador.textContent
    ) {

        tarjeta.appendChild(
            marcador
        );

    }

    tarjeta.appendChild(
        pie
    );


    return tarjeta;

}


// ========================================
// RENDERIZAR EVENTOS LIVE
// ========================================

function renderEventosLive() {

    const contenedor =
        document.getElementById(
            "eventosLive"
        );


    if (!contenedor) {

        console.warn(
            "⚠️ No existe #eventosLive en el HTML"
        );

        return;

    }


    const eventos =
        obtenerEventosLive();


    contenedor.innerHTML = "";


    if (!eventos.length) {

        const vacio =
            document.createElement("div");

        vacio.className =
            "eventos-live-vacio";

        vacio.textContent =
            "No hay eventos en vivo en este momento.";

        contenedor.appendChild(
            vacio
        );

        return;

    }


    eventos.forEach(
        evento => {

            contenedor.appendChild(
                crearTarjetaEventoLive(
                    evento
                )
            );

        }
    );


    console.log(
        `🖥️ LIVE UI renderizada: ${eventos.length} eventos`
    );

}


// ========================================
// EXPONER RENDER
// ========================================

window.renderEventosLive =
    renderEventosLive;

// ========================================
// SECCIÓN DE FAVORITOS
// ========================================

let seccionActual = "inicio";

function obtenerTodosLosFavoritos() {

    // Usamos deporte + clave para identificar cada evento.
    const mapa = new Map();

    // Primero, los eventos de la agenda.
    for (const evento of eventosActuales) {

        if (!evento?.clave) continue;

        if (favoritosEventos.has(
    obtenerClaveFavorito(
        evento.codigoDeporte,
        evento.clave
    )
)) {
            mapa.set(
                `${evento.codigoDeporte}:${evento.clave}`,
                evento
            );
        }
    }

    // Después, los LIVE oficiales, que tienen
    // participantes y marcadores más actualizados.
    for (const evento of eventosEnVivo) {

        if (!evento?.clave) continue;

        if (favoritosEventos.has(
    obtenerClaveFavorito(
        evento.codigoDeporte,
        evento.clave
    )
)) {
            mapa.set(
                `${evento.codigoDeporte}:${evento.clave}`,
                evento
            );
        }
    }

    return [...mapa.values()].map(evento => ({
        ...evento,
        favorito: true,
        participantes: evento.participantes || []
    }));
}


// ========================================
// RENDERIZAR FAVORITOS
// ========================================

function renderFavoritos() {

    const contenedor =
        document.getElementById("eventosFavoritos");

    const contador =
        document.getElementById("contadorFavoritos");

    if (!contenedor) return;

    const favoritos = obtenerTodosLosFavoritos();

    contenedor.replaceChildren();

    // ========================================
    // SEPARAR POR ESTADO
    // ========================================

    const enVivo = favoritos.filter(
        evento => evento.enVivo === true
    );

    const finalizados = favoritos.filter(
        evento =>
            !evento.enVivo &&
            [
                "OFFICIAL",
                "UNOFFICIAL",
                "PROVISIONAL"
            ].includes(evento.estado)
    );

    const proximos = favoritos.filter(
        evento =>
            !evento.enVivo &&
            ![
                "OFFICIAL",
                "UNOFFICIAL",
                "PROVISIONAL"
            ].includes(evento.estado)
    );

    // ========================================
    // CONTADOR
    // ========================================

    if (contador) {
        contador.textContent =
            `${favoritos.length} eventos favoritos`;
    }

    // ========================================
    // CREAR GRUPO
    // ========================================

    function crearGrupo(titulo, eventos) {

        if (!eventos.length) return;

        const grupo =
            document.createElement("section");

        grupo.className =
            "favoritos-grupo";

        const encabezado =
            document.createElement("h3");

        encabezado.textContent =
            titulo;

        grupo.appendChild(encabezado);

        const grid =
            document.createElement("div");

        grid.className =
            "eventos-live-grid";

        eventos.sort((a, b) => {
            return new Date(a.fecha || 0) -
                   new Date(b.fecha || 0);
        });

        for (const evento of eventos) {

            const tarjeta =
                crearTarjetaEventoLive(evento);

            // ========================================
            // INDICADOR DE ESTADO
            // ========================================

            const indicador =
                tarjeta.querySelector(
                    ".evento-live-indicador"
                );

            if (indicador) {

                if (evento.enVivo) {

                    indicador.textContent =
                        "🔴 EN VIVO";

                } else if (
                    [
                        "OFFICIAL",
                        "UNOFFICIAL",
                        "PROVISIONAL"
                    ].includes(evento.estado)
                ) {

                    indicador.textContent =
                        "FINALIZADO";

                } else {

                    indicador.textContent =
                        "PROGRAMADO";
                }
            }

            // ========================================
            // BOTÓN FAVORITO
            // ========================================



            grid.appendChild(tarjeta);
        }

        grupo.appendChild(grid);
        contenedor.appendChild(grupo);
    }

    // ========================================
    // MOSTRAR GRUPOS
    // ========================================

    crearGrupo(
        "🔴 EN VIVO",
        enVivo
    );

    crearGrupo(
        "📅 PRÓXIMOS",
        proximos
    );

    crearGrupo(
        "✅ FINALIZADOS",
        finalizados
    );

    // ========================================
    // SIN FAVORITOS
    // ========================================

    if (!favoritos.length) {

        const mensaje =
            document.createElement("p");

        mensaje.textContent =
            "Todavía no tenés eventos favoritos. " +
            "Marcá una estrella en los eventos en vivo.";

        contenedor.appendChild(mensaje);
    }

    console.log(
        `⭐ Favoritos renderizados: ${favoritos.length} ` +
        `(${enVivo.length} LIVE, ` +
        `${proximos.length} próximos, ` +
        `${finalizados.length} finalizados)`
    );
}
// ========================================
// NAVEGACIÓN A FAVORITOS
// ========================================

function mostrarFavoritos() {

    seccionActual = "favoritos";

    document.getElementById(
        "seccionFavoritos"
    ).hidden = false;

    document.getElementById(
        "seccionLive"
    ).hidden = true;

    // Ocultar las secciones estáticas de ejemplo.
    document.querySelectorAll(
        ".sport-section"
    ).forEach(seccion => {
        seccion.hidden = true;
    });

    const titulo =
        document.querySelector(".topbar h1");

    if (titulo) {
        titulo.textContent = "Mis favoritos";
    }

    renderFavoritos();
}

// ========================================
// VOLVER A LA PANTALLA PRINCIPAL
// ========================================

function mostrarPantallaPrincipal() {

    seccionActual = "inicio";

    // Ocultar favoritos
    const seccionFavoritos =
        document.getElementById("seccionFavoritos");

    if (seccionFavoritos) {
        seccionFavoritos.hidden = true;
    }

    // Mostrar LIVE
    const seccionLive =
        document.getElementById("seccionLive");

    if (seccionLive) {
        seccionLive.hidden = false;
    }

    // Mostrar las secciones principales
    document.querySelectorAll(
        ".sport-section"
    ).forEach(seccion => {
        seccion.hidden = false;
    });

    // Restaurar título
    const titulo =
        document.querySelector(".topbar h1");

    if (titulo) {
        titulo.textContent = "Tus destacados";
    }
}
// ========================================
// CONECTAR BOTÓN DEL MENÚ
// ========================================

document.getElementById(
    "btnFavoritos"
)?.addEventListener(
    "click",
    mostrarFavoritos
);
const btnIndividuales =
    document.getElementById("btnIndividuales");

if (btnIndividuales) {

    btnIndividuales.addEventListener("click", () => {

        console.log("🏃 Botón Individuales");

        seccionActual = "individuales";

        document.getElementById("seccionFavoritos").hidden = true;
        document.getElementById("seccionEquipos").hidden = true;
        document.getElementById("seccionIndividuales").hidden = false;
        document.getElementById("seccionLive").hidden = true;

        renderIndividuales();
    });
}
const btnEquipos = document.getElementById("btnEquipos");

if (btnEquipos) {

    btnEquipos.addEventListener("click", () => {

        console.log("🏟️ Botón Equipos");

        seccionActual = "equipos";

        document.getElementById("seccionFavoritos").hidden = true;
        document.getElementById("seccionEquipos").hidden = false;
        document.getElementById("seccionLive").hidden = true;

        renderEquipos();
    });
}
const btnPaises =
    document.getElementById("btnPaises");

if (btnPaises) {

    btnPaises.addEventListener("click", () => {

        console.log("🌎 Botón Países");

        seccionActual = "paises";

        document.getElementById("seccionFavoritos").hidden = true;
        document.getElementById("seccionEquipos").hidden = true;
        document.getElementById("seccionIndividuales").hidden = true;
        document.getElementById("seccionPaises").hidden = false;
        document.getElementById("seccionLive").hidden = true;

        renderPaises();
    });
}
// ========================================
// BOTÓN JUEGOS SURAMERICANOS → INICIO
// ========================================

document.getElementById(
    "btnInicio"
)?.addEventListener(
    "click",
    mostrarPantallaPrincipal
);
