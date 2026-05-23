import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightAction?: { label: string; onPress: () => void };
  containerStyle?: ViewStyle;
  showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  rightAction,
  containerStyle,
  showPasswordToggle,
  secureTextEntry,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const borderColorVal = useSharedValue<string>(Colors.border);

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: borderColorVal.value,
  }));

  const handleFocus = () => {
    setIsFocused(true);
    borderColorVal.value = withTiming(error ? Colors.error : Colors.primary, { duration: 200 });
    props.onFocus?.(null as any);
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderColorVal.value = withTiming(error ? Colors.error : Colors.border, { duration: 200 });
    props.onBlur?.(null as any);
  };

  const actuallySecure = showPasswordToggle ? (secureTextEntry && !isPasswordVisible) : secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <Animated.View style={[styles.inputWrapper, animatedBorder, error && styles.errorBorder]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          {...props}
          secureTextEntry={actuallySecure}
          style={[styles.input, leftIcon ? styles.inputWithLeftIcon : undefined, (rightIcon || rightAction || showPasswordToggle) ? styles.inputWithRightIcon : undefined]}
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.primary}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        
        {showPasswordToggle && (
          <Pressable onPress={() => setIsPasswordVisible(prev => !prev)} style={styles.rightIcon}>
            <Text style={styles.passwordToggle}>{isPasswordVisible ? '🙈' : '👁'}</Text>
          </Pressable>
        )}
        
        {rightIcon && !showPasswordToggle && <View style={styles.rightIcon}>{rightIcon}</View>}
        
        {rightAction && (
          <Pressable onPress={rightAction.onPress} style={styles.rightAction}>
            <Text style={styles.rightActionText}>{rightAction.label}</Text>
          </Pressable>
        )}
      </Animated.View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter_500Medium',
    marginBottom: Spacing.xs,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  errorBorder: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontFamily: 'Inter_400Regular',
    paddingVertical: Spacing.sm,
    letterSpacing: 0.2,
  },
  inputWithLeftIcon: {
    marginLeft: Spacing.sm,
  },
  inputWithRightIcon: {
    marginRight: Spacing.sm,
  },
  leftIcon: {
    marginRight: 0,
  },
  rightIcon: {
    paddingLeft: Spacing.sm,
  },
  rightAction: {
    paddingLeft: Spacing.sm,
  },
  rightActionText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontFamily: 'Inter_600SemiBold',
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.xs,
    fontFamily: 'Inter_400Regular',
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  hintText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontFamily: 'Inter_400Regular',
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  passwordToggle: {
    fontSize: 16,
  },
});

export default Input;
