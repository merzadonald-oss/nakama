import React, { useCallback } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCrew } from '@/context/CrewContext';
import { useColors } from '@/hooks/useColors';

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
}

const AVATAR_COLORS = [
  '#4A7AA8', '#6B4C9A', '#A84A4A', '#4A8A6B',
  '#A87A4A', '#4A6AA8', '#8A4A6B', '#5A8A4A',
];
function avatarColor(id: string): string {
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

export default function FriendScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    crew,
    removeCrewMember,
    toggleHaki,
    toggleEmperorHaki,
    selectFriend,
  } = useCrew();

  const member = crew.find((m) => m.id === id);

  const handleUnpair = useCallback(() => {
    if (!member) return;
    if (Platform.OS === 'web') {
      removeCrewMember(member.id);
      router.back();
      return;
    }
    Alert.alert(
      `Unpair ${member.name}?`,
      'They will no longer appear in your crew.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpair',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            removeCrewMember(member.id);
            router.back();
          },
        },
      ],
    );
  }, [member, removeCrewMember]);

  const handleToggleHaki = useCallback(async () => {
    if (!member) return;
    await Haptics.selectionAsync();
    toggleHaki(member.id);
  }, [member, toggleHaki]);

  const handleToggleEmperorHaki = useCallback(async () => {
    if (!member) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toggleEmperorHaki(member.id);
  }, [member, toggleEmperorHaki]);

  const handleViewOnCompass = useCallback(async () => {
    if (!member) return;
    await Haptics.selectionAsync();
    selectFriend(member.id);
    router.navigate('/');
  }, [member, selectFriend]);

  if (!member) {
    return (
      <LinearGradient colors={['#0D1B2A', '#071018']} style={styles.root}>
        <View style={[styles.center, { paddingTop: insets.top + 40 }]}>
          <Text style={[styles.notFound, { color: colors.mutedForeground }]}>
            Crew member not found
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0D1B2A', '#071018']} style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: avatarColor(member.id) }]}>
            <Text style={styles.avatarText}>{initials(member.name)}</Text>
          </View>
          <Text style={[styles.name, { color: colors.foreground, fontFamily: 'Cinzel_700Bold' }]}>
            {member.name}
          </Text>
          <Text style={[styles.since, { color: colors.mutedForeground }]}>
            Crew since {new Date(member.addedAt).toLocaleDateString()}
          </Text>
        </View>

        {/* View on compass */}
        <TouchableOpacity
          onPress={handleViewOnCompass}
          style={[styles.compassBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate" size={20} color={colors.primaryForeground} />
          <Text style={[styles.compassBtnText, { color: colors.primaryForeground }]}>
            View on Compass
          </Text>
        </TouchableOpacity>

        {member.emperorHakiGranted && (
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/friend/[id]/map',
              params: { id: member.id },
            })}
            style={[styles.mapBtn, { borderColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Ionicons name="map-outline" size={20} color={colors.primary} />
            <Text style={[styles.mapBtnText, { color: colors.primary }]}>
              Open Emperor Haki Map
            </Text>
          </TouchableOpacity>
        )}

        {/* Settings section */}
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.primary }]}>Haki Permissions</Text>

          {/* Haki: distance */}
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={styles.rowInfo}>
              <Ionicons name="speedometer-outline" size={20} color={colors.primary} style={styles.rowIcon} />
              <View style={styles.rowCopy}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                  Haki
                </Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                  {member.hakiGranted
                    ? 'Granted — distance is visible in km'
                    : 'Not granted — distance stays hidden'}
                </Text>
              </View>
            </View>
            <Switch
              value={member.hakiGranted}
              onValueChange={handleToggleHaki}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={member.hakiGranted ? colors.primary : colors.mutedForeground}
            />
          </View>

          {/* Emperor Haki: map */}
          <View style={[styles.row, styles.lastRow]}>
            <View style={styles.rowInfo}>
              <Ionicons name="map-outline" size={20} color={colors.primary} style={styles.rowIcon} />
              <View style={styles.rowCopy}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                  Emperor Haki
                </Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                  {member.emperorHakiGranted
                    ? 'Granted — location map is unlocked'
                    : 'Not granted — map remains sealed'}
                </Text>
              </View>
            </View>
            <Switch
              value={member.emperorHakiGranted}
              onValueChange={handleToggleEmperorHaki}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={member.emperorHakiGranted ? colors.primary : colors.mutedForeground}
            />
          </View>
        </View>

        {/* Danger zone */}
        <TouchableOpacity
          onPress={handleUnpair}
          style={[styles.unpairBtn, { borderColor: colors.destructive }]}
          activeOpacity={0.75}
        >
          <Ionicons name="close-circle-outline" size={20} color={colors.destructive} />
          <Text style={[styles.unpairText, { color: colors.destructive }]}>Unpair</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 16 },
  scroll: { paddingHorizontal: 22, paddingTop: 20, gap: 18 },
  avatarSection: { alignItems: 'center', gap: 10, marginBottom: 6 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 28, fontFamily: 'Cinzel_700Bold' },
  name: { fontSize: 22, letterSpacing: 1 },
  since: { fontSize: 13 },
  compassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 28,
  },
  compassBtnText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 15,
    letterSpacing: 1,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 13,
    borderRadius: 28,
    borderWidth: 1.5,
  },
  mapBtnText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 13,
    letterSpacing: 0.7,
  },
  settingsCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    paddingTop: 14,
    paddingHorizontal: 18,
    paddingBottom: 4,
    gap: 12,
  },
  cardTitle: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  rowCopy: { flex: 1, paddingRight: 8 },
  rowIcon: { marginTop: 2 },
  rowLabel: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  rowSub: { fontSize: 12 },
  lastRow: { borderBottomWidth: 0 },
  unpairBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1.5,
    marginTop: 6,
  },
  unpairText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 15,
    letterSpacing: 1,
  },
});
