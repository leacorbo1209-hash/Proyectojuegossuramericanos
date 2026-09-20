const API_BASE = "https://back.results.santafe2026.org";

export default {
    async fetch(request) {
        const url = new URL(request.url);

        // Permitir consultas desde nuestra página
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                }
            });
        }

        // Solo permitimos acceder a rutas de la API oficial
        if (!url.pathname.startsWith("/api/")) {
            return new Response("Proxy API Santa Fe 2026", {
                status: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*"
                }
            });
        }

        const apiPath = url.pathname.replace(/^\/api/, "");

        const apiUrl =
            `${API_BASE}${apiPath}${url.search}`;

        try {
            const response = await fetch(apiUrl);

            const headers = new Headers(response.headers);

            headers.set(
                "Access-Control-Allow-Origin",
                "*"
            );

            headers.set(
                "Access-Control-Allow-Methods",
                "GET, OPTIONS"
            );

            return new Response(
                response.body,
                {
                    status: response.status,
                    statusText: response.statusText,
                    headers
                }
            );

        } catch (error) {

            return new Response(
                JSON.stringify({
                    error: "Error conectando con la API oficial",
                    detalle: error.message
                }),
                {
                    status: 502,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                }
            );
        }
    }
};
