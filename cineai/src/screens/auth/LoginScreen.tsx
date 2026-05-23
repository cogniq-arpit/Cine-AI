import React, { useState, useRef, useEffect } from 'react';
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
  withRepeat,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import type { AuthStackParamList } from '../../types';

const { width, height } = Dimensions.get('window');
type LoginNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

// Premium animated input field
interface PremiumInputProps {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  isPassword?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  autoComplete?: any;
  error?: string;
}

const PremiumInput: React.FC<PremiumInputProps> = ({
  icon,
  placeholder,
  value,
  onChangeText,
  isPassword = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  error,
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const borderColor = useSharedValue(0);
  const labelOpacity = useSharedValue(value ? 1 : 0);
  const labelY = useSharedValue(value ? 0 : 10);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(230, 57, 70, ${borderColor.value})`,
    borderWidth: 1 + borderColor.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: labelY.value }],
  }));

  const onFocus = () => {
    setFocused(true);
    borderColor.value = withTiming(0.8, { duration: 200 });
    labelOpacity.value = withTiming(1, { duration: 200 });
    labelY.value = withSpring(0, { damping: 12 });
  };

  const onBlur = () => {
    setFocused(false);
    borderColor.value = withTiming(0, { duration: 200 });
    if (!value) {
      labelOpacity.value = withTiming(0, { duration: 200 });
      labelY.value = withTiming(10, { duration: 200 });
    }
  };

  return (
    <View style={{ marginBottom: error ? Spacing.xs : Spacing.base }}>
      <Animated.View style={[inputStyles.container, borderStyle, error && inputStyles.errorBorder]}>
        <View style={inputStyles.iconContainer}>
          <Ionicons name={icon as any} size={18} color={focused ? Colors.primary : Colors.textMuted} />
        </View>
        <View style={{ flex: 1 }}>
          {value ? (
            <Animated.Text style={[inputStyles.floatingLabel, labelStyle]}>
              {placeholder}
            </Animated.Text>
          ) : null}
          <TextInput
            style={[inputStyles.input, value && inputStyles.inputWithLabel]}
            placeholder={value ? '' : placeholder}
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
        </View>
        {isPassword && (
          <Pressable onPress={() => setShowPassword(!showPassword)} style={inputStyles.eyeBtn} hitSlop={8}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={Colors.textMuted}
            />
          </Pressable>
        )}
      </Animated.View>
      {error ? (
        <View style={inputStyles.errorRow}>
          <Ionicons name="alert-circle-outline" size={12} color={Colors.error} />
          <Text style={inputStyles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const inputStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 56,
    paddingHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  errorBorder: {
    borderColor: Colors.error,
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  floatingLabel: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontFamily: 'Inter_500Medium',
    marginBottom: 1,
  },
  input: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 0,
    flex: 1,
    height: 56,
  },
  inputWithLabel: {
    height: 38,
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginLeft: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.xs,
    fontFamily: 'Inter_500Medium',
  },
});

// Shake animation for invalid login
const useShakeAnimation = () => {
  const shakeX = useSharedValue(0);

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(12, { duration: 60 }),
      withTiming(-12, { duration: 60 }),
      withTiming(10, { duration: 60 }),
      withTiming(-10, { duration: 60 }),
      withTiming(6, { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
  };

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  return { shake, style };
};

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNav>();
  const { signIn, isLoading } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  const { shake, style: shakeStyle } = useShakeAnimation();

  // Entrance animations
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
    const newErrors: typeof errors = {};
    if (!identifier.trim()) newErrors.identifier = 'Username or Email is required';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) {
      shake();
      return;
    }
    try {
      await signIn(identifier.trim(), password);
    } catch (err: any) {
      shake();
      const message = err.response?.data?.detail || 'Invalid credentials. Please try again.';
      Alert.alert('Sign In Failed', message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background */}
      <LinearGradient
        colors={[Colors.background, '#0C0C14']}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient glow */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable onPress={() => navigation.goBack()} hitSlop={15} style={styles.backBtn}>
          <View style={styles.backBtnInner}>
            <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
            <Text style={styles.backText}>Back</Text>
          </View>
        </Pressable>

        <Animated.View style={contentStyle}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.logoIcon}
              >
                <Ionicons name="film" size={14} color="#fff" />
              </LinearGradient>
              <Text style={styles.logoText}>
                <Text style={styles.logoC}>C</Text>INE AI
              </Text>
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue your cinematic journey</Text>
          </View>

          {/* Form Glass Card */}
          <Animated.View style={[styles.formCard, shakeStyle]}>
            <BlurView intensity={20} style={styles.formCardBlur} tint="dark">
              <View style={styles.formCardBorder} />
              <View style={styles.formCardContent}>
                <PremiumInput
                  icon="person-outline"
                  placeholder="Username or Email"
                  value={identifier}
                  onChangeText={setIdentifier}
                  error={errors.identifier}
                  autoComplete="username"
                />
                <PremiumInput
                  icon="lock-closed-outline"
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  error={errors.password}
                  autoComplete="password"
                />

                {/* Forgot password */}
                <Pressable
                  onPress={() => navigation.navigate('ForgotPassword')}
                  hitSlop={12}
                  style={styles.forgotBtn}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>

                {/* Sign In Button */}
                <Pressable
                  onPress={handleSignIn}
                  disabled={isLoading}
                  style={({ pressed }) => [styles.signInBtn, pressed && { opacity: 0.9 }, isLoading && { opacity: 0.7 }]}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.signInBtnGradient}
                  >
                    {isLoading ? (
                      <Text style={styles.signInBtnText}>Signing in...</Text>
                    ) : (
                      <>
                        <Text style={styles.signInBtnText}>Sign In</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </BlurView>
          </Animated.View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Sign Up */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.linkText}>Create one free</Text>
            </Pressable>
          </View>

          {/* Guest */}
          <Pressable
            onPress={() => useAuthStore.getState().signInAsGuest()}
            hitSlop={15}
            style={styles.guestBtn}
          >
            <Ionicons name="eye-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.guestText}>Continue as Guest</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  glowTop: {
    position: 'absolute',
    top: -100,
    left: width * 0.3,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(108,99,255,0.06)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: height * 0.2,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(230,57,70,0.07)',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
    paddingBottom: 40,
  },
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
  backText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontFamily: 'Inter_500Medium',
  },
  header: { marginBottom: Spacing['2xl'] },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: Typography.lg,
    fontFamily: 'Poppins_700Bold',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  logoC: { color: Colors.primary },
  title: {
    fontSize: Typography['4xl'],
    fontFamily: 'Poppins_700Bold',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.base,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: Typography.base * 1.5,
  },
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
  formCardBlur: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  formCardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  formCardContent: {
    padding: Spacing.xl,
    backgroundColor: 'rgba(15,15,25,0.5)',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
    marginTop: -Spacing.xs,
  },
  forgotText: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontFamily: 'Inter_500Medium',
  },
  signInBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  signInBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: Spacing.sm,
  },
  signInBtnText: {
    color: Colors.white,
    fontSize: Typography.lg,
    fontFamily: 'Inter_600SemiBold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
    gap: Spacing.md,
  },
  divider: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontFamily: 'Inter_400Regular',
  },
  linkText: {
    color: Colors.primary,
    fontSize: Typography.base,
    fontFamily: 'Inter_600SemiBold',
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  guestText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'underline',
    textDecorationColor: Colors.textMuted,
  },
});

export default LoginScreen;
