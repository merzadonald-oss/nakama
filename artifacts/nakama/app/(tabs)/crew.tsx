import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import CrewCard from '@/components/CrewCard';
import { type CrewMember, useCrew } from '@/context/CrewContext';
import { useColors } from '@/hooks/useColors';

const WEB_TOP_INSET = Platform.OS === 'web' ? 67 : 0;

export default function CrewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { crew, selectedFriendId, selectFriend, removeCrewMember } = useCrew();

  const paddingTop = insets.top + WEB_TOP_INSET + 16;

  const handleSelect = useCallback(async (id: string) => {
    await Haptics.selectionAsync();
    selectFriend(id);
    router.push('/');
  }, [selectFriend]);

  const handleSettings = useCallback((member: CrewMember) => {
    router.push({ pathname: '/friend/[id]', params: { id: member.id } });
  }, []);

  const handleUnpair = useCallback((member: CrewMember) => {
    if (Platform.OS === 'web') {
      removeCrewMember(member.id);
      return;
    }
    Alert.alert(
      `Unpair ${member.name}?`,
      'They will be removed from your crew.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpair',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            removeCrewMember(member.id);
          },
        },
      ],
    );
  }, [removeCrewMember]);

  return (
    <LinearGradient colors={['#0D1B2A', '#0A1620', '#071018']} style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop }]}>
        <Text style={[styles.title, { color: colors.primary }]}>CREW</Text>
        <TouchableOpacity
          onPress={() => router.push('/pair')}
          style={[styles.pairBtn, { borderColor: colors.primary }]}
          hitSlop={8}
        >
          <Ionicons name="qr-code-outline" size={18} color={colors.primary} />
          <Text style={[styles.pairBtnText, { color: colors.primary }]}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Crew list */}
      <FlatList
        data={crew}
        keyExtractor={(m) => m.id}
        scrollEnabled={crew.length > 0}
        contentContainerStyle={crew.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <CrewCard
            member={item}
            isSelected={item.id === selectedFriendId}
            onPress={() => handleSelect(item.id)}
            onSettingsPress={() => handleSettings(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'Cinzel_700Bold' }]}>
              No Crew Yet
            </Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Pair with a friend to share your Life Tag
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/pair')}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.addBtnText, { color: colors.primaryForeground, fontFamily: 'Cinzel_700Bold' }]}>
                Pair a Crew Member
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Cinzel_900Black',
    fontSize: 22,
    letterSpacing: 6,
  },
  pairBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  pairBtnText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  listContent: { paddingBottom: 32 },
  emptyContainer: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
    marginTop: 80,
  },
  emptyTitle: { fontSize: 20, letterSpacing: 1 },
  emptyBody: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  addBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 28,
  },
  addBtnText: { fontSize: 14, letterSpacing: 1 },
});
