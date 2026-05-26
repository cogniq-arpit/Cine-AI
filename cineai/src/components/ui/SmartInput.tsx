/**
 * SmartInput
 * 
 * Premium text input component for Cine AI chat experiences.
 * 
 * This component must feel like the gold standard:
 * ChatGPT input + Apple Messages quality.
 * 
 * Design Philosophy:
 * - Floating keyboard choreography
 * - Smooth multiline expansion
 * - Focus-aware animation
 * - Haptic timing integration
 * - Premium cursor spacing
 * - Keyboard sync excellence
 * - Perceived craftsmanship
 * 
 * Features:
 * - Auto-expanding input (1-5 lines)
 * - Glass surface background
 * - Focus ring animation
 * - Character counter
 * - Send button (disabled on empty)
 * - Haptic feedback on focus/send
 * - Keyboard behavior management
 * - OLED-optimized styling
 * - Accessibility compliance
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  ViewStyle,
  TextInput,
  TextInputProps,
  Pressable,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  AccessibilityRole,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borders,
  opacity,
  typography,
  motion,
} from '@/design-system';
import { GlassSurface } from './GlassSurface';

/**
 * Props for SmartInput
 */
export interface SmartInputProps extends Omit<TextInputProps, 'style'> {
  /** Current input value */
  value?: string;

  /** Callback on value change */
  onChangeText?: (text: string) => void;

  /** Callback when send button is pressed */
  onSend?: (text: string) => void;

  /** Placeholder text */
  placeholder?: string;

  /** Maximum character limit */
  maxCharacters?: number;

  /** Whether the input is disabled */
  disabled?: boolean;

  /** Whether to show character counter */
  showCharacterCount?: boolean;

  /** Whether the send button shows */
  showSendButton?: boolean;

  /** Custom send button label */
  sendButtonLabel?: string;

  /** Whether input is loading/sending */
  isLoading?: boolean;

  /** Callback when keyboard appears */
  onFocusAnimationComplete?: () => void;

  /** Additional style overrides */
  containerStyle?: ViewStyle;

  /** Additional input style overrides */
  inputStyle?: ViewStyle;

  /** Accessibility label */
  accessibilityLabel?: string;

  /** Auto-focus on mount */
  autoFocus?: boolean;

  /** Maximum height for expanded state */
  maxHeight?: number;
}

/**
 * Input sizing constants
 */
const INPUT_MIN_HEIGHT = 44;
const INPUT_MAX_HEIGHT = 120;
const INPUT_PADDING_VERTICAL = spacing.component.inputPadding.vertical;
const INPUT_PADDING_HORIZONTAL = spacing.component.inputPadding.horizontal;

/**
 * SmartInput Component
 * 
 * Premium text input with smooth animations, keyboard choreography,
 * and ChatGPT/Apple Messages quality.
 */
export const SmartInput = React.forwardRef<TextInput, SmartInputProps>(
  (
    {
      value = '',
      onChangeText,
      onSend,
      placeholder = 'Message...',
      maxCharacters = 1000,
      disabled = false,
      showCharacterCount = true,
      showSendButton = true,
      sendButtonLabel = 'Send',
      isLoading = false,
      onFocusAnimationComplete,
      containerStyle,
      inputStyle,
      accessibilityLabel = 'Message input',
      autoFocus = false,
      maxHeight = INPUT_MAX_HEIGHT,
      ...textInputProps
    },
    ref
  ) => {
    const insets = useSafeAreaInsets();

    // State
    const [isFocused, setIsFocused] = useState(autoFocus);
    const [inputHeight, setInputHeight] = useState(INPUT_MIN_HEIGHT);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    // Animation values
    const focusRingOpacity = useSharedValue(autoFocus ? 0.2 : 0);
    const focusRingScale = useSharedValue(1);
    const containerHeight = useSharedValue(INPUT_MIN_HEIGHT);
    const sendButtonOpacity = useSharedValue(value.length > 0 ? 1 : opacity.interactive.disabled);
    const sendButtonScale = useSharedValue(value.length > 0 ? 1 : 0.8);

    // Text input ref for focus management
    const inputRef = useRef<TextInput>(null);

    /**
     * Handle focus
     */
    const handleFocus = () => {
      setIsFocused(true);
      setIsKeyboardVisible(true);

      // Animate focus ring
      focusRingOpacity.value = withSpring(0.3, motion.springs.standard);
      focusRingScale.value = withSpring(1.02, motion.springs.standard);

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      onFocusAnimationComplete?.();
    };

    /**
     * Handle blur
     */
    const handleBlur = () => {
      setIsFocused(false);

      // Animate focus ring
      focusRingOpacity.value = withTiming(0, { duration: 200 });
      focusRingScale.value = withSpring(1, motion.springs.standard);
    };

    /**
     * Handle text change with auto-expansion
     */
    const handleChangeText = (text: string) => {
      // Enforce max length
      if (text.length > maxCharacters) {
        text = text.slice(0, maxCharacters);
      }

      onChangeText?.(text);

      // Update send button states
      if (text.length > 0) {
        sendButtonOpacity.value = withSpring(1, motion.springs.standard);
        sendButtonScale.value = withSpring(1, motion.springs.standard);
      } else {
        sendButtonOpacity.value = withTiming(opacity.interactive.disabled, {
          duration: 200,
        });
        sendButtonScale.value = withSpring(0.8, motion.springs.gentle);
      }

      // Haptic feedback on specific thresholds
      if (text.length === 1 || text.length === maxCharacters) {
        Haptics.selectionAsync().catch(() => {});
      }
    };

    /**
     * Handle content size change (for auto-expansion)
     */
    const handleContentSizeChange = (event: {
      nativeEvent: { contentSize: { height: number } };
    }) => {
      const newHeight = Math.min(
        Math.max(event.nativeEvent.contentSize.height, INPUT_MIN_HEIGHT),
        maxHeight
      );

      setInputHeight(newHeight);
      containerHeight.value = withSpring(newHeight, motion.springs.standard);
    };

    /**
     * Handle send button press
     */
    const handleSendPress = () => {
      if (!value.trim() || isLoading) return;

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );

      // Trigger send callback
      onSend?.(value);

      // Reset input
      handleChangeText('');
      setInputHeight(INPUT_MIN_HEIGHT);

      // Dismiss keyboard
      Keyboard.dismiss();
    };

    /**
     * Focus ring animated style
     */
    const focusRingAnimatedStyle = useAnimatedStyle(() => ({
      opacity: focusRingOpacity.value,
      transform: [{ scale: focusRingScale.value }],
    }));

    /**
     * Container animated style
     */
    const containerAnimatedStyle = useAnimatedStyle(() => ({
      minHeight: containerHeight.value,
    }));

    /**
     * Send button animated style
     */
    const sendButtonAnimatedStyle = useAnimatedStyle(() => ({
      opacity: sendButtonOpacity.value,
      transform: [{ scale: sendButtonScale.value }],
    }));

    /**
     * Character count percentage
     */
    const characterCountPercentage = Math.round((value.length / maxCharacters) * 100);
    const showCharacterWarning = characterCountPercentage > 90;

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.bottom + 16}
        style={{
          paddingHorizontal: spacing.section.sm,
          paddingBottom: insets.bottom + spacing.section.sm,
        }}
      >
        {/* Focus ring indicator */}
        <Animated.View
          style={[
            focusRingAnimatedStyle,
            {
              position: 'absolute',
              top: -8,
              left: -8,
              right: -8,
              bottom: -8,
              borderRadius: borders.componentRadii.card,
              borderWidth: 2,
              borderColor: colors.accents.amberwarm,
              pointerEvents: 'none',
              zIndex: -1,
            },
          ]}
        />

        {/* Main input container */}
        <GlassSurface
          blurIntensity="subtle"
          elevation="raised"
          borderRadius={borders.componentRadii.card}
          padding={0}
          tint="none"
          showBorder={true}
          style={[
            containerAnimatedStyle,
            {
              flexDirection: 'row',
              alignItems: 'flex-end',
            },
            containerStyle,
          ]}
        >
          {/* Input field */}
          <TextInput
            ref={ref || inputRef}
            value={value}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onContentSizeChange={handleContentSizeChange}
            placeholder={placeholder}
            placeholderTextColor={colors.text.tertiary}
            editable={!disabled && !isLoading}
            multiline
            maxLength={maxCharacters}
            accessible={true}
            accessibilityRole="search"
            accessibilityLabel={accessibilityLabel}
            accessibilityHint="Type your message"
            style={[
              {
                flex: 1,
                minHeight: INPUT_MIN_HEIGHT,
                maxHeight,
                paddingVertical: INPUT_PADDING_VERTICAL,
                paddingHorizontal: INPUT_PADDING_HORIZONTAL,
                paddingRight: spacing.micro.xl,
                color: colors.text.primary,
                fontSize: typography.body.md.fontSize as number,
                lineHeight: typography.body.md.lineHeight as number,
                fontFamily: typography.body.md.fontFamily,
                textAlignVertical: 'center',
              },
              inputStyle,
            ]}
            {...textInputProps}
          />

          {/* Send button */}
          {showSendButton && (
            <Animated.View style={sendButtonAnimatedStyle}>
              <Pressable
                onPress={handleSendPress}
                disabled={value.length === 0 || isLoading}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Send message"
                accessibilityState={{
                  disabled: value.length === 0 || isLoading,
                }}
                style={({ pressed }) => ({
                  paddingRight: INPUT_PADDING_HORIZONTAL,
                  paddingLeft: spacing.micro.xl,
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: INPUT_MIN_HEIGHT,
                  opacity: pressed && value.length > 0 ? 0.7 : 1,
                })}
              >
                <MaterialCommunityIcons
                  name={isLoading ? 'loading' : 'send'}
                  size={20}
                  color={
                    value.length > 0 && !isLoading
                      ? colors.accents.amberwarm
                      : colors.text.tertiary
                  }
                  style={[]}
                />
              </Pressable>
            </Animated.View>
          )}
        </GlassSurface>

        {/* Character counter (if enabled) */}
        {showCharacterCount && maxCharacters > 0 && (
          <View
            style={{
              marginTop: spacing.micro.md,
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: spacing.micro.md,
            }}
          >
            {showCharacterWarning && (
              <MaterialCommunityIcons
                name="alert-circle"
                size={14}
                color={colors.semantic.warning}
              />
            )}
            <Animated.Text
              style={{
                fontSize: 12,
                color: showCharacterWarning
                  ? colors.semantic.warning
                  : colors.text.tertiary,
                fontFamily: typography.metadata.sm.fontFamily,
              }}
            >
              {value.length} / {maxCharacters}
            </Animated.Text>
          </View>
        )}
      </KeyboardAvoidingView>
    );
  }
);

SmartInput.displayName = 'SmartInput';

export default SmartInput;
