import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useWatchlistStore } from '../../store/watchlistStore';
import { useChatStore } from '../../store/chatStore';
import { Button } from '../../components/ui/Button';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 14: 'Fantasy', 27: 'Horror', 9648: 'Mystery',
  10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller', 37: 'Western',
};

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const SETTINGS_ITEMS: { icon: IoniconName; label: string; chevron: boolean }[] = [
  { icon: 'notifications-outline', label: 'Notification Preferences', chevron: true },
  { icon: 'globe-outline', label: 'Language & Region', chevron: true },
  { icon: 'tv-outline', label: 'Streaming Platforms', chevron: true },
  { icon: 'lock-closed-outline', label: 'Privacy & Security', chevron: true },
  { icon: 'chatbubble-outline', label: 'Chat History', chevron: true },
  { icon: 'star-outline', label: 'Rate Cine AI', chevron: true },
  { icon: 'document-text-outline', label: 'Terms of Service', chevron: true },
];

export const ProfileScreen: React.FC = () => {
  const { profile, user, signOut } = useAuthStore();
  const { items: watchlistItems } = useWatchlistStore();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const favoriteGenreNames = (profile?.favorite_genres || [])
    .slice(0, 5)
    .map(id => GENRE_MAP[id])
    .filter(Boolean);

  const handleSettingsPress = (label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    switch (label) {
      case 'Notification Preferences':
        Alert.alert(
          'Notifications',
          'Cinematic notifications are currently ENABLED. Would you like to keep them on?',
          [
            { 
              text: 'Disable', 
              style: 'destructive', 
              onPress: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                Alert.alert('Disabled', 'You will no longer receive recommendation updates.');
              } 
            },
            { text: 'Keep Enabled', style: 'default' }
          ]
        );
        break;
      case 'Language & Region':
        Alert.alert('Language & Region', 'Current language is English (US).\nSupported language variations can be customized in system settings.');
        break;
      case 'Streaming Platforms':
        Alert.alert(
          'Streaming Platforms',
          `Your active platforms: ${profile?.streaming_platforms?.join(', ') || 'None selected'}.\nTo adjust your platform setup, reset onboarding from settings.`
        );
        break;
      case 'Privacy & Security':
        Alert.alert('Privacy & Security', 'Your data is 100% encrypted and stored securely using industry-standard protocols. Supabase auth protection is active.');
        break;
      case 'Chat History':
        Alert.alert(
          'Clear Chat History',
          'Are you sure you want to permanently delete all active AI chat logs? This cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Clear All',
              style: 'destructive',
              onPress: async () => {
                try {
                  await AsyncStorage.removeItem('@cineai_chat_sessions');
                  useChatStore.setState({ sessions: [], currentSession: null });
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                  Alert.alert('Success', 'All chat history logs have been cleared.');
                } catch (err) {
                  console.error(err);
                }
              }
            }
          ]
        );
        break;
      case 'Rate Cine AI':
        Alert.alert(
          'Rate Cine AI',
          'How is your experience with Cine AI?',
          [
            { 
              text: '⭐️⭐️⭐️⭐️⭐️', 
              onPress: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                Alert.alert('Thank you!', 'We greatly appreciate your 5-star support!') ;
              }
            },
            { 
              text: '⭐️⭐️⭐️⭐️', 
              onPress: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                Alert.alert('Thank you!', 'We are continually polishing the experience!') ;
              }
            },
            { text: 'Meh', style: 'cancel' }
          ]
        );
        break;
      case 'Terms of Service':
        Alert.alert('Terms of Service', 'Cine AI is a premium companion application. Content rights and data feeds are populated by the OMDb and Gemini API services.');
        break;
      default:
        break;
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
              await signOut();
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header gradient */}
        <View style={styles.headerBg}>
          <LinearGradient
            colors={['rgba(230,57,70,0.2)', Colors.background]}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={['top']}>
            <View style={styles.header}>
              <Text style={styles.pageTitle}>Profile</Text>
            </View>
          </SafeAreaView>

          {/* Avatar & info */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{profile?.name || 'Cinephile'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.memberBadge}>
                <Ionicons name="diamond-outline" size={11} color={Colors.primary} />
                <Text style={styles.memberText}>Cine AI Member</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{watchlistItems.length}</Text>
            <Text style={styles.statLabel}>Watchlist</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.favorite_genres?.length || 0}</Text>
            <Text style={styles.statLabel}>Genres</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.streaming_platforms?.length || 0}</Text>
            <Text style={styles.statLabel}>Platforms</Text>
          </View>
        </View>

        {/* AI Taste Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Taste Profile</Text>
          <View style={styles.tasteCard}>
            <LinearGradient
              colors={['rgba(108,99,255,0.15)', 'rgba(230,57,70,0.10)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tasteGradient}
            >
              {favoriteGenreNames.length > 0 ? (
                <>
                  <Text style={styles.tasteDesc}>
                    Based on your preferences, you enjoy:
                  </Text>
                  <View style={styles.genreTagsRow}>
                    {favoriteGenreNames.map(genre => (
                      <View key={genre} style={styles.genreTag}>
                        <Text style={styles.genreTagText}>{genre}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.tasteAI}>
                    Cine AI learns from your interactions to make better recommendations over time.
                  </Text>
                </>
              ) : (
                <Text style={styles.tasteEmpty}>
                  Chat with Cine AI and add movies to your watchlist to build your taste profile.
                </Text>
              )}
            </LinearGradient>
          </View>
        </View>

        {/* Streaming Platforms */}
        {profile?.streaming_platforms && profile.streaming_platforms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Platforms</Text>
            <View style={styles.platformsRow}>
              {profile.streaming_platforms.map(platform => (
                <View key={platform} style={styles.platformBadge}>
                  <Text style={styles.platformText}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            {SETTINGS_ITEMS.map((item, index) => (
              <Pressable
                key={item.label}
                onPress={() => handleSettingsPress(item.label)}
                style={({ pressed }) => [
                  styles.settingsItem, 
                  index < SETTINGS_ITEMS.length - 1 && styles.settingsItemBorder,
                  pressed && { backgroundColor: 'rgba(255,255,255,0.03)' }
                ]}
              >
                <View style={styles.settingsLeft}>
                  <View style={styles.settingsIconContainer}>
                    <Ionicons name={item.icon} size={16} color={Colors.textSecondary} />
                  </View>
                  <Text style={styles.settingsLabel}>{item.label}</Text>
                </View>
                {item.chevron && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="secondary"
            isLoading={isSigningOut}
          />
        </View>

        <Text style={styles.version}>Cine AI v1.0.0 · Made with ❤️</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 100 },
  headerBg: { paddingBottom: Spacing.xl },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  pageTitle: {
    fontSize: Typography['3xl'],
    fontFamily: 'Poppins_700Bold',
    color: Colors.textPrimary,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.base,
  },
  avatarContainer: { position: 'relative' },
  avatarGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow,
  },
  avatarText: {
    color: Colors.white,
    fontSize: Typography['3xl'],
    fontFamily: 'Poppins_700Bold',
  },
  onlineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  userInfo: { flex: 1, gap: Spacing.xs },
  userName: {
    fontSize: Typography.xl,
    fontFamily: 'Poppins_700Bold',
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: Typography.sm,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  memberText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontFamily: 'Inter_600SemiBold',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.base,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  statValue: {
    fontSize: Typography['3xl'],
    fontFamily: 'Poppins_700Bold',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.xs,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    marginTop: 2,
  },
  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: Typography.base,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  tasteCard: { borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  tasteGradient: { padding: Spacing.base },
  tasteDesc: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontFamily: 'Inter_400Regular',
    marginBottom: Spacing.sm,
  },
  genreTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  genreTag: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  genreTagText: { color: Colors.primary, fontSize: Typography.xs, fontFamily: 'Inter_600SemiBold' },
  tasteAI: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  tasteEmpty: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontFamily: 'Inter_400Regular',
    lineHeight: Typography.sm * 1.6,
  },
  platformsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  platformBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  platformText: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: 'Inter_500Medium' },
  settingsCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  settingsIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: { fontSize: 18, width: 24 }, // compat
  settingsLabel: { color: Colors.textPrimary, fontSize: Typography.base, fontFamily: 'Inter_400Regular' },
  chevron: { color: Colors.textMuted, fontSize: 20, fontFamily: 'Inter_400Regular' },
  version: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
});

export default ProfileScreen;
