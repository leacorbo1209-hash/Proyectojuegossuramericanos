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

function buscarEvento(clave) {

    return eventosActuales.find(
        evento => evento.clave === clave
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


// ========================================
// AGREGAR FAVORITO
// ========================================

function agregarFavorito(clave) {

    if (!clave) return false;

    favoritosEventos.add(clave);

    guardarFavoritosEventos();

    console.log(
        "⭐ Evento agregado a favoritos:",
        clave
    );

    return true;
}


// ========================================
// QUITAR FAVORITO
// ========================================

function quitarFavorito(clave) {

    if (!clave) return false;

    favoritosEventos.delete(clave);

    guardarFavoritosEventos();

    console.log(
        "☆ Evento quitado de favoritos:",
        clave
    );

    return true;
}


// ========================================
// TOGGLE FAVORITO
// ========================================

function alternarFavorito(clave) {

    if (
        favoritosEventos.has(clave)
    ) {

        return quitarFavorito(clave);

    }

    return agregarFavorito(clave);

}


// ========================================
// COMPROBAR FAVORITO
// ========================================

function esFavorito(clave) {

    return favoritosEventos.has(clave);

}


// ========================================
// OBTENER EVENTOS LIVE
// ========================================

function obtenerEventosLive() {

    const eventos = eventosEnVivo
        .filter(evento => evento?.clave)
        .filter(evento => {

            return esEventoRealmenteEnVivo(evento);

        })
        .map(evento => {

            const resultado =
                detallesEventos[evento.clave] || null;

            // ================================
            // PARTICIPANTES ACTUALIZADOS
            // ================================

            let participantes =
                evento.participantes || [];

            if (
                resultado?.Competitors &&
                Array.isArray(resultado.Competitors)
            ) {

                participantes =
                    resultado.Competitors.map(
                        (competidor, indice) => ({
                            lado:
                                indice === 0
                                    ? "home"
                                    : "away",

                            nombre:
                                competidor.Name || "",

                            pais:
                                competidor.Org || "",

                            resultado:
                                competidor.Result || "",

                            ganador:
                                competidor.Winner === true
                        })
                    );
            }

            return {

                // Identificación
                clave:
                    evento.clave,

                resCode:
                    evento.resCode,

                codigoDeporte:
                    evento.codigoDeporte,

                deporte:
                    evento.deporte,

                // Evento
                evento:
                    evento.evento,

                eventoNombre:
                    evento.eventoNombre,

                fase:
                    evento.fase,

                faseNombre:
                    evento.faseNombre,

                // Unidad
                unidadNombre:
                    evento.unidadNombre,

                unidadCorta:
                    evento.unidadCorta,

                unidadNumero:
                    evento.unidadNumero,

                // Fecha / ubicación
                fecha:
                    evento.fecha,

                sede:
                    evento.sede,

                ubicacion:
                    evento.ubicacion,

                // Participantes
                participantes,

                // Resultado completo
                resultado,

                // Favorito
                favorito:
                    esFavorito(evento.clave),

                // Estado
                estado:
                    evento.estado,

                estadoTexto:
                    evento.estadoTexto,

                enVivo:
                    true
            };

        });


    // ====================================
    // ORDEN:
    // 1. FAVORITOS
    // 2. RESTO
    // ====================================

    eventos.sort((a, b) => {

        if (
            a.favorito &&
            !b.favorito
        ) {
            return -1;
        }

        if (
            !a.favorito &&
            b.favorito
        ) {
            return 1;
        }

        return (
            new Date(a.fecha || 0) -
            new Date(b.fecha || 0)
        );

    });


    window.eventosLive =
        eventos;

    return eventos;
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

cargarLiveOficial().then(eventos => {
    console.log("🔴 LIVE OFICIAL:", eventos.length);
    console.table(
        eventos.map(e => ({
            deporte: e.deporte,
            evento: e.eventoNombre,
            fase: e.faseNombre,
            unidad: e.unidadCorta,
            estado: e.estado,
            fecha: e.fecha,
            home: e.participantes[0]?.nombre || "",
            away: e.participantes[1]?.nombre || ""
        }))
    );
});
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

            detallesEventos[evento.clave] = {
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

        await cargarTodasLasUnidades();

        clasificarEventos();

        console.log(
            `📅 Agenda actualizada | ` +
            `LIVE: ${eventosEnVivo.length} | ` +
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

async function actualizarEventoLive(clave) {

    const evento =
        buscarEvento(clave);

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

    detallesEventos[clave] =
        resultado;

    firmasResultadosLive[clave] =
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
        10,
        60
    );

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

// ========================================
// UI — EVENTOS EN VIVO
// ========================================

function crearTarjetaEventoLive(evento) {

    const tarjeta = document.createElement("article");

    tarjeta.className =
        "evento-live-card" +
        (evento.favorito ? " favorito" : "");

    tarjeta.dataset.clave = evento.clave;


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
                evento.clave
            );

            renderEventosLive();

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
