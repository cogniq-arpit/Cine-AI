import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import type { AuthStackParamList } from '../../types';

const { width, height } = Dimensions.get('window');
type SignUpNav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

interface PremiumInputProps {
  icon: string;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  isPassword?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  autoComplete?: any;
  error?: string;
  hint?: string;
}

const PremiumInput: React.FC<PremiumInputProps> = ({
  icon,
  label,
  placeholder,
  value,
  onChangeText,
  isPassword = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  error,
  hint,
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const borderOpacity = useSharedValue(0);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(230, 57, 70, ${borderOpacity.value})`,
    borderWidth: 1 + borderOpacity.value * 0.5,
  }));

  const onFocus = () => {
    setFocused(true);
    borderOpacity.value = withTiming(0.9, { duration: 200 });
  };
  const onBlur = () => {
    setFocused(false);
    borderOpacity.value = withTiming(0, { duration: 200 });
  };

  return (
    <View style={{ marginBottom: error ? Spacing.xs : Spacing.md }}>
      <Text style={inputS.label}>{label}</Text>
      <Animated.View style={[inputS.container, borderStyle, error && inputS.errorBorder]}>
        <Ionicons
          name={icon as any}
          size={17}
          color={focused ? Colors.primary : Colors.textMuted}
          style={{ marginRight: Spacing.sm }}
        />
        <TextInput
          style={inputS.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {isPassword && (
          <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8} style={inputS.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={Colors.textMuted} />
          </Pressable>
        )}
      </Animated.View>
      {error ? (
        <View style={inputS.errorRow}>
          <Ionicons name="alert-circle-outline" size={12} color={Colors.error} />
          <Text style={inputS.errorText}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={inputS.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const inputS = StyleSheet.create({
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 54,
    paddingHorizontal: Spacing.md,
  },
  errorBorder: { borderColor: Colors.error },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontFamily: 'Inter_400Regular',
    height: '100%',
  },
  eyeBtn: { padding: Spacing.xs },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginLeft: Spacing.sm,
  },
  errorText: { color: Colors.error, fontSize: Typography.xs, fontFamily: 'Inter_500Medium' },
  hintText: { color: Colors.textMuted, fontSize: Typography.xs, fontFamily: 'Inter_400Regular', marginTop: 4, marginLeft: Spacing.sm },
});

// Password strength indicator
const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  const getStrength = () => {
    if (!password) return { level: 0, label: '', color: 'transparent' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score === 1) return { level: 1, label: 'Weak', color: Colors.error };
    if (score === 2) return { level: 2, label: 'Fair', color: Colors.warning };
    if (score === 3) return { level: 3, label: 'Good', color: Colors.gold };
    if (score === 4) return { level: 4, label: 'Strong', color: Colors.success };
    return { level: 0, label: '', color: 'transparent' };
  };

  const { level, label, color } = getStrength();
  if (!password) return null;

  return (
    <View style={passS.container}>
      <View style={passS.bars}>
        {[1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={[passS.bar, { backgroundColor: i <= level ? color : Colors.border }]}
          />
        ))}
      </View>
      <Text style={[passS.label, { color }]}>{label}</Text>
    </View>
  );
};

const passS = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 6, marginBottom: Spacing.xs },
  bars: { flexDirection: 'row', gap: 4, flex: 1 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  label: { fontSize: Typography.xs, fontFamily: 'Inter_600SemiBold', width: 40 },
});

const useShakeAnimation = () => {
  const shakeX = useSharedValue(0);
  const shake = () => {
    shakeX.value = withSequence(
      withTiming(10, { duration: 60 }), withTiming(-10, { duration: 60 }),
      withTiming(8, { duration: 60 }), withTiming(-8, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
  };
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  return { shake, style };
};

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<SignUpNav>();
  const { signUp, isLoading } = useAuthStore();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { shake, style: shakeStyle } = useShakeAnimation();

  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(30);
  useEffect(() => {
    contentOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
    contentY.value = withDelay(100, withSpring(0, { damping: 16 }));
  }, []);
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) newErrors.name = 'Full name must be at least 2 characters';
    if (!username.trim() || username.trim().length < 3) newErrors.username = 'Username must be at least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) newErrors.username = 'Username can only contain letters, numbers, and underscores';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!agreed) newErrors.terms = 'You must accept the terms to continue';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) {
      shake();
      return;
    }
    try {
      await signUp(name.trim(), username.trim().toLowerCase(), email.trim().toLowerCase(), password);
      navigation.navigate('Onboarding');
    } catch (err: any) {
      shake();
      Alert.alert('Registration Failed', err?.response?.data?.detail || 'Could not create account. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[Colors.background, '#0C0C14']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={15} style={styles.backBtn}>
          <View style={styles.backBtnInner}>
            <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
            <Text style={styles.backText}>Back</Text>
          </View>
        </Pressable>

        <Animated.View style={contentStyle}>
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.logoIcon}>
                <Ionicons name="film" size={14} color="#fff" />
              </LinearGradient>
              <Text style={styles.logoText}><Text style={styles.logoC}>C</Text>INE AI</Text>
            </View>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Join thousands discovering their next favorite film</Text>
          </View>

          {/* Progress indicator */}
          <View style={styles.progressRow}>
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, styles.progressDotActive]}>
                <Text style={styles.progressDotText}>1</Text>
              </View>
              <Text style={[styles.progressLabel, styles.progressLabelActive]}>Account</Text>
            </View>
            <View style={styles.progressLine} />
            <View style={styles.progressStep}>
              <View style={styles.progressDot}>
                <Text style={styles.progressDotText}>2</Text>
              </View>
              <Text style={styles.progressLabel}>Preferences</Text>
            </View>
          </View>

          {/* Form */}
          <Animated.View style={[styles.formCard, shakeStyle]}>
            <BlurView intensity={20} style={styles.formBlur} tint="dark">
              <View style={styles.formBorder} />
              <View style={styles.formContent}>
                <PremiumInput
                  icon="person-outline"
                  label="Full Name"
                  placeholder="Your full name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  error={errors.name}
                />
                <PremiumInput
                  icon="at-outline"
                  label="Username"
                  placeholder="Choose a username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  error={errors.username}
                  hint="Letters, numbers, and underscores only"
                />
                <PremiumInput
                  icon="mail-outline"
                  label="Email Address"
                  placeholder="your@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={errors.email}
                />
                <PremiumInput
                  icon="lock-closed-outline"
                  label="Password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  error={errors.password}
                />
                <PasswordStrength password={password} />
                <PremiumInput
                  icon="shield-checkmark-outline"
                  label="Confirm Password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                  error={errors.confirmPassword}
                />

                {/* Terms */}
                <Pressable onPress={() => setAgreed(prev => !prev)} style={styles.termsRow}>
                  <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                    {agreed && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                  </View>
                  <Text style={styles.termsText}>
                    I agree to the{' '}
                    <Text style={styles.termsLink}>Terms of Service</Text>
                    {' '}and{' '}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                </Pressable>
                {errors.terms && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={12} color={Colors.error} />
                    <Text style={styles.termsErrorText}>{errors.terms}</Text>
                  </View>
                )}

                {/* CTA */}
                <Pressable
                  onPress={handleSignUp}
                  disabled={isLoading}
                  style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.9 }, isLoading && { opacity: 0.7 }]}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.createBtnGradient}
                  >
                    {isLoading ? (
                      <Text style={styles.createBtnText}>Creating account...</Text>
                    ) : (
                      <>
                        <Text style={styles.createBtnText}>Create Account</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </BlurView>
          </Animated.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Login')} hitSlop={12}>
              <Text style={styles.linkText}>Sign In</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  glowTop: {
    position: 'absolute',
    top: -80,
    right: width * 0.1,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(108,99,255,0.07)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: height * 0.15,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(230,57,70,0.07)',
  },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: 40 },
  backBtn: { marginBottom: Spacing.xl },
  backBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  backText: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: 'Inter_500Medium' },
  header: { marginBottom: Spacing.xl },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  logoIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: Typography.lg, fontFamily: 'Poppins_700Bold', color: Colors.textPrimary, letterSpacing: 1 },
  logoC: { color: Colors.primary },
  title: { fontSize: Typography['4xl'], fontFamily: 'Poppins_700Bold', color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.base, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: Typography.base * 1.5 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  progressStep: { alignItems: 'center', gap: Spacing.xs },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  progressDotText: { color: Colors.white, fontSize: Typography.xs, fontFamily: 'Inter_700Bold' },
  progressLabel: { color: Colors.textMuted, fontSize: Typography.xs, fontFamily: 'Inter_500Medium' },
  progressLabelActive: { color: Colors.primary },
  progressLine: { flex: 1, height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.sm, marginBottom: Spacing.xl },
  formCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 12,
  },
  formBlur: { borderRadius: Radius.xl, overflow: 'hidden' },
  formBorder: { ...StyleSheet.absoluteFillObject, borderRadius: Radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  formContent: { padding: Spacing.xl, backgroundColor: 'rgba(15,15,25,0.5)' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginTop: Spacing.xs, marginBottom: Spacing.md },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  termsText: { flex: 1, color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: 'Inter_400Regular', lineHeight: Typography.sm * 1.5 },
  termsLink: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm, marginLeft: Spacing.sm },
  termsErrorText: { color: Colors.error, fontSize: Typography.xs, fontFamily: 'Inter_500Medium' },
  createBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginTop: Spacing.sm,
  },
  createBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: Spacing.sm,
  },
  createBtnText: { color: Colors.white, fontSize: Typography.lg, fontFamily: 'Inter_600SemiBold' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: Colors.textSecondary, fontSize: Typography.base, fontFamily: 'Inter_400Regular' },
  linkText: { color: Colors.primary, fontSize: Typography.base, fontFamily: 'Inter_600SemiBold' },
});

export default SignUpScreen;
