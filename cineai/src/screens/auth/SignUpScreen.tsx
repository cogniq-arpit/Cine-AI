/**
 * CineAI V3 — SignUpScreen
 * Premium glass-card registration with floating labels.
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
import { Colors, Radius, Motion } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import type { AuthStackParamList } from '../../types';

const { width: W, height: H } = Dimensions.get('window');
type SignUpNav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

// ─── Floating Label Input (reused pattern from LoginScreen) ────────────────
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
  inputRef?: React.RefObject<TextInput | null>;
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  label, value, onChangeText, icon, secureTextEntry,
  keyboardType = 'default', autoCapitalize = 'none',
  returnKeyType, onSubmitEditing, inputRef,
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
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowAnim.value }));

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
  useEffect(() => { if (value) labelAnim.value = withSpring(1, Motion.springs.gentle); }, [value]);

  return (
    <View style={fStyles.wrapper}>
      <Animated.View style={[fStyles.glow, glowStyle]} />
      <Animated.View style={[fStyles.container, borderStyle]}>
        <Ionicons name={icon} size={18} color={isFocused ? Colors.accent.crimson : Colors.text.tertiary} style={fStyles.icon} />
        <View style={fStyles.inputArea}>
          <Animated.Text style={[fStyles.label, labelStyle]} allowFontScaling={false}>{label}</Animated.Text>
          <TextInput
            ref={inputRef}
            style={fStyles.input}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={secureTextEntry && !isVisible}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            placeholderTextColor="transparent"
            selectionColor={Colors.accent.crimson}
            allowFontScaling={false}
          />
        </View>
        {secureTextEntry && (
          <Pressable onPress={() => setIsVisible(v => !v)} style={fStyles.visBtn}>
            <Ionicons name={isVisible ? 'eye-outline' : 'eye-off-outline'} size={18} color={Colors.text.tertiary} />
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
};

const fStyles = StyleSheet.create({
  wrapper: { marginBottom: 16, position: 'relative' },
  glow: {
    position: 'absolute', inset: -4, borderRadius: Radius.lg + 4,
    backgroundColor: Colors.accent.crimsonGlow, opacity: 0,
  },
  container: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.glass.subtle, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.glass.border,
    paddingHorizontal: 16, paddingVertical: 16, minHeight: 60,
  },
  icon: { marginRight: 12, marginTop: 4 },
  inputArea: { flex: 1, justifyContent: 'center', position: 'relative', minHeight: 36 },
  label: { position: 'absolute', top: 8, left: 0, fontSize: 14, fontFamily: 'Inter_400Regular', transformOrigin: 'left center' },
  input: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.text.primary, paddingTop: 14, paddingBottom: 0 },
  visBtn: { padding: 4 },
});

// ─── Main SignUp Screen ────────────────────────────────────────────────────
export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<SignUpNav>();
  const { signUp, isLoading } = useAuthStore();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

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

  const validate = () => {
    if (!name.trim()) return 'Please enter your name';
    if (!username.trim()) return 'Please enter a username';
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (!email.trim() || !email.includes('@')) return 'Please enter a valid email';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return '';
  };

  const handleSignUp = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      await signUp(name.trim(), username.trim().toLowerCase(), email.trim(), password);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      const msg = e?.response?.data?.detail;
      if (typeof msg === 'string') setError(msg);
      else if (Array.isArray(msg)) setError(msg[0]?.msg || 'Registration failed');
      else setError('Registration failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <Image
          source={{ uri: 'https://image.tmdb.org/t/p/w780/tmU7GeKVybMWFButWEGl2M4GeiP.jpg' }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <LinearGradient
          colors={['rgba(7,7,9,0.4)', 'rgba(7,7,9,0.7)', Colors.bg.void]}
          locations={[0, 0.4, 0.85]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

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
          <View style={styles.cardHeader}>
            <View style={styles.wordmarkSmall}>
              <Text style={styles.wordmarkCine} allowFontScaling={false}>CINE</Text>
              <View style={styles.aiPillSmall}>
                <Text style={styles.wordmarkAI} allowFontScaling={false}>AI</Text>
              </View>
            </View>
            <Text style={styles.title} allowFontScaling={false}>Join CineAI</Text>
            <Text style={styles.subtitle} allowFontScaling={false}>
              Create your account and start your cinematic journey
            </Text>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.semantic.error} />
              <Text style={styles.errorText} allowFontScaling={false}>{error}</Text>
            </View>
          )}

          <FloatingInput label="Full Name" value={name} onChangeText={setName} icon="person-outline" autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => usernameRef.current?.focus()} />
          <FloatingInput label="Username" value={username} onChangeText={setUsername} icon="at-outline" returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} inputRef={usernameRef} />
          <FloatingInput label="Email Address" value={email} onChangeText={setEmail} icon="mail-outline" keyboardType="email-address" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} inputRef={emailRef} />
          <FloatingInput label="Password" value={password} onChangeText={setPassword} icon="lock-closed-outline" secureTextEntry returnKeyType="next" onSubmitEditing={() => confirmRef.current?.focus()} inputRef={passwordRef} />
          <FloatingInput label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} icon="shield-checkmark-outline" secureTextEntry returnKeyType="done" onSubmitEditing={handleSignUp} inputRef={confirmRef} />

          <Pressable onPress={handleSignUp} disabled={isLoading} style={({ pressed }) => [styles.signUpBtn, pressed && styles.btnPressed]}>
            <LinearGradient colors={[Colors.accent.crimsonLight, Colors.accent.crimson]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.text.onAccent} />
              ) : (
                <View style={styles.btnContent}>
                  <Ionicons name="person-add-outline" size={18} color={Colors.text.onAccent} />
                  <Text style={styles.signUpText} allowFontScaling={false}>Create Account</Text>
                </View>
              )}
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.loginRow} onPress={() => navigation.navigate('Login')}>
            <Ionicons name="log-in-outline" size={15} color={Colors.accent.crimson} />
            <Text style={styles.loginPrompt} allowFontScaling={false}>Already have an account? </Text>
            <Text style={styles.loginLink} allowFontScaling={false}>Sign In</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.void },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 40, paddingTop: 100 },
  backBtn: { position: 'absolute', top: 56, left: 20, zIndex: 10 },
  backPill: { backgroundColor: Colors.glass.medium, borderRadius: Radius.full, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.glass.border },
  card: { backgroundColor: 'rgba(13,13,18,0.88)', borderRadius: Radius['2xl'], borderWidth: 1, borderColor: Colors.glass.border, padding: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 40, elevation: 20 },
  cardHeader: { marginBottom: 24 },
  wordmarkSmall: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  wordmarkCine: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, letterSpacing: 2 },
  aiPillSmall: { backgroundColor: Colors.accent.crimson, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  wordmarkAI: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: Colors.text.onAccent, letterSpacing: 1 },
  title: { fontSize: 28, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 20 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.semantic.errorMuted, borderRadius: Radius.md, borderWidth: 1, borderColor: `${Colors.semantic.error}33`, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16 },
  errorText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.semantic.error },
  signUpBtn: { borderRadius: Radius.lg, overflow: 'hidden', shadowColor: Colors.accent.crimson, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8, marginTop: 8, marginBottom: 24 },
  btnGradient: { paddingVertical: 18, alignItems: 'center' },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  signUpText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text.onAccent, letterSpacing: 0.5 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
  loginPrompt: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },
  loginLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.accent.crimson },
});

export default SignUpScreen;
