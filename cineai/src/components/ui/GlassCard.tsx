import React from 'react';
import { View, StyleSheet, TextInput, TextInputProps, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../constants/theme';

export const GlassCard: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <View style={[styles.cardContainer, style]}>
    <BlurView intensity={25} style={StyleSheet.absoluteFill} tint="dark" />
    <View style={styles.cardBorder} />
    <View style={styles.cardContent}>{children}</View>
  </View>
);

interface GlassInputProps extends TextInputProps {
  icon: keyof typeof Ionicons.prototype.props;
  isPassword?: boolean;
}

export const GlassInput: React.FC<GlassInputProps> = ({ icon, isPassword, style, ...props }) => {
  const [secure, setSecure] = React.useState(!!isPassword);
  const borderScale = useSharedValue(0);

  const onFocus = () => {
    borderScale.value = withTiming(1, { duration: 250 });
  };
  const onBlur = () => {
    borderScale.value = withTiming(0, { duration: 250 });
  };

  const animatedBorder = useAnimatedStyle(() => ({
    transform: [{ scaleX: borderScale.value }],
    opacity: borderScale.value,
  }));

  return (
    <View style={[styles.inputContainer, style]}>
      <BlurView intensity={12} style={StyleSheet.absoluteFill} tint="dark" />
      <Ionicons name={icon as any} size={20} color={Colors.textMuted} style={styles.inputIcon} />
      <TextInput
        placeholderTextColor="rgba(255, 255, 255, 0.4)"
        style={styles.textInput}
        secureTextEntry={secure}
        onFocus={onFocus}
        onBlur={onBlur}
        autoCapitalize="none"
        {...props}
      />
      {isPassword && (
        <Pressable onPress={() => setSecure(!secure)} style={styles.passwordToggle}>
          <Ionicons name={secure ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
        </Pressable>
      )}
      <Animated.View style={[styles.activeBorderLine, animatedBorder]} />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 15, 25, 0.45)',
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  cardContent: {
    padding: Spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  inputIcon: { marginRight: Spacing.sm },
  textInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    height: '100%',
  },
  passwordToggle: { padding: Spacing.xs },
  activeBorderLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primary,
  },
});
