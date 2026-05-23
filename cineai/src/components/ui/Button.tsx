import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = true,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const sizeStyles = {
    sm: { paddingVertical: Spacing.xs + 2, paddingHorizontal: Spacing.md, height: 36 },
    md: { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.xl, height: 48 },
    lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing['2xl'], height: 56 },
  };

  const textSizes = {
    sm: Typography.sm,
    md: Typography.base,
    lg: Typography.lg,
  };

  const isDisabled = disabled || isLoading;

  const renderContent = () => (
    <View style={styles.contentRow}>
      {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'ghost' || variant === 'secondary' ? Colors.primary : Colors.white}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            { fontSize: textSizes[size] },
            variant === 'ghost' && styles.ghostText,
            variant === 'secondary' && styles.secondaryText,
            variant === 'gold' && styles.goldText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
      {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
    </View>
  );

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        animatedStyle,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={isDisabled ? ['#444', '#333'] : [Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, sizeStyles[size], styles.primaryContainer]}
        >
          {renderContent()}
        </LinearGradient>
      ) : variant === 'gold' ? (
        <LinearGradient
          colors={isDisabled ? ['#444', '#333'] : [Colors.gold, '#B8922E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, sizeStyles[size], styles.primaryContainer]}
        >
          {renderContent()}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.base,
            sizeStyles[size],
            variant === 'secondary' && styles.secondary,
            variant === 'ghost' && styles.ghost,
            variant === 'danger' && styles.danger,
          ]}
        >
          {renderContent()}
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  primaryContainer: {
    ...Shadows.md,
  },
  secondary: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  danger: {
    backgroundColor: Colors.error,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  ghostText: {
    color: Colors.primary,
  },
  secondaryText: {
    color: Colors.textPrimary,
  },
  goldText: {
    color: Colors.background,
  },
  iconLeft: { marginRight: Spacing.sm },
  iconRight: { marginLeft: Spacing.sm },
});

export default Button;
