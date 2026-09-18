import React, { useCallback, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useCrew } from '@/context/CrewContext';
import { useColors } from '@/hooks/useColors';

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

/** Random coord offset within ~1-25 km */
function randomOffset(): number {
  return (Math.random() - 0.5) * 0.4;
}

export default function PairScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { myId, myLocation, addCrewMember } = useCrew();

  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);

  const pairLink = `nakama://pair?user_id=${myId}`;

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(pairLink);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [pairLink]);

  const handleAddFriend = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    Keyboard.dismiss();

    // Create a demo crew member at a random nearby location
    const baseLat = myLocation?.latitude ?? 37.7749 + randomOffset();
    const baseLon = myLocation?.longitude ?? -122.4194 + randomOffset();

    await addCrewMember({
      id: generateId(),
      name: trimmed,
      latitude: baseLat + randomOffset(),
      longitude: baseLon + randomOffset(),
      hakiGranted: false,
      emperorHakiGranted: false,
    });

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAdded(true);
    setName('');
    setTimeout(() => {
      setAdded(false);
      router.back();
    }, 1200);
  }, [name, myLocation, addCrewMember]);

  return (
    <LinearGradient colors={['#0D1B2A', '#071018']} style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Your Life Tag ── */}
          <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Your Life Tag
            </Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Let a crew member scan this to pair with you
            </Text>

            <View style={styles.qrWrap}>
              <View style={[styles.qrBorder, { borderColor: colors.primary }]}>
                <QRCode
                  value={pairLink}
                  size={180}
                  color={colors.primary}
                  backgroundColor={colors.card}
                />
              </View>
            </View>

            <Text style={[styles.linkText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {pairLink}
            </Text>

            <TouchableOpacity
              onPress={handleCopy}
              style={[styles.copyBtn, { borderColor: colors.primary }]}
              activeOpacity={0.75}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={18}
                color={copied ? '#4CAF50' : colors.primary}
              />
              <Text style={[styles.copyBtnText, { color: copied ? '#4CAF50' : colors.primary }]}>
                {copied ? 'Copied!' : 'Copy Link'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Add Crew Manually ── */}
          <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Add Crew Member
            </Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Add a demo crew member to try the compass
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter crew member name"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.muted,
                  fontFamily: 'Cinzel_400Regular',
                },
              ]}
              returnKeyType="done"
              onSubmitEditing={handleAddFriend}
            />

            <TouchableOpacity
              onPress={handleAddFriend}
              style={[
                styles.addBtn,
                {
                  backgroundColor: added ? '#2A6A40' : colors.primary,
                  opacity: name.trim() ? 1 : 0.5,
                },
              ]}
              disabled={!name.trim()}
              activeOpacity={0.8}
            >
              <Ionicons
                name={added ? 'checkmark' : 'person-add'}
                size={18}
                color={colors.primaryForeground}
              />
              <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>
                {added ? 'Added to Crew!' : 'Add to Crew'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 20,
  },
  section: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 22,
    gap: 14,
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 16,
    letterSpacing: 2,
  },
  sectionSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  qrWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  qrBorder: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  linkText: {
    fontSize: 11,
    fontFamily: 'Cinzel_400Regular',
    letterSpacing: 0.3,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  copyBtnText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 15,
  },
  addBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 28,
  },
  addBtnText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 14,
    letterSpacing: 1,
  },
});
