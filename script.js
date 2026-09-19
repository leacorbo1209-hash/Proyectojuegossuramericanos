const themeButton = document.getElementById("themeButton");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");

function actualizarTema() {
    const modoOscuro = document.body.classList.contains("dark");

    if (modoOscuro) {
        themeIcon.textContent = "☀️";
        themeText.textContent = "Modo claro";
    } else {
        themeIcon.textContent = "🌙";
        themeText.textContent = "Modo oscuro";
    }
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


// Cargar el tema guardado
const temaGuardado = localStorage.getItem("tema");

if (temaGuardado === "oscuro") {
    document.body.classList.add("dark");
}

actualizarTema();


// Botón de cambio de tema
themeButton.addEventListener("click", cambiarTema);
