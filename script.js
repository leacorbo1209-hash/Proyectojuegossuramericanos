// ========================================
// JUEGOS SURAMERICANOS SANTA FE 2026
// ========================================


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
// API OFICIAL
// ========================================

const API_BASE =
    "https://proyectojuegossuramericanos.leacorbo1209.workers.dev";

const CHAMP =
    "JSUD2026";

const LANG =
    "en";


// ========================================
// OBTENER DATOS DE LA API
// ========================================

async function obtenerDatos(url) {

    const respuesta = await fetch(url);

    if (!respuesta.ok) {
        throw new Error(
            `HTTP ${respuesta.status}`
        );
    }

    const textoComprimido =
        await respuesta.text();

    const bytes =
        new Uint8Array(
            textoComprimido.length
        );

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
// OBTENER LAS 60 DISCIPLINAS
// ========================================

async function obtenerDisciplinas() {

    const url =
        `${API_BASE}/api/s/JSUD2026/en/ALL/disc/list`;

    return await obtenerDatos(url);
}


// ========================================
// PRUEBA DE CONEXIÓN
// ========================================

let disciplinas = [];
let catalogoDisciplinas = [];

async function probarAPI() {
    try {
        disciplinas = await obtenerDisciplinas();

        catalogoDisciplinas = disciplinas
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
                    { sensitivity: "base" }
                )
            );

        window.disciplinas = disciplinas;
        window.catalogoDisciplinas = catalogoDisciplinas;

        console.log("API conectada correctamente.");
        console.log(
            "Cantidad de disciplinas:",
            disciplinas.length
        );

        console.log(
            "Catálogo de disciplinas:"
        );

        console.table(catalogoDisciplinas);

    } catch (error) {
        console.error(
            "Error conectando con la API:",
            error
        );
    }
}

probarAPI();
