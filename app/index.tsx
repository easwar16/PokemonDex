import { useEffect, useState, useCallback } from 'react';
import { Link, useRootNavigationState } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const PAGE_SIZE = 20;

type Pokemon = {
  name: string;
  image: string;
  imageBack: string;
  imageFront: string;
  types: PokemonType[];
};

interface PokemonType {
  type: { name: string; url: string };
}

const PokemonColorByType: Record<string, string> = {
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
};

function capitalize(str: string) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
}

export default function Home() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const rootNavigationState = useRootNavigationState();
  const isRouterReady = rootNavigationState?.key != null;

  const fetchPage = useCallback(async (url?: string | null) => {
    const isFirst = !url;
    if (isFirst) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await fetch(
        url ?? `https://pokeapi.co/api/v2/pokemon?limit=${PAGE_SIZE}&offset=0`
      );
      const data = await res.json();
      const next = data.next as string | null;
      const results = (data.results ?? []) as Array<{ url: string; name: string }>;

      const detailed = await Promise.all(
        results.map(async (p) => {
          const r = await fetch(p.url);
          const d = await r.json();
          return {
            name: d.name as string,
            image: d.sprites?.front_default ?? '',
            imageBack: d.sprites?.back_default ?? '',
            imageFront: d.sprites?.front_shiny ?? '',
            types: d.types ?? [],
          };
        })
      );

      setPokemon((prev) => (isFirst ? detailed : [...prev, ...detailed]));
      setNextUrl(next);
    } catch (e) {
      console.error(e);
    } finally {
      if (isFirst) setLoading(false);
      else setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (isRouterReady) fetchPage();
  }, [isRouterReady, fetchPage]);

  const loadMore = useCallback(() => {
    if (nextUrl && !loadingMore) fetchPage(nextUrl);
  }, [nextUrl, loadingMore, fetchPage]);

  if (!isRouterReady) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2d5a4a" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (loading && pokemon.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2d5a4a" />
        <Text style={styles.loadingText}>Loading Pokémon...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pokédex</Text>
        <Text style={styles.subtitle}>
          Browse and tap a Pokémon to see its details.
        </Text>
      </View>

      <FlatList
        data={pokemon}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        numColumns={2}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#2d5a4a" />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const typeName = item.types[0]?.type.name ?? '';
          const capType = capitalize(typeName);
          const bgColor = PokemonColorByType[capType] ?? '#A8A77A';
          return (
            <View style={styles.cardWrap}>
              <Link href={`/details/${item.name}`} style={styles.cardLink}>
                <View style={[styles.card, { backgroundColor: bgColor + '22' }]}>
                  <View style={styles.cardImageWrap}>
                    <Image
                      source={{ uri: item.image || item.imageFront }}
                      style={styles.cardImage}
                    />
                  </View>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {capitalize(item.name)}
                  </Text>
                  <View style={[styles.typeChip, { backgroundColor: bgColor }]}>
                    <Text style={styles.typeChipText}>{capType || 'Unknown'}</Text>
                  </View>
                </View>
              </Link>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faf8',
    paddingLeft: 40,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#5a6b5e',
  },
  header: {
    paddingTop: 56,
    paddingBottom: 20,
    paddingLeft: 20,
    paddingRight: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1f1c',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#5a6b5e',
    marginTop: 6,
  },
  listContent: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  cardWrap: {
    flex: 1,
    minWidth: 0,
  },
  cardLink: {
    flex: 1,
    minHeight: 160,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 160,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  cardImageWrap: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: 72,
    height: 72,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1f1c',
    marginTop: 8,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
