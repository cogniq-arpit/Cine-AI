import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { Colors, Spacing, Radius } from '../../constants/theme';

const { width } = Dimensions.get('window');

const ShimmerBlock: React.FC<{ w: number | string; h: number; br?: number; mt?: number }> = ({
  w, h, br = Radius.md, mt = 0,
}) => {
  const shimmer = useSharedValue(0.3);
  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(withTiming(0.75, { duration: 900 }), withTiming(0.3, { duration: 900 })),
      -1, true
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: shimmer.value }));
  return (
    <Animated.View
      style={[{ width: w as any, height: h, borderRadius: br, backgroundColor: Colors.surfaceElevated, marginTop: mt }, style]}
    />
  );
};

export const ShimmerFeedLoader: React.FC = () => {
  const CARD_W = width * 0.38;

  return (
    <View style={styles.container}>
      {/* Hero placeholder */}
      <ShimmerBlock w="100%" h={300} br={0} />
      <View style={styles.pad}>
        {/* Section */}
        <ShimmerBlock w={160} h={18} mt={Spacing.xl} />
        <View style={styles.row}>
          {[0, 1, 2].map(i => <ShimmerBlock key={i} w={CARD_W} h={CARD_W * 1.5} br={Radius.lg} mt={Spacing.md} />)}
        </View>
        {/* Section 2 */}
        <ShimmerBlock w={120} h={18} mt={Spacing.xl} />
        <View style={styles.row}>
          {[0, 1, 2].map(i => <ShimmerBlock key={i} w={CARD_W} h={CARD_W * 1.5} br={Radius.lg} mt={Spacing.md} />)}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  pad: { paddingHorizontal: Spacing.xl },
  row: { flexDirection: 'row', gap: Spacing.md },
});
