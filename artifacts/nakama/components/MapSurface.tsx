import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  latitude: number;
  longitude: number;
  name: string;
}

/** Fallback surface for platforms without a native or web map implementation. */
export default function MapSurface({ latitude, longitude, name }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.grid} />
      <View style={styles.marker}>
        <View style={styles.markerDot} />
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.coords}>{latitude.toFixed(5)}, {longitude.toFixed(5)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#DCE4E8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#DCE4E8',
    borderWidth: 40,
    borderColor: '#C8D7D1',
    transform: [{ rotate: '18deg' }],
  },
  marker: {
    alignItems: 'center',
    backgroundColor: '#0D1B2A',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  markerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#C5A059',
    marginBottom: 8,
  },
  name: { color: '#F5E6CA', fontSize: 15, fontWeight: '700' },
  coords: { color: '#9BB0C4', fontSize: 11, marginTop: 3 },
});