import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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

type PokemonDetails = {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  sprites: {
    front_default: string | null;
    back_default: string | null;
    front_shiny: string | null;
    back_shiny: string | null;
  };
  types: Array<{ type: { name: string; url: string } }>;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
  abilities: Array<{ ability: { name: string }; is_hidden: boolean }>;
};

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatStatName(name: string) {
  if (name === 'special-attack') return 'Sp. Atk';
  if (name === 'special-defense') return 'Sp. Def';
  return capitalize(name);
}

export default function Details() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const navigation = useNavigation();
  const [details, setDetails] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(name)}`
      );
      if (!res.ok) throw new Error('Pokémon not found');
      const data = await res.json();
      setDetails({
        id: data.id,
        name: data.name,
        height: data.height,
        weight: data.weight,
        base_experience: data.base_experience ?? 0,
        sprites: {
          front_default: data.sprites?.front_default ?? null,
          back_default: data.sprites?.back_default ?? null,
          front_shiny: data.sprites?.front_shiny ?? null,
          back_shiny: data.sprites?.back_shiny ?? null,
        },
        types: data.types ?? [],
        stats: data.stats ?? [],
        abilities: data.abilities ?? [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [name]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      presentation: 'formSheet',
      sheetAllowedDetents: [0.3, 0.5, 1],
      sheetGrabberVisible: false,
      sheetInitialDetentIndex: 1,
    });
  }, [navigation]);

  if (loading) {
    return (
      <ScrollView contentContainerStyle={{ gap: 16, padding: 20, width: '100%' }}>
        <View style={styles.container}>
          <View style={styles.grabberPill} />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#6390F0" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (error || !details) {
    return (
      <View style={styles.container}>
        <View style={styles.grabberPill} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Not found'}</Text>
        </View>
      </View>
    );
  }

  const primaryType = details.types[0]?.type.name ?? '';
  const primaryColor =
    PokemonColorByType[capitalize(primaryType)] ?? '#A8A77A' + 50;

  return (
    <View style={styles.container}>
      <View style={styles.grabberPill} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Name & ID */}
        <Text style={styles.name}>
          {capitalize(details.name)} #{details.id}
        </Text>

        {/* Types */}
        <View style={styles.typesRow}>
          {details.types.map((t) => {
            const typeName = t.type.name;
            const color =
              PokemonColorByType[capitalize(typeName)] ?? '#A8A77A';
            return (
              <View
                key={typeName}
                style={[styles.typeChip, { backgroundColor: color }]}
              >
                <Text style={styles.typeChipText}>{capitalize(typeName)}</Text>
              </View>
            );
          })}
        </View>

        {/* Sprites */}
        <View style={[styles.spriteSection, { backgroundColor: primaryColor + '30' }]}>
          <View style={styles.spriteRow}>
            {details.sprites.front_default ? (
              <Image
                source={{ uri: details.sprites.front_default }}
                style={styles.sprite}
              />
            ) : null}
            {details.sprites.back_default ? (
              <Image
                source={{ uri: details.sprites.back_default }}
                style={styles.sprite}
              />
            ) : null}
          </View>
          {(details.sprites.front_shiny || details.sprites.back_shiny) && (
            <>
              <Text style={styles.spriteLabel}>Shiny</Text>
              <View style={styles.spriteRow}>
                {details.sprites.front_shiny ? (
                  <Image
                    source={{ uri: details.sprites.front_shiny }}
                    style={styles.sprite}
                  />
                ) : null}
                {details.sprites.back_shiny ? (
                  <Image
                    source={{ uri: details.sprites.back_shiny }}
                    style={styles.sprite}
                  />
                ) : null}
              </View>
            </>
          )}
        </View>

        {/* Height, Weight, Base XP */}
        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Height</Text>
            <Text style={styles.infoValue}>{details.height / 10} m</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Weight</Text>
            <Text style={styles.infoValue}>{details.weight / 10} kg</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Base XP</Text>
            <Text style={styles.infoValue}>{details.base_experience}</Text>
          </View>
        </View>

        {/* Base stats */}
        <Text style={styles.sectionTitle}>Base stats</Text>
        <View style={styles.statsContainer}>
          {details.stats.map((s) => (
            <View key={s.stat.name} style={styles.statRow}>
              <Text style={styles.statName}>
                {formatStatName(s.stat.name)}
              </Text>
              <View style={styles.statBarBg}>
                <View
                  style={[
                    styles.statBarFill,
                    {
                      width: `${Math.min(100, (s.base_stat / 255) * 100)}%`,
                      backgroundColor: primaryColor,
                    },
                  ]}
                />
              </View>
              <Text style={styles.statValue}>{s.base_stat}</Text>
            </View>
          ))}
        </View>

        {/* Abilities */}
        <Text style={styles.sectionTitle}>Abilities</Text>
        <View style={styles.abilitiesList}>
          {details.abilities.map((a) => (
            <Text key={a.ability.name} style={styles.abilityItem}>
              {capitalize(a.ability.name.replace(/-/g, ' '))}
              {a.is_hidden ? ' (hidden)' : ''}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FBFC',
  },
  grabberPill: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginTop: 8,
    marginBottom: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#c22e28',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  typesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeChipText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  spriteSection: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  spriteRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  sprite: {
    width: 96,
    height: 96,
  },
  spriteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  infoBlock: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  statsContainer: {
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statName: {
    width: 70,
    fontSize: 14,
    fontWeight: '500',
  },
  statBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statValue: {
    width: 32,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  abilitiesList: {
    gap: 6,
  },
  abilityItem: {
    fontSize: 15,
    color: '#333',
  },
});
