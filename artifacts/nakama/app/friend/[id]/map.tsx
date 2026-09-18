import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import MapSurface from '@/components/MapSurface';
import { useCrew } from '@/context/CrewContext';
import { useColors } from '@/hooks/useColors';

export default function EmperorHakiMapScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { crew } = useCrew();
  const member = crew.find((item) => item.id === id);

  if (!member?.emperorHakiGranted) {
    return (
      <View style={[styles.locked, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={46} color={colors.primary} />
        <Text style={[styles.lockedTitle, { color: colors.foreground }]}>
          Emperor Haki Required
        </Text>
        <Text style={[styles.lockedBody, { color: colors.mutedForeground }]}>
          This Nakama has not granted permission to reveal their map location.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MapSurface
        latitude={member.latitude}
        longitude={member.longitude}
        name={member.name}
      />
      <View style={[styles.badge, { backgroundColor: colors.background }]}>
        <Ionicons name="location" size={17} color={colors.primary} />
        <View>
          <Text style={[styles.badgeName, { color: colors.foreground }]}>
            {member.name}
          </Text>
          <Text style={[styles.badgeSub, { color: colors.mutedForeground }]}>
            Location revealed by Emperor Haki
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  locked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 42,
    gap: 12,
  },
  lockedTitle: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 20,
    textAlign: 'center',
  },
  lockedBody: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 7,
  },
  badgeName: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 14,
  },
  badgeSub: { fontSize: 11, marginTop: 2 },
});