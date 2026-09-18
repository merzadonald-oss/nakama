import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Line,
  RadialGradient,
  Stop,
} from 'react-native-svg';

// ─── Layout ────────────────────────────────────────────────────────────────────
const SIZE = 290;
const CX = SIZE / 2;
const OUTER_R = CX - 4;
const MAIN_R = CX - 18;
const TICK_R = MAIN_R - 3;

// ─── Tick data ─────────────────────────────────────────────────────────────────
const NUM_TICKS = 72; // every 5°
const TICKS = Array.from({ length: NUM_TICKS }, (_, i) => {
  const deg = i * 5;
  const rad = (deg - 90) * (Math.PI / 180);
  const isCard = deg % 90 === 0;
  const isMajor = deg % 30 === 0;
  const len = isCard ? 20 : isMajor ? 12 : 6;
  const width = isCard ? 2 : isMajor ? 1.5 : 1;
  const col = isCard ? '#C5A059' : isMajor ? '#A07840' : '#4A6A88';
  const r1 = TICK_R;
  const r2 = TICK_R - len;
  return {
    x1: CX + r1 * Math.cos(rad),
    y1: CX + r1 * Math.sin(rad),
    x2: CX + r2 * Math.cos(rad),
    y2: CX + r2 * Math.sin(rad),
    col, width,
  };
});

// ─── Floating paper pointer geometry ──────────────────────────────────────────
const POINTER_SIZE = 184;

interface Props {
  /** Degrees the needle should point (0 = up/north, 90 = right/east) */
  rotation: number;
  /** Whether there is an active target */
  hasTarget: boolean;
  /** Whether the atmospheric compass dial is visible */
  showDial: boolean;
  /** Name printed on the paper pointer */
  targetName?: string;
}

export default function CompassDial({ rotation, hasTarget, showDial, targetName }: Props) {
  const sharedRot = useSharedValue(rotation);
  const prevRotRef = useRef(rotation);

  useEffect(() => {
    // Find shortest angular path to avoid full spin-around
    let diff = rotation - (prevRotRef.current % 360);
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const next = prevRotRef.current + diff;
    prevRotRef.current = next;
    sharedRot.value = withSpring(next, { damping: 22, stiffness: 80 });
  }, [rotation]);

  const needleStyle = useAnimatedStyle(() => ({
    // The black corner mark in the supplied artwork points toward its
    // upper-left corner. Add 45° so a zero-degree bearing points straight up.
    transform: [{ rotate: `${sharedRot.value + 45}deg` }],
  }));

  const horizontalNameStyle = useAnimatedStyle(() => ({
    // Keep the name readable while the paper rotates beneath it.
    transform: [{ rotate: `${-(sharedRot.value + 45)}deg` }],
  }));

  return (
    <View style={styles.root}>
      {/* ── Optional atmospheric dial ── */}
      {showDial && (
        <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="bg" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#1A3A58" />
              <Stop offset="100%" stopColor="#0D1B2A" />
            </RadialGradient>
          </Defs>
          {/* Outer decorative ring */}
          <Circle cx={CX} cy={CX} r={OUTER_R} fill="none" stroke="#C5A059" strokeWidth={1.5} />
          {/* Main compass body */}
          <Circle cx={CX} cy={CX} r={MAIN_R} fill="url(#bg)" stroke="#C5A059" strokeWidth={2.5} />
          {/* Inner decorative ring */}
          <Circle cx={CX} cy={CX} r={MAIN_R - 22} fill="none" stroke="#2A4060" strokeWidth={1} />
          {/* Direction ticks without cardinal labels */}
          {TICKS.map((t, i) => (
            <Line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.col} strokeWidth={t.width} />
          ))}
        </Svg>
      )}

      {/* ── Floating parchment pointer ── */}
      <Animated.View
        style={[
          styles.paperContainer,
          needleStyle,
        ]}
      >
        <View style={[styles.pointerImageWrap, hasTarget && styles.pointerImageActive]}>
          <Image
            source={require('../assets/images/vivre-pointer-transparent.png')}
            contentFit="contain"
            style={styles.pointerImage}
            accessibilityLabel="Floating paper Life Tag pointer"
          />
          <Animated.View style={[styles.paperNameWrap, horizontalNameStyle]}>
            <Text style={styles.paperName} numberOfLines={1} ellipsizeMode="tail">
              {targetName || 'Life Tag'}
            </Text>
          </Animated.View>
        </View>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The pointer is one centered paper card, rotating around its middle.
  paperContainer: {
    position: 'absolute',
    width: POINTER_SIZE,
    height: POINTER_SIZE,
    top: CX - POINTER_SIZE / 2,
    left: CX - POINTER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointerImageWrap: {
    width: POINTER_SIZE,
    height: POINTER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 9,
  },
  pointerImageActive: {
    shadowOpacity: 0.5,
    shadowRadius: 14,
  },
  pointerImage: {
    width: POINTER_SIZE,
    height: POINTER_SIZE,
    position: 'absolute',
  },
  paperNameWrap: {
    width: 132,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperName: {
    width: 132,
    color: '#142538',
    fontFamily: 'Cinzel_700Bold',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0.7,
    textAlign: 'center',
  },
});
