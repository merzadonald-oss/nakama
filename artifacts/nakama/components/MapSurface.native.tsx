import React from 'react';
import MapView, { Marker } from 'react-native-maps';

interface Props {
  latitude: number;
  longitude: number;
  name: string;
}

export default function MapSurface({ latitude, longitude, name }: Props) {
  return (
    <MapView
      style={{ flex: 1 }}
      region={{
        latitude,
        longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      }}
    >
      <Marker
        coordinate={{ latitude, longitude }}
        title={name}
        description="Emperor Haki shared location"
      />
    </MapView>
  );
}