import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useRootNavigationState } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const PAGE_SIZE = 20;

type Pokemon = {
  id: number;
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

function padNumber(n: number) {
  return n.toString().padStart(3, '0');
}

export default function Home() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const rootNavigationState = useRootNavigationState();
  const isRouterReady = rootNavigationState?.key != null;

  const fetchPage = useCallback(async (url?: string | null) => {
    const isFirst = !url;
    if (isFirst) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await fetch(
        url ??
          `https://pokeapi.co/api/v2/pokemon?limit=${PAGE_SIZE}&offset=0`
      );
      const data = await res.json();
      const next = data.next as string | null;
      const results = (data.results ?? []) as Array<{
        url: string;
        name: string;
      }>;

      const detailed = await Promise.all(
        results.map(async (p) => {
          const r = await fetch(p.url);
          const d = await r.json();
          return {
            id: d.id as number,
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

  const filteredPokemon = useMemo(() => {
    if (!searchQuery.trim()) return pokemon;
    const q = searchQuery.trim().toLowerCase();
    return pokemon.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        padNumber(p.id) === q ||
        p.id.toString() === q
    );
  }, [pokemon, searchQuery]);

  if (!isRouterReady) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3d4f5c" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (loading && pokemon.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3d4f5c" />
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
          Search for a Pokémon by name or using its National Pokédex number.
        </Text>

        {/* Search and filter bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Name or number"
              placeholderTextColor="#8e9a9e"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
          <View style={styles.filterButton}>
            <View style={styles.filterIcon}>
              <View style={styles.filterLine} />
              <View style={[styles.filterLine, { marginTop: 6 }]} />
            </View>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredPokemon}
        keyExtractor={(item) => `${item.id}-${item.name}`}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        numColumns={2}
        onEndReached={searchQuery.trim() ? undefined : loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#3d4f5c" />
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
                <View
                  style={[styles.card, { backgroundColor: bgColor + '1a' }]}
                >
                  <Image
                    source={{ uri: item.image || item.imageFront }}
                    style={styles.cardImage}
                  />
                  <View style={styles.cardTextWrap}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {capitalize(item.name)}
                    </Text>
                    <Text style={styles.cardNumber}>{padNumber(item.id)}</Text>
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
    backgroundColor: '#f5f6f7',
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
    color: '#2d3748',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#718096',
    marginTop: 8,
    lineHeight: 22,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8ecef',
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  searchIcon: {
    marginRight: 10,
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2d3748',
    paddingVertical: 12,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3d4f5c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterLine: {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#fff',
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
    minHeight: 148,
  },
  card: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 50,
    alignItems: 'center',
    justifyContent: 'center',
    height: 148,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  cardImage: {
    width: 80,
    height: 80,
  },
  cardTextWrap: {
    alignItems: 'center',
    marginTop: 10,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a202c',
  },
  cardNumber: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
