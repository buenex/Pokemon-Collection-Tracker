import json
import requests

# URL da API
url = "https://pokeapi.co/api/v2/"
GERACOES = [
        (1, 151, 1,"red/blue/green/yellow"),
        (152, 251, 2,"gold/silver/crystal"),
        (252, 386, 3,"ruby/sapphire/emerald"),
        (387, 493, 4,"diamond/pearl/platinum"),
        (494, 649, 5,"black/white"),
        (650, 721, 6,"X/Y"),
        (722, 809, 7,"sun/moon"),
        (810, 905, 8,"sword/shield"),
        (906, 1025, 9,"scarlet/violet"),
    ]

def get_gen(id):
    for inicio, fim, geracao,game in GERACOES:
        if inicio <= id <= fim:
            return geracao
    return None

def get_game(id):
    for inicio, fim, geracao, game in GERACOES:
        if inicio <= id <= fim:
            return game
    return None

def write_mass():
    # Abre o arquivo TXT
    with open("./db/init.sql", "w", encoding="utf-8") as arquivo:
        text = "INSERT INTO pokemon (id,generation,game,name,sprite) VALUES"
        for i in range(1,1026):
            # Requisição
            response = requests.get(f'{url}/pokemon/{i}')

            # Verifica se deu certo
            response.raise_for_status()

            dados = response.json()
            id = dados["id"]
            name = dados["name"]
            sprite = dados["sprites"]["other"]["official-artwork"]["front_default"]

            text += f"({id},{get_gen(id)},'{get_game(id)}','{name}','{sprite}'),\n"
            print(f"{id}:{name} adicionado a lista")
        arquivo.write(text)

    print("Arquivo resultado.txt gerado com sucesso!")

def write_mass_json():
    with open("./db/mass.json", "w", encoding="utf-8") as arquivo:
        text = "["
        for i in range(1,1026):
            # Requisição
            response = requests.get(f'{url}/pokemon/{i}')

            # Verifica se deu certo
            response.raise_for_status()

            dados = response.json()
            id = dados["id"]
            name = dados["name"]
            sprite = dados["sprites"]["other"]["official-artwork"]["front_default"]

            obj = {"id":id,
            "name":name,
            "sprite":sprite,
            "generation":get_gen(id),
            "game":get_game(id)}
            text += json.dumps(obj)
            text += ","
            print(f"{id}:{name} adicionado a lista")
        text+="]"
        arquivo.write(text)

    print("Arquivo resultado.txt gerado com sucesso!")

write_mass_json()
