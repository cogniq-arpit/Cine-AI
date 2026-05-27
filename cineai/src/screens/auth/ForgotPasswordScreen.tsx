import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Typography } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { AuthInput } from './components/AuthInput';
import { AUTH_BACKDROPS } from './constants';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { forgotPassword, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const fade = useSharedValue(0);
  const slide = useSharedValue(18);

  useEffect(() => {
    fade.value = withDelay(80, withTiming(1, { duration: 400 }));
    slide.value = withDelay(80, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, [fade, slide]);

  const panelStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: slide.value }],
  }));

  const onSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    setError('');
    await forgotPassword(email.trim());
    setSent(true);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Image source={{ uri: AUTH_BACKDROPS.forgot[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['rgba(8,11,18,0.36)', 'rgba(8,11,18,0.8)', '#070709']}
        locations={[0, 0.5, 0.9]}
        style={StyleSheet.absoluteFill}
      />

      <Pressable
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => navigation.goBack()}
        hitSlop={12}
      >
        <View style={styles.backPill}>
          <Ionicons name="chevron-back" size={18} color={Colors.text.primary} />
        </View>
      </Pressable>

      <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        <Animated.View style={[styles.panel, panelStyle]}>
          <Text style={styles.kicker} allowFontScaling={false}>ACCOUNT RECOVERY</Text>
          <Text style={styles.title} allowFontScaling={false}>Reset your password.</Text>
          <Text style={styles.subtitle} allowFontScaling={false}>
            Enter your account email and we will send reset instructions.
          </Text>

          {sent ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.semantic.success} />
              <Text style={styles.successText} allowFontScaling={false}>
                Recovery email sent. Please check your inbox.
              </Text>
            </View>
          ) : (
            <>
              {!!error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={15} color={Colors.semantic.error} />
                  <Text style={styles.errorText} allowFontScaling={false}>{error}</Text>
                </View>
              ) : null}

              <AuthInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                icon="mail-outline"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />

              <Pressable style={({ pressed }) => [styles.submitBtn, pressed && styles.submitPressed]} onPress={onSubmit} disabled={isLoading}>
                <LinearGradient colors={['#DCEBFF', '#B8D3FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
                  <Ionicons name="send-outline" size={14} color="#0B1526" />
                  <Text style={styles.submitText} allowFontScaling={false}>
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </>
          )}
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.void,
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    zIndex: 20,
  },
  backPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(220,236,255,0.25)',
    backgroundColor: 'rgba(9,14,24,0.68)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 92,
  },
  panel: {
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(220,235,255,0.16)',
    backgroundColor: 'rgba(8,12,20,0.84)',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  kicker: {
    color: '#AFC2E0',
    fontFamily: Typography.fontMedium,
    fontSize: 10,
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  title: {
    color: Colors.text.primary,
    fontFamily: Typography.fontDisplay,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 7,
    marginBottom: 14,
    color: '#A5B2C5',
    fontFamily: Typography.fontPrimary,
    fontSize: 13,
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(230,57,70,0.35)',
    backgroundColor: 'rgba(230,57,70,0.12)',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    color: Colors.semantic.error,
    fontFamily: Typography.fontPrimary,
    fontSize: 12,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(45,189,140,0.35)',
    backgroundColor: 'rgba(45,189,140,0.13)',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  successText: {
    flex: 1,
    color: Colors.semantic.success,
    fontFamily: Typography.fontPrimary,
    fontSize: 12,
    lineHeight: 18,
  },
  submitBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: 4,
  },
  submitPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.988 }],
  },
  submitGradient: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  submitText: {
    color: '#0B1526',
    fontFamily: Typography.fontSemiBold,
    fontSize: 14,
  },
});

export default ForgotPasswordScreen;

