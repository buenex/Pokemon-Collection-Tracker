api_url = "http://localhost:3000/"

var pokemonTable;

$(document).ready(function () {
    pokemonTable = $('#pokemonTable').DataTable({
        pageLength: 50,
        lengthChange: false, // remove seletor 10/25/50/100
        ordering: true,
        columnDefs: [
            { orderable: false, targets: 0 } // Sprite NÃO ordena
        ],
        language: {
            search: "Search:",
            paginate: {
                next: "Next",
                previous: "Previous"
            },
            info: "Showing _START_ to _END_ of _TOTAL_ Pokémons",
            zeroRecords: "No data to show."
        }
    });
    search()
});

function filterDropdown(input) {
    const filtro = input.value.toLowerCase();
    const itens = input.closest('.dropdown-menu').querySelectorAll('.dropdown-item');

    itens.forEach(item => {
        const texto = item.textContent.toLowerCase();
        item.style.display = texto.includes(filtro) ? '' : 'none';
    });
}
async function request(path) {
    return await fetch(api_url + path)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na requisição');
            }
            return response.json();
        })
}
async function build_gens() {
    const res = await request("pokemon/filters")
    const gen_list = document.getElementById("gen-list")
    gen_list.innerHTML = ""
    res.generations.forEach((item) => {
        line = `
        <li>
            <div class="form-check">
                <input class="form-check-input gen-check" type="checkbox" value="${item}" id="gen${item}">
                <label class="form-check-label" for="gen${item}">${item}</label>
            </div>
        </li>`
        gen_list.innerHTML += line
    })

    change_gen_text()
}

function change_gen_text() {
    const dropdownBtn = document.getElementById('generationDropdown');
    const checkboxes = document.querySelectorAll('.gen-check');

    checkboxes.forEach(cb => {
        cb.addEventListener('change', atualizarTexto);
    });

    function atualizarTexto() {
        const selecionados = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        dropdownBtn.textContent = selecionados.length
            ? selecionados.join(', ')
            : 'Generations';
    }
}

async function build_game() {
    const res = await request("pokemon/filters")
    const game_list = document.getElementById("game-list")
    game_list.innerHTML = `<li class="mb-2">
                                <input type="text"
                                    class="form-control"
                                    placeholder="Type to filter..."
                                    onkeyup="filterDropdown(this)">
                            </li>
                            <li><a class="dropdown-item" >--EMPTY--</a></li>`
    res.games.forEach((item) => {
        line = `<li><a class="dropdown-item" >${item}</a></li>`
        game_list.innerHTML += line
    })
    change_game_text()
}

function change_game_text() {
    const gameDropdownBtn = document.getElementById('gameDropdown');
    const gameList = document.getElementById('game-list');

    gameList.addEventListener('click', function (e) {
        if (e.target.classList.contains('dropdown-item')) {
            e.preventDefault();

            const text = e.target.textContent.trim();
            gameDropdownBtn.textContent = text || 'Todos';
        }
    });
}

function filterDropdownGame(input) {
    const filter = input.value.toLowerCase();
    const items = input.closest('.dropdown-menu').querySelectorAll('.dropdown-item');

    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(filter) ? '' : 'none';
    });
}

async function build_list() {
    const res = await request("pokemon/")
    pokemonTable.clear();
    res.games.forEach((item) => {
        pokemonTable.row.add([
        `<img src="${item.sprite}" class="img-size">`,
        item.id,
        item.name,
        item.generation,
        item.game,
        `<div class="form-check form-switch">
            <input class="form-check-input" type="checkbox">
        </div>`])
    })
    pokemonTable.draw()
}

async function search() {
    const id = document.getElementById("id")
    const name = document.getElementById("name")
    const generation = document.getElementById("generationDropdown")
    const game = document.getElementById("gameDropdown")

    var filters = "?"
    if(id.value)
        filters += `id=${id.value}&`
    if(name.value)
        filters += `name=${name.value}&`
    if(generation.textContent != "Generations")
        filters += `generation=${generation.textContent}&`
    if(game.textContent != "--EMPTY--")
        filters += `game=${game.textContent}`

    const res = await request(`pokemon/${filters=="?"?"":filters}`)

    pokemonTable.clear();
    res.forEach((item) => {
        pokemonTable.row.add([
        `<img src="${item.sprite}" class="img-size">`,
        item.id,
        item.name,
        item.generation,
        item.game,
        `<div class="form-check form-switch">
            <input class="form-check-input have-checkbox" type="checkbox" onchange="saveHave(${item.id},this.checked)" data-id="${item.id}">
        </div>`])
    })
    pokemonTable.draw()
    loadHaveFromStorage()
}

function saveHave(id, value) {
    const data = JSON.parse(localStorage.getItem('pokemon_have')) || {};
    data[id] = value;
    localStorage.setItem('pokemon_have', JSON.stringify(data));
}

function loadHaveFromStorage() {
    const stored = JSON.parse(localStorage.getItem('pokemon_have')) || {};
  
    document.querySelectorAll('.have-checkbox').forEach(cb => {
      const id = cb.dataset.id;
  
      if (stored[id] === true) {
        cb.checked = true;
      }
    });
  }

build_gens()
build_game()