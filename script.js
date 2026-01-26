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
        drawCallback: function () {
            applyHaveState();
            updateCounters();
        },
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
        updateCounters();
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
    updateCounters();
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

/*
============================
Export/Import Data
============================
*/
function downloadJSON(data, filename) {
    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}

async function copyDontHaveToClipboard() {
    const stored = getStoredHave();

    const names = POKEMONS
        .filter(pokemon => stored[pokemon.id] !== true)
        .map(pokemon => pokemon.name)
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const text = names.join('\n');

    try {
        await navigator.clipboard.writeText(text);
        alert('Lista copiada para a área de transferência!');
    } catch (err) {
        console.error(err);
        alert('Não foi possível copiar para a área de transferência.');
    }
}

$('#exportDontHave').on('click', () => {
    copyDontHaveToClipboard();
});

$('#exportData').on('click', () => {
    const stored = getStoredHave();
    downloadJSON(stored, 'pokemon-have.json');
});

$('#importData').on('click', () => {
    $('#importFile').val(null); // limpa seleção anterior
    $('#importFile').click();
});
$('#importFile').on('change', function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const parsed = JSON.parse(e.target.result);

            if (typeof parsed !== 'object' || Array.isArray(parsed)) {
                alert('Formato inválido de JSON');
                return;
            }

            const stored = getStoredHave();

            Object.entries(parsed).forEach(([id, value]) => {
                if (typeof value === 'boolean') {
                    stored[id] = value;
                }
            });

            localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

            pokemonTable.rows().invalidate().draw(false);
            updateCounters();

            alert('Dados importados com sucesso!');
        } catch (err) {
            console.error(err);
            alert('Erro ao ler o arquivo JSON');
        }
    };

    reader.readAsText(file);
});

function updateCounters() {
    const stored = getStoredHave();

    const haveCount = Object.values(stored).filter(v => v === true).length;
    const total = POKEMONS.length;
    const missingCount = total - haveCount;

    document.getElementById('count-have').textContent = haveCount;
    document.getElementById('count-missing').textContent = missingCount;
}
