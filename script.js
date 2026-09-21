// ========================================
// MODO CLARO / OSCURO
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


// ========================================
// DISCIPLINAS
// ========================================

async function obtenerDisciplinas() {
    const url =
        `${API_BASE}/api/s/${CHAMP}/${LANG}/ALL/disc/list`;

    return await obtenerDatos(url);
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

    for (const disc of disciplinas) {

        try {

            await cargarUnidadesDisciplina(disc.Key);

        } catch (error) {

            console.error(
                `Error cargando ${disc.Key}:`,
                error
            );

        }
    }

    window.unidadesPorDisciplina =
        unidadesPorDisciplina;

    console.log(
        "Unidades de las 60 disciplinas cargadas."
    );

    console.log(
        "Disciplinas cargadas:",
        Object.keys(unidadesPorDisciplina).length
    );

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


// ----------------------------------------
// OBTENER TODOS LOS EVENTOS CARGADOS
// ----------------------------------------

function obtenerTodosLosEventos() {

    return Object.values(unidadesPorDisciplina)
        .flat()
        .filter(unidad => unidad?.clave);

}


// ----------------------------------------
// CLASIFICAR EVENTOS
// ----------------------------------------

function clasificarEventos() {

    const todos = obtenerTodosLosEventos();

    eventosActuales = todos;

    eventosEnVivo = todos.filter(unidad =>
        unidad.enVivo ||
        unidad.estado === "RUNNING"
    );

    eventosFinalizados = todos.filter(unidad =>
        unidad.mostrarResultados &&
        [
            "OFFICIAL",
            "UNOFFICIAL",
            "PROVISIONAL"
        ].includes(unidad.estado)
    );

    eventosProximos = todos.filter(unidad =>
        !unidad.enVivo &&
        !unidad.mostrarResultados &&
        [
            "SCHEDULED",
            "START_LIST",
            "GETTING_READY"
        ].includes(unidad.estado)
    );

    window.eventosActuales = eventosActuales;
    window.eventosEnVivo = eventosEnVivo;
    window.eventosProximos = eventosProximos;
    window.eventosFinalizados = eventosFinalizados;

    return {
        todos: eventosActuales,
        enVivo: eventosEnVivo,
        proximos: eventosProximos,
        finalizados: eventosFinalizados
    };
}


// ----------------------------------------
// RESUMEN PARA LA INTERFAZ
// ----------------------------------------

function obtenerResumenEventos() {

    return {
        total: eventosActuales.length,

        enVivo: eventosEnVivo.length,

        proximos: eventosProximos.length,

        finalizados: eventosFinalizados.length
    };

}


// ----------------------------------------
// BUSCAR UN EVENTO POR CLAVE
// ----------------------------------------

function buscarEvento(clave) {

    return eventosActuales.find(
        evento => evento.clave === clave
    ) || null;

}


// ----------------------------------------
// BUSCAR EVENTOS DE UNA DISCIPLINA
// ----------------------------------------

function obtenerEventosDisciplina(codigo) {

    return eventosActuales.filter(
        evento => evento.codigoDeporte === codigo
    );

}


// ----------------------------------------
// EVENTOS EN UNA FECHA
// ----------------------------------------

function obtenerEventosFecha(fecha) {

    if (!fecha) return [];

    const dia = fecha.slice(0, 10);

    return eventosActuales.filter(
        evento =>
            evento.fecha &&
            evento.fecha.slice(0, 10) === dia
    );

}


// ----------------------------------------
// EVENTOS CON RESULTADOS
// ----------------------------------------

function obtenerEventosConResultados() {

    return eventosActuales.filter(
        evento =>
            evento.mostrarResultados &&
            evento.resCode
    );

}


// ----------------------------------------
// OBTENER DETALLE REAL DE UN EVENTO
// ----------------------------------------

async function obtenerDetalleEvento(unidad) {

    if (!unidad?.resCode) {
        return null;
    }

    try {

        const resultado =
            await obtenerResultado(
                unidad.codigoDeporte,
                unidad.resCode
            );

        return {
            unidad,
            resultado
        };

    } catch (error) {

        console.error(
            "Error obteniendo evento:",
            unidad.clave,
            error
        );

        return null;
    }

}


// ----------------------------------------
// ACTUALIZAR UN EVENTO
// ----------------------------------------

async function actualizarEvento(unidad) {

    if (!unidad?.resCode) {
        return null;
    }

    return await obtenerDetalleEvento(unidad);

}


// ----------------------------------------
// ACTUALIZAR TODAS LAS UNIDADES
// ----------------------------------------

async function actualizarEventos() {

    console.log("🔄 Actualizando eventos...");

    const anteriores =
        new Map(
            eventosActuales.map(
                evento => [
                    evento.clave,
                    JSON.stringify(evento)
                ]
            )
        );

    await cargarTodasLasUnidades();

    clasificarEventos();

    const cambios = [];

    for (const evento of eventosActuales) {

        const anterior =
            anteriores.get(evento.clave);

        const actual =
            JSON.stringify(evento);

        if (anterior !== actual) {

            cambios.push(evento);

        }
    }

    console.log(
        `🔄 Actualización terminada. Cambios: ${cambios.length}`
    );

    window.ultimosCambios = cambios;

    return cambios;

}


// ----------------------------------------
// INICIAR ACTUALIZACIÓN AUTOMÁTICA
// ----------------------------------------

let intervaloActualizacion = null;

function iniciarActualizacionAutomatica(
    segundos = 10
) {

    if (intervaloActualizacion) {

        clearInterval(
            intervaloActualizacion
        );

    }

    console.log(
        `🔴 Actualización automática cada ${segundos}s`
    );

    intervaloActualizacion =
        setInterval(
            actualizarEventos,
            segundos * 1000
        );

    window.intervaloActualizacion =
        intervaloActualizacion;

}


// ----------------------------------------
// DETENER ACTUALIZACIÓN
// ----------------------------------------

function detenerActualizacionAutomatica() {

    if (!intervaloActualizacion) {
        return;
    }

    clearInterval(
        intervaloActualizacion
    );

    intervaloActualizacion = null;

    console.log(
        "⏹️ Actualización automática detenida."
    );

}


// ----------------------------------------
// INICIALIZAR MOTOR DE EVENTOS
// ----------------------------------------

function inicializarMotorEventos() {

    clasificarEventos();

    console.log(
        "📊 Motor de eventos iniciado:",
        obtenerResumenEventos()
    );

    iniciarActualizacionAutomatica(10);

}
// INICIAR
async function iniciarAplicacion() {

    console.log("🚀 Iniciando aplicación...");

    await cargarDisciplinas();

    await analizarDisciplinas();

    await analizarEventosTodasLasDisciplinas();

    await cargarTodasLasUnidades();

    inicializarMotorEventos();

    console.log("✅ Aplicación lista");

    window.appLista = true;
}
iniciarAplicacion();
