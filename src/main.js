$(async function () {
    const pokemons = await apiGet("/pokemons");
    console.log(pokemons);
  });
  