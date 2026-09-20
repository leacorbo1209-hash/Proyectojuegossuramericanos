const themeButton = document.getElementById("themeButton");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");

function actualizarTema() {
    const modoOscuro = document.body.classList.contains("dark");

    themeIcon.textContent = modoOscuro ? "☀️" : "🌙";
    themeText.textContent = modoOscuro ? "Modo claro" : "Modo oscuro";
}

function cambiarTema() {
    document.body.classList.toggle("dark");

    const modoOscuro = document.body.classList.contains("dark");

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
