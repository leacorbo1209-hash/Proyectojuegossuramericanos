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
// INICIAR
// ========================================

cargarDisciplinas().then(async () => {

    await analizarDisciplinas();

    await analizarEventosTodasLasDisciplinas();

});
