import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import CompassDial from '@/components/CompassDial';
import { useCrew } from '@/context/CrewContext';
import { useColors } from '@/hooks/useColors';

const WEB_TOP_INSET = Platform.OS === 'web' ? 67 : 0;
const WEB_BOTTOM_INSET = Platform.OS === 'web' ? 34 : 0;

export default function CompassScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [showDial, setShowDial] = useState<boolean>(false);
  const {
    crew,
    selectedFriend,
    selectFriend,
    bearingToFriend,
    distanceToFriend,
    compassHeading,
    locationPermission,
    requestLocationPermission,
    myLocation,
  } = useCrew();

  // Auto-select first crew member on mount
  useEffect(() => {
    if (!selectedFriend && crew.length > 0) {
      selectFriend(crew[0].id);
    }
  }, [crew.length]);

  // Needle rotation = bearing to friend relative to device heading
  const needleRotation =
    bearingToFriend !== null
      ? ((bearingToFriend - compassHeading + 360) % 360)
      : 0;

  const handleAddCrew = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/pair');
  }, []);

  const handleRequestLocation = useCallback(async () => {
    await requestLocationPermission();
  }, [requestLocationPermission]);

  const paddingTop = insets.top + WEB_TOP_INSET + 16;
  const paddingBottom = insets.bottom + WEB_BOTTOM_INSET;

  return (
    <LinearGradient
      colors={['#0D1B2A', '#0A1620', '#071018']}
      style={styles.root}
    >
      <View style={[styles.inner, { paddingTop, paddingBottom }]}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[styles.appTitle, { color: colors.primary }]}>NAKAMA</Text>
          <View style={styles.headerActions}>
            <View style={styles.dialControl}>
              <Text style={[styles.dialLabel, { color: colors.mutedForeground }]}>Dial</Text>
              <Switch
                value={showDial}
                onValueChange={async (value) => {
                  await Haptics.selectionAsync();
                  setShowDial(value);
                }}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={showDial ? colors.primary : colors.mutedForeground}
                ios_backgroundColor={colors.border}
                accessibilityLabel="Show compass dial"
              />
            </View>
            <TouchableOpacity onPress={handleAddCrew} style={styles.addBtn} hitSlop={8}>
              <Ionicons name="person-add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Friend name ── */}
        <View style={styles.friendLabel}>
          {selectedFriend ? (
            <>
              <Text style={[styles.friendName, { color: colors.foreground }]}>
                {selectedFriend.name}
              </Text>
              <View style={[styles.activePip, { backgroundColor: colors.primary }]} />
            </>
          ) : (
            <Text style={[styles.noFriend, { color: colors.mutedForeground }]}>
              No crew selected
            </Text>
          )}
        </View>

        {/* ── Compass ── */}
        <View style={styles.compassWrap}>
          {/* Glow ring */}
          {showDial && <View style={[styles.glowRing, { borderColor: colors.primary + '30' }]} />}
          <CompassDial
            rotation={needleRotation}
            hasTarget={!!selectedFriend && bearingToFriend !== null}
            showDial={showDial}
            targetName={selectedFriend?.name}
          />
        </View>

        {/* ── Distance reading ── */}
        <View style={styles.distanceWrap}>
          {selectedFriend ? (
            selectedFriend.hakiGranted && distanceToFriend !== null ? (
              <Text style={[styles.distanceText, { color: colors.foreground }]}>
                {distanceToFriend < 1
                  ? `${(distanceToFriend * 1000).toFixed(0)} m away`
                  : `${distanceToFriend.toFixed(1)} km away`}
              </Text>
            ) : (
              <Text style={[styles.distanceHidden, { color: colors.mutedForeground }]}>
                Haki required to reveal distance
              </Text>
            )
          ) : null}

          {selectedFriend?.emperorHakiGranted && (
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/friend/[id]/map',
                params: { id: selectedFriend.id },
              })}
              style={[styles.mapBtn, { borderColor: colors.primary }]}
              activeOpacity={0.75}
            >
              <Ionicons name="map-outline" size={16} color={colors.primary} />
              <Text style={[styles.mapBtnText, { color: colors.primary }]}>
                Emperor Haki Map
              </Text>
            </TouchableOpacity>
          )}

          {locationPermission === 'denied' && (
            <TouchableOpacity onPress={handleRequestLocation} style={styles.permBtn}>
              <Ionicons name="location-outline" size={16} color={colors.primary} />
              <Text style={[styles.permText, { color: colors.primary }]}>
                Enable location
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Crew selector ── */}
        {crew.length > 0 ? (
          <View style={styles.crewRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.crewScroll}
            >
              {crew.map((member) => {
                const isSelected = member.id === selectedFriend?.id;
                return (
                  <TouchableOpacity
                    key={member.id}
                    onPress={async () => {
                      await Haptics.selectionAsync();
                      selectFriend(member.id);
                    }}
                    style={[
                      styles.crewChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isSelected ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {member.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          /* ── Empty state ── */
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="compass-outline"
              size={40}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No Crew Yet
            </Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Add a crew member to set sail
            </Text>
            <TouchableOpacity
              onPress={handleAddCrew}
              style={[styles.addCrewBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.addCrewBtnText, { color: colors.primaryForeground }]}>
                Pair a Crew Member
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dialControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dialLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  appTitle: {
    fontFamily: 'Cinzel_900Black',
    fontSize: 22,
    letterSpacing: 6,
  },
  addBtn: { padding: 6 },
  friendLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  friendName: {
    fontFamily: 'Cinzel_400Regular',
    fontSize: 20,
    letterSpacing: 2,
  },
  noFriend: {
    fontFamily: 'Cinzel_400Regular',
    fontSize: 15,
    letterSpacing: 1,
  },
  activePip: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  compassWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 310,
  },
  glowRing: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1,
  },
  distanceWrap: {
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
    marginVertical: 8,
  },
  distanceText: {
    fontFamily: 'Cinzel_400Regular',
    fontSize: 18,
    letterSpacing: 1,
  },
  distanceHidden: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  mapBtnText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  permBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  permText: { fontSize: 13, fontWeight: '600' },
  crewRow: {
    marginBottom: 12,
    height: 56,
  },
  crewScroll: {
    paddingHorizontal: 20,
    gap: 10,
    alignItems: 'center',
  },
  crewChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  chipText: {
    fontFamily: 'Cinzel_400Regular',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    gap: 10,
    // Keep the Life Tag action above the absolute-positioned bottom tabs.
    paddingBottom: 120,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  emptyBody: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  addCrewBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 28,
  },
  addCrewBtnText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 14,
    letterSpacing: 1,
  },
});
