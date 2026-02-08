/* =========================================================
   CONFIG
========================================================= */

let POKEMONS = [];
let pokemonTable;

const STORAGE_KEY = "pokemon_have";
const AUTH_STORAGE_KEY = "pokemon_auth";
const API_URL = window.APP_CONFIG.API_URL;


/* =========================================================
   INIT
========================================================= */

$(document).ready(async () => {
    initDataTable();
    initEvents();
    renderAuthArea();

    applyHaveState();
    updateCounters();

    await loadPokemons();
});


/* =========================================================
   DATATABLE
========================================================= */

function initDataTable() {
    pokemonTable = $("#pokemonTable").DataTable({
        pageLength: 50,
        lengthChange: false,
        ordering: true,
        order: [[3, "asc"]],
        columns: [
            {
                data: "id",
                orderable: true,
                render: (data, type) => {
                    if (type === "sort") {
                        const stored = getStoredHave();
                        return stored[data] === true ? 1 : 0;
                    }
                    return renderHaveCheckbox(data);
                }
            },
            {
                data: "sprite",
                orderable: false,
                render: data => `<img src="${data}" class="img-size">`
            },
            { data: "name" },
            { data: "id", type: "num" },
            { data: "generation" },
            { data: "game" }
        ],
        drawCallback: () => {
            applyHaveState();
            updateCounters();
        }
    });
}

function renderHaveCheckbox(id) {
    return `
        <div class="form-check form-switch">
            <input class="form-check-input have-checkbox" type="checkbox" data-id="${id}">
        </div>
    `;
}


/* =========================================================
   EVENTS
========================================================= */

function initEvents() {
    $("#pokemonTable").on("change", ".have-checkbox", async function () {
        const id = this.dataset.id;
        const newValue = this.checked;

        const stored = getStoredHave();
        const oldValue = stored[id];

        saveHave(id, newValue);
        updateCounters();

        try {
            await savePokemonToServer(id, newValue);
        } catch {
            saveHave(id, oldValue);
            this.checked = oldValue;
            updateCounters();
            alert("Erro ao salvar no servidor");
        }
    });
}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadPokemons() {
    syncWithServer();

    const res = await fetch("./src/mass.json");
    POKEMONS = await res.json();

    pokemonTable.clear();
    pokemonTable.rows.add(
        POKEMONS.map(p => ({
            id: Number(p.id),
            sprite: p.sprite,
            name: p.name,
            generation: p.generation,
            game: p.game
        }))
    );

    pokemonTable.draw();
}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function getStoredHave() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
}

function clearPokemonData(){
    localStorage.removeItem(STORAGE_KEY)
}

function saveHave(id, value) {
    const data = getStoredHave();
    data[id] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function applyHaveState() {
    const stored = getStoredHave();

    document.querySelectorAll(".have-checkbox").forEach(cb => {
        cb.checked = stored[cb.dataset.id] === true;
    });
}


/* =========================================================
   COUNTERS
========================================================= */

function updateCounters() {
    const stored = getStoredHave();

    const haveCount = Object.values(stored).filter(v => v === true).length;
    const total = POKEMONS.length;
    const missingCount = total - haveCount;

    document.getElementById("count-have").textContent = haveCount;
    document.getElementById("count-missing").textContent = missingCount;
}


/* =========================================================
   AUTH
========================================================= */

function getAuthData() {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
}

function setAuthData(data) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
}

function clearAuthData() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
}

function getUserId() {
    return getAuthData()?.userHash || null;
}

async function generateUserHash(username, password) {
    const encoder = new TextEncoder();
    const raw = `pokemon-manager:v1|username=${username}|password=${password}`;
    const data = encoder.encode(raw);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

function renderAuthArea() {
    const container = document.getElementById("auth-area");
    const auth = getAuthData();

    if (!auth) {
        container.innerHTML = `<a href="#" id="loginBtn">Login</a>`;
        document.getElementById("loginBtn").onclick = showLoginModal;
    } else {
        container.innerHTML = `
            <span>
                Logged in <strong>${auth.username}</strong> |
                <a href="#" id="logoutBtn">Logout</a>
            </span>
        `;
        document.getElementById("logoutBtn").onclick = logout;
    }
}

function logout() {
    clearAuthData();
    clearPokemonData();
    renderAuthArea();
    loadPokemons()
}

function showLoginModal() {
    const modalHtml = `
        <div class="modal fade" id="loginModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Login</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <input class="form-control mb-2" id="loginUser" placeholder="User">
                        <input class="form-control" id="loginPass" type="password" placeholder="Password">
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" id="confirmLogin">Login</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = new bootstrap.Modal(document.getElementById("loginModal"));
    modal.show();

    document.getElementById("confirmLogin").onclick = async () => {
        const username = document.getElementById("loginUser").value.trim();
        const password = document.getElementById("loginPass").value;

        if (!username || !password) {
            alert("Preencha usuário e senha");
            return;
        }

        const userHash = await generateUserHash(username, password);

        setAuthData({ username, userHash });

        modal.hide();
        document.getElementById("loginModal").remove();
        renderAuthArea();
        loadPokemons()
    };
}


/* =========================================================
   SERVER SYNC
========================================================= */

async function syncWithServer() {
    const userId = getUserId();
    if (!userId) return;

    try {
        const res = await fetch(`${API_URL}/save/${userId}`);
        const rows = await res.json();

        const data = {};
        rows.forEach(r => (data[r.pokemon_id] = r.have === 1));

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

        applyHaveState();
        updateCounters();
    } catch {
        console.log("Usando cache local");
    }
}

async function savePokemonToServer(id, have) {
    const userId = getUserId();
    if (!userId) return;

    const res = await fetch(`${API_URL}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId,
            pokemons: [{ id: Number(id), have }]
        })
    });

    if (!res.ok) throw new Error("fail");
}


/* =========================================================
   EXPORT / IMPORT
========================================================= */

function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}


/* ---------- EXPORT FULL ---------- */

$("#exportData").on("click", () => {
    downloadJSON(getStoredHave(), "pokemon-have.json");
});


/* ---------- EXPORT DON'T HAVE ---------- */

async function copyDontHaveToClipboard() {
    const stored = getStoredHave();

    const names = POKEMONS
        .filter(p => stored[p.id] !== true)
        .map(p => p.name)
        .sort((a, b) => a.localeCompare(b, "pt-BR"));

    try {
        await navigator.clipboard.writeText(names.join("\n"));
        alert("Lista copiada");
    } catch {
        alert("Erro ao copiar");
    }
}

$("#exportDontHave").on("click", copyDontHaveToClipboard);


/* ---------- IMPORT ---------- */

$("#importData").on("click", () => {
    $("#importFile").val(null);
    $("#importFile").click();
});

$("#importFile").on("change", async function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async e => {
        try {
            const parsed = JSON.parse(e.target.result);

            if (typeof parsed !== "object" || Array.isArray(parsed)) {
                alert("JSON inválido");
                return;
            }

            const stored = getStoredHave();

            Object.entries(parsed).forEach(([id, value]) => {
                if (typeof value === "boolean") stored[id] = value;
            });

            localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

            const userId = getUserId();

            if (userId) {
                const payload = Object.entries(stored).map(([id, have]) => ({
                    id: Number(id),
                    have
                }));

                try {
                    await fetch(`${API_URL}/save`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId, pokemons: payload })
                    });
                } catch {
                    alert("Importado localmente, mas falhou sync com servidor");
                }
            }

            applyHaveState();
            updateCounters();

            alert("Importação concluída");
        } catch {
            alert("Erro ao ler arquivo");
        }
    };

    reader.readAsText(file);
});