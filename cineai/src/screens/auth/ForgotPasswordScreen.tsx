/**
 * CineAI V3 — ForgotPasswordScreen
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, KeyboardAvoidingView,
  Platform, TextInput, ActivityIndicator, StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Motion } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { forgotPassword, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const cardY = useSharedValue(40);
  const cardOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const cardStyle = useAnimatedStyle(() => ({ opacity: cardOpacity.value, transform: [{ translateY: cardY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  useEffect(() => {
    backdropOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    cardOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    cardY.value = withDelay(300, withSpring(0, Motion.springs.gentle));
  }, []);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email'); return; }
    setError('');
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <Image
          source={{ uri: 'https://image.tmdb.org/t/p/w780/1E5baAaEse26fej7uHcjOgEE2t2.jpg' }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <LinearGradient
          colors={['rgba(7,7,9,0.5)', 'rgba(7,7,9,0.75)', Colors.bg.void]}
          locations={[0, 0.4, 0.85]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
        <View style={styles.backPill}>
          <Ionicons name="chevron-back" size={18} color={Colors.text.primary} />
        </View>
      </Pressable>

      <View style={styles.content}>
        <Animated.View style={[styles.card, cardStyle]}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-open-outline" size={28} color={Colors.accent.crimson} />
          </View>
          <Text style={styles.title} allowFontScaling={false}>Reset Password</Text>
          <Text style={styles.subtitle} allowFontScaling={false}>
            Enter your email and we'll send recovery instructions.
          </Text>

          {sent ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.semantic.success} />
              <Text style={styles.successText} allowFontScaling={false}>
                Recovery email sent. Check your inbox.
              </Text>
            </View>
          ) : (
            <>
              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText} allowFontScaling={false}>{error}</Text>
                </View>
              )}

              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={Colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  placeholderTextColor={Colors.text.tertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  selectionColor={Colors.accent.crimson}
                  allowFontScaling={false}
                />
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={isLoading}
                style={({ pressed }) => [styles.btn, pressed && { opacity: 0.88 }]}
              >
                <LinearGradient
                  colors={[Colors.accent.crimsonLight, Colors.accent.crimson]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.btnGrad}
                >
                  {isLoading
                    ? <ActivityIndicator size="small" color={Colors.text.onAccent} />
                    : (
                      <View style={styles.btnContent}>
                        <Ionicons name="mail-unread-outline" size={18} color={Colors.text.onAccent} />
                        <Text style={styles.btnText} allowFontScaling={false}>Send Reset Email</Text>
                      </View>
                    )
                  }
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
  root: { flex: 1, backgroundColor: Colors.bg.void },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  backBtn: { position: 'absolute', top: 56, left: 20, zIndex: 10 },
  backPill: {
    backgroundColor: Colors.glass.medium, borderRadius: Radius.full,
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.glass.border,
  },
  card: {
    backgroundColor: 'rgba(13,13,18,0.88)', borderRadius: Radius['2xl'],
    borderWidth: 1, borderColor: Colors.glass.border, padding: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5, shadowRadius: 40, elevation: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.accent.crimsonMuted, borderWidth: 1, borderColor: `${Colors.accent.crimson}40`,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  title: { fontSize: 26, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginBottom: 8 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  errorBox: {
    backgroundColor: Colors.semantic.errorMuted, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, width: '100%',
  },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.semantic.error },
  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.semantic.successMuted, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 14, width: '100%',
  },
  successText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.semantic.success },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.glass.subtle, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.glass.border,
    paddingHorizontal: 16, height: 56, width: '100%', marginBottom: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.text.primary },
  btn: { width: '100%', borderRadius: Radius.lg, overflow: 'hidden' },
  btnGrad: { paddingVertical: 18, alignItems: 'center' },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text.onAccent },
});

export default ForgotPasswordScreen;
