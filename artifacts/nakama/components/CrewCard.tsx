import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { type CrewMember } from '@/context/CrewContext';

interface Props {
  member: CrewMember;
  isSelected: boolean;
  onPress: () => void;
  onSettingsPress: () => void;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
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

export default function CrewCard({ member, isSelected, onPress, onSettingsPress }: Props) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.card,
        {
          backgroundColor: isSelected ? colors.secondary : colors.card,
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: avatarColor(member.id) }]}>
        <Text style={styles.avatarText}>{initials(member.name)}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground, fontFamily: 'Cinzel_400Regular' }]}>
          {member.name}
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {member.emperorHakiGranted
            ? 'Emperor Haki granted'
            : member.hakiGranted
              ? 'Haki granted'
              : 'Haki not granted'}
        </Text>
      </View>

      {/* Active indicator */}
      {isSelected && (
        <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
      )}

      {/* Settings */}
      <TouchableOpacity onPress={onSettingsPress} style={styles.settingsBtn} hitSlop={10}>
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.mutedForeground} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginHorizontal: 20,
    marginVertical: 6,
    gap: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Cinzel_700Bold',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  sub: {
    fontSize: 12,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  settingsBtn: {
    padding: 4,
  },
});
