/**
 * CineAI V3 — LoginScreen
 * Premium glass-card auth experience with floating labels.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radius, Motion } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import type { AuthStackParamList } from '../../types';

const { width: W, height: H } = Dimensions.get('window');
type LoginNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

// ─── Floating Label Input ──────────────────────────────────────────────────
interface FloatingInputProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  secureTextEntry?: boolean;
  keyboardType?: TextInput['props']['keyboardType'];
  autoCapitalize?: TextInput['props']['autoCapitalize'];
  returnKeyType?: TextInput['props']['returnKeyType'];
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  value,
  onChangeText,
  icon,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(!secureTextEntry);
  const labelAnim = useSharedValue(value ? 1 : 0);
  const borderAnim = useSharedValue(0);
  const glowAnim = useSharedValue(0);

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(labelAnim.value, [0, 1], [0, -26]) },
      { scale: interpolate(labelAnim.value, [0, 1], [1, 0.82]) },
    ],
    color: isFocused ? Colors.accent.crimson : Colors.text.tertiary,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(230,57,70,${borderAnim.value})`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));

  const handleFocus = () => {
    setIsFocused(true);
    labelAnim.value = withSpring(1, Motion.springs.gentle);
    borderAnim.value = withTiming(0.7, { duration: 200 });
    glowAnim.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) labelAnim.value = withSpring(0, Motion.springs.gentle);
    borderAnim.value = withTiming(0, { duration: 200 });
    glowAnim.value = withTiming(0, { duration: 200 });
  };

  useEffect(() => {
    if (value) labelAnim.value = withSpring(1, Motion.springs.gentle);
  }, [value]);

  return (
    <View style={inputStyles.wrapper}>
      {/* Glow effect */}
      <Animated.View style={[inputStyles.glow, glowStyle]} />

      {/* Main container */}
      <Animated.View style={[inputStyles.container, borderStyle]}>
        {/* Icon */}
        <Ionicons
          name={icon}
          size={18}
          color={isFocused ? Colors.accent.crimson : Colors.text.tertiary}
          style={inputStyles.icon}
        />

        {/* Float label */}
        <View style={inputStyles.inputArea}>
          <Animated.Text style={[inputStyles.label, labelStyle]} allowFontScaling={false}>
            {label}
          </Animated.Text>
          <TextInput
            style={inputStyles.input}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={secureTextEntry && !isVisible}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            blurOnSubmit={blurOnSubmit}
            placeholderTextColor="transparent"
            selectionColor={Colors.accent.crimson}
            cursorColor={Colors.accent.crimson}
            allowFontScaling={false}
          />
        </View>

        {/* Visibility toggle */}
        {secureTextEntry && (
          <Pressable onPress={() => setIsVisible(v => !v)} style={inputStyles.visBtn}>
            <Ionicons
              name={isVisible ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={Colors.text.tertiary}
            />
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
};

const inputStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    inset: -4,
    borderRadius: Radius.lg + 4,
    backgroundColor: Colors.accent.crimsonGlow,
    opacity: 0,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass.subtle,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 60,
    position: 'relative',
    overflow: 'hidden',
  },
  icon: {
    marginRight: 12,
    marginTop: 4,
  },
  inputArea: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    minHeight: 36,
  },
  label: {
    position: 'absolute',
    top: 8,
    left: 0,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    transformOrigin: 'left center',
  },
  input: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.primary,
    paddingTop: 14,
    paddingBottom: 0,
  },
  visBtn: {
    padding: 4,
  },
});

// ─── Main Login Screen ─────────────────────────────────────────────────────
export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNav>();
  const { signIn, isLoading } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const passwordRef = useRef<TextInput>(null);

  // Entrance animations
  const cardY = useSharedValue(40);
  const cardOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  useEffect(() => {
    backdropOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    cardOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    cardY.value = withDelay(300, withSpring(0, Motion.springs.gentle));
  }, []);

  const handleSignIn = async () => {
    if (!identifier.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      await signIn(identifier.trim(), password);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setError(e?.response?.data?.detail || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Cinematic background */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <Image
          source={{ uri: 'https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <LinearGradient
          colors={['rgba(7,7,9,0.5)', 'rgba(7,7,9,0.75)', Colors.bg.void]}
          locations={[0, 0.4, 0.85]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Back button */}
      <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
        <View style={styles.backPill}>
          <Ionicons name="chevron-back" size={18} color={Colors.text.primary} />
        </View>
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.wordmarkSmall}>
              <Text style={styles.wordmarkCine} allowFontScaling={false}>CINE</Text>
              <View style={styles.aiPillSmall}>
                <Text style={styles.wordmarkAI} allowFontScaling={false}>AI</Text>
              </View>
            </View>
            <Text style={styles.title} allowFontScaling={false}>Welcome back</Text>
            <Text style={styles.subtitle} allowFontScaling={false}>
              Sign in to continue your cinematic journey
            </Text>
          </View>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.semantic.error} />
              <Text style={styles.errorText} allowFontScaling={false}>{error}</Text>
            </View>
          )}

          {/* Inputs */}
          <FloatingInput
            label="Email or Username"
            value={identifier}
            onChangeText={setIdentifier}
            icon="person-outline"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
          />
          <FloatingInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            icon="lock-closed-outline"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
          />

          {/* Forgot password */}
          <Pressable
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText} allowFontScaling={false}>
              Forgot password?
            </Text>
          </Pressable>

          {/* Sign In Button */}
          <Pressable
            onPress={handleSignIn}
            disabled={isLoading}
            style={({ pressed }) => [styles.signInBtn, pressed && styles.btnPressed]}
          >
            <LinearGradient
              colors={[Colors.accent.crimsonLight, Colors.accent.crimson]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.text.onAccent} />
              ) : (
                <Text style={styles.signInText} allowFontScaling={false}>Sign In</Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText} allowFontScaling={false}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign up link */}
          <Pressable
            style={styles.signupRow}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.signupPrompt} allowFontScaling={false}>
              Don't have an account?{' '}
            </Text>
            <Text style={styles.signupLink} allowFontScaling={false}>
              Create one
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.void,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 100,
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 20,
    zIndex: 10,
  },
  backPill: {
    backgroundColor: Colors.glass.medium,
    borderRadius: Radius.full,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  card: {
    backgroundColor: 'rgba(13,13,18,0.85)',
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.glass.border,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  cardHeader: {
    marginBottom: 28,
  },
  wordmarkSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  wordmarkCine: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
    letterSpacing: 2,
  },
  aiPillSmall: {
    backgroundColor: Colors.accent.crimson,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  wordmarkAI: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.onAccent,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.semantic.errorMuted,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: `${Colors.semantic.error}33`,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.semantic.error,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 24,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.accent.crimson,
  },
  signInBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: Colors.accent.crimson,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
  },
  btnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  signInText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.onAccent,
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.glass.border,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.text.tertiary,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupPrompt: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.secondary,
  },
  signupLink: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.accent.crimson,
  },
});

export default LoginScreen;
