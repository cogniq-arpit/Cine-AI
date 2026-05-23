import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Spacing } from '../../constants/theme';

interface VoiceWaveProps {
  isListening: boolean;
  isProcessing: boolean;
  compact?: boolean;
}

// Heights create a natural audio waveform silhouette
const BAR_HEIGHTS = [14, 22, 32, 42, 52, 44, 54, 46, 36, 28, 20, 12];
const BAR_COUNT = BAR_HEIGHTS.length;

const WaveBar: React.FC<{
  index: number;
  isListening: boolean;
  isProcessing: boolean;
  maxH: number;
}> = ({ index, isListening, isProcessing, maxH }) => {
  const scaleY = useSharedValue(0.12);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    cancelAnimation(scaleY);
    cancelAnimation(opacity);

    if (isListening) {
      const baseDuration = 120 + (index % 4) * 35;
      const phaseDelay = (index * 40) % 200;
      scaleY.value = withDelay(
        phaseDelay,
        withRepeat(
          withSequence(
            withTiming(0.6 + Math.random() * 0.4, { duration: baseDuration }),
            withTiming(0.12 + Math.random() * 0.2, { duration: baseDuration }),
          ),
          -1,
          true
        )
      );
      opacity.value = withTiming(1, { duration: 200 });
    } else if (isProcessing) {
      const delay = index * 60;
      scaleY.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0.55, { duration: 500 }),
            withTiming(0.12, { duration: 500 }),
          ),
          -1,
          true
        )
      );
      opacity.value = withTiming(0.8, { duration: 300 });
    } else {
      scaleY.value = withSpring(0.12, { damping: 12, stiffness: 150 });
      opacity.value = withTiming(0.25, { duration: 400 });
    }
  }, [isListening, isProcessing]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
    opacity: opacity.value,
  }));

  const color = isListening
    ? Colors.primary
    : isProcessing
    ? Colors.indigo
    : 'rgba(255,255,255,0.4)';

  return (
    <Animated.View
      style={[
        styles.bar,
        { height: maxH, backgroundColor: color },
        animStyle,
      ]}
    />
  );
};

// Pulsing outer ring orb
const OrbRing: React.FC<{ active: boolean; color: string }> = ({ active, color }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 900 }),
          withTiming(1, { duration: 900 }),
        ),
        -1,
        true
      );
      opacity.value = withTiming(0.35, { duration: 300 });
    } else {
      scale.value = withTiming(1, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [active]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        { borderRadius: 999, backgroundColor: color },
        style,
      ]}
    />
  );
};

export const VoiceWave: React.FC<VoiceWaveProps> = ({
  isListening,
  isProcessing,
  compact = false,
}) => {
  const maxBarH = compact ? 36 : 54;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Orb glow bg */}
      <View style={styles.orbContainer}>
        <OrbRing
          active={isListening}
          color={Colors.primary}
        />
        <OrbRing
          active={isProcessing && !isListening}
          color={Colors.indigo}
        />
        <LinearGradient
          colors={
            isListening
              ? [Colors.primary, Colors.primaryDark]
              : isProcessing
              ? [Colors.indigo, '#4a44cc']
              : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']
          }
          style={styles.orbCore}
        />
      </View>

      {/* Waveform bars */}
      <View style={styles.barsRow}>
        {BAR_HEIGHTS.map((_, i) => (
          <WaveBar
            key={i}
            index={i}
            isListening={isListening}
            isProcessing={isProcessing}
            maxH={maxBarH}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
    paddingVertical: Spacing.xl,
  },
  containerCompact: {
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  orbContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbCore: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  bar: {
    width: 4,
    borderRadius: Radius.full,
    transformOrigin: 'center',
  },
});

export default VoiceWave;
