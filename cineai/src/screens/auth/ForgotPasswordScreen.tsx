import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { forgotPassword } = useAuthStore();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) { setError('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email'); return; }
    setError('');
    setIsLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setIsSent(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[Colors.background, '#0F0F1A']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.emoji}>{isSent ? '📬' : '🔐'}</Text>
          <Text style={styles.title}>{isSent ? 'Check your inbox' : 'Forgot password?'}</Text>
          <Text style={styles.subtitle}>
            {isSent
              ? `We sent a password reset link to ${email}. Check your inbox and follow the link to reset your password.`
              : "No worries. Enter your email and we'll send you a reset link."}
          </Text>
        </View>

        {!isSent && (
          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={error}
              leftIcon={<Text style={styles.icon}>✉️</Text>}
            />
            <Button title="Send Reset Link" onPress={handleSend} isLoading={isLoading} size="lg" style={{ marginTop: Spacing.md }} />
          </View>
        )}

        {isSent && (
          <Button
            title="Back to Sign In"
            onPress={() => navigation.navigate('Login')}
            variant="secondary"
            size="lg"
          />
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Remember your password? </Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Sign In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: 40 },
  backBtn: { marginBottom: Spacing['2xl'] },
  backText: { color: Colors.textSecondary, fontSize: Typography.base, fontFamily: 'Inter_500Medium' },
  header: { marginBottom: Spacing['3xl'], alignItems: 'flex-start' },
  emoji: { fontSize: 48, marginBottom: Spacing.base },
  title: { fontSize: Typography['4xl'], fontFamily: 'Poppins_700Bold', color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: Spacing.sm },
  subtitle: { fontSize: Typography.base, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: Typography.base * 1.6 },
  form: { marginBottom: Spacing.xl },
  icon: { fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing['2xl'] },
  footerText: { color: Colors.textSecondary, fontSize: Typography.base, fontFamily: 'Inter_400Regular' },
  linkText: { color: Colors.primary, fontSize: Typography.base, fontFamily: 'Inter_600SemiBold' },
});

export default ForgotPasswordScreen;
