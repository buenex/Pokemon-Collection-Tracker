let POKEMONS = [];
let pokemonTable;

const STORAGE_KEY = 'pokemon_have';

/* =========================
   Inicialização
========================= */
$(document).ready(() => {
    initDataTable();
    loadPokemons();
    initEvents();
});

/* =========================
   DataTable
========================= */
function initDataTable() {
    pokemonTable = $('#pokemonTable').DataTable({
        pageLength: 50,
        lengthChange: false,
        ordering: true,
        columns: [
            {
                data: 'id',
                orderable: true,
                render: function (data, type) {
                    if (type === 'sort') {
                        const stored = getStoredHave();
                        return stored[data] === true ? 1 : 0;
                    }
                    return renderHaveCheckbox(data);
                }
            },
            {
                data: 'sprite',
                orderable: false,
                render: (data) => `<img src="${data}" class="img-size">`
            },
            { data: 'name' },
            { data: 'id', type: 'num' },
            { data: 'generation' },
            { data: 'game' }
        ],
        order: [[3, 'asc']],
        drawCallback: applyHaveState,
        language: {
            search: "Search:",
            paginate: {
                next: "Next",
                previous: "Previous"
            },
            info: "Showing _START_ to _END_ of _TOTAL_ Pokémons",
            zeroRecords: "No data to show."
        },
        drawCallback: applyHaveState
    });
}

/* =========================
   Eventos (event delegation)
========================= */
function initEvents() {
    $('#pokemonTable').on('change', '.have-checkbox', function () {
        const id = this.dataset.id;
        const value = this.checked;

        saveHave(id, value);

        pokemonTable.rows().invalidate().draw(false);
    });
}

/* =========================
   Carregamento de dados
========================= */
async function loadPokemons() {
    const res = await fetch('./src/mass.json');
    POKEMONS = await res.json();

    pokemonTable.clear();
    POKEMONS.forEach(addPokemonRow);
    pokemonTable.draw();
}

function addPokemonRow(item) {
    pokemonTable.row.add({
        id: Number(item.id),
        sprite: item.sprite,
        name: item.name,
        generation: item.generation,
        game: item.game
    });
}

function renderHaveCheckbox(id) {
    return `
        <div class="form-check form-switch">
            <input
                class="form-check-input have-checkbox"
                type="checkbox"
                data-id="${id}"
            >
        </div>
    `;
}

/* =========================
   Estado / LocalStorage
========================= */
function saveHave(id, value) {
    const data = getStoredHave();
    data[id] = value;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function applyHaveState() {
    const stored = getStoredHave();

    document.querySelectorAll('.have-checkbox').forEach(cb => {
        cb.checked = stored[cb.dataset.id] === true;
    });
}

function getStoredHave() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
}
