import React from 'react';
import { StyleSheet, View } from 'react-native';

interface Props {
  latitude: number;
  longitude: number;
  name: string;
}

export default function MapSurface({ latitude, longitude, name }: Props) {
  const longitudeDelta = 0.015;
  const latitudeDelta = 0.012;
  const bbox = [
    longitude - longitudeDelta,
    latitude - latitudeDelta,
    longitude + longitudeDelta,
    latitude + latitudeDelta,
  ].join(',');
  const src =
    `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}` +
    `&layer=mapnik&marker=${encodeURIComponent(`${latitude},${longitude}`)}`;

  return (
    <View style={styles.root}>
      {React.createElement('iframe', {
        src,
        title: `${name} shared location`,
        style: {
          border: 0,
          width: '100%',
          height: '100%',
        },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
});