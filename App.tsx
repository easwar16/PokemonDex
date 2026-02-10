import { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';


type Pokemon = {
  name: string;
  image: string;
  imageBack: string;
  imageFront: string;
  types: PokemonType[];
}

interface PokemonType {
  type: {
    name: string;
    url: string;
  }
}

const PokemonColorByType = {
  Normal: '#A8A77A',
  Fire: '#EE8130',
  Water: '#6390F0',
  Electric: '#F7D02C',
  Grass: '#7AC74C',
  Ice: '#96D9D6',
  Fighting: '#C22E28',
  Poison: '#A33EA1',
  Ground: '#E2BF65',
  Flying: '#A98FF3',
  Psychic: '#F95587',
  Bug: '#A6B91A',
  Rock: '#B6A136',
  Ghost: '#735797',
  Dragon: '#6F35FC',
  Dark: '#705746',
  Steel: '#B7B7CE',
  Fairy: '#D685AD',
}

export default function App() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  useEffect(() => {
    fetchPokemon()
  }, []);
  async function fetchPokemon() {
    try {
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=20');
      const data = await response.json();

      const DetailedPokemons = await Promise.all(data.results.map(async (pokemon: any) => {
        const response = await fetch(pokemon.url);
        const data = await response.json();
        
        let name = data.name.charAt(0).toUpperCase() + data.name.slice(1) ;
        return {
          name: name,
          image: data.sprites.front_default,
          imageBack: data.sprites.back_default,
          imageFront: data.sprites.front_shiny,
          types: data.types
        };
      }));
      console.log(DetailedPokemons);
      setPokemon(DetailedPokemons);

      // console.log(data.results);
    } catch (error) {
      console.error(error);
    }
  }
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ gap: 16, padding: 20, width: '100%' }}>
        {pokemon.map((pokemon) => {
          const typeName = pokemon.types[0]?.type.name ?? '';
          const capitalizedType = typeName ? typeName.charAt(0).toUpperCase() + typeName.slice(1).toLowerCase() : '';
          const bgColor = capitalizedType && capitalizedType in PokemonColorByType
            ? PokemonColorByType[capitalizedType as keyof typeof PokemonColorByType]
            : '#FFF';
          return (
            <Link
              key={pokemon.name} href={`/details/${pokemon.name}`}
              style={{
                backgroundColor: bgColor + 50,
                borderRadius: 15,
                padding: 80,
                width: '100%'
              }}>
              <View>
                <Text style={styles.name}>{pokemon.name}</Text>
                <Text style={styles.types}>{pokemon.types[0].type.name}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Image source={{ uri: pokemon.imageFront }} style={{ width: 100, height: 100 }} />
                  <Image source={{ uri: pokemon.imageBack }} style={{ width: 100, height: 100 }} />
                </View>
              </View>
            </Link>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  types: {
    fontSize: 20,
    color: 'gray',
    textAlign: 'center',
    fontWeight: 'bold'
  }
});
