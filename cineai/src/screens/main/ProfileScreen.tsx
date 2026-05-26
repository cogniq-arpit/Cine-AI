/**
 * CineAI V3 — ProfileScreen
 */
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useWatchlistStore } from '../../store/watchlistStore';
import { useChatStore } from '../../store/chatStore';

const GENRE_LABELS: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 27: 'Horror', 10402: 'Music', 9648: 'Mystery',
  10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller', 10752: 'War', 37: 'Western',
};

interface SettingRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  showArrow?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({ icon, label, value, onPress, danger, showArrow = true }) => (
  <Pressable
    style={({ pressed }) => [st.settingRow, pressed && { opacity: 0.7 }]}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={[st.settingIcon, danger && { backgroundColor: Colors.semantic.errorMuted }]}>
      <Ionicons name={icon} size={18} color={danger ? Colors.semantic.error : Colors.text.secondary} />
    </View>
    <Text style={[st.settingLabel, danger && { color: Colors.semantic.error }]} allowFontScaling={false}>
      {label}
    </Text>
    <View style={st.settingRight}>
      {value ? <Text style={st.settingValue} allowFontScaling={false}>{value}</Text> : null}
      {showArrow && !danger && <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />}
    </View>
  </Pressable>
);

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { profile, user, isGuest, signOut } = useAuthStore();
  const { items } = useWatchlistStore();
  const { sessions } = useChatStore();

  const initial = (profile?.name?.[0] || 'G').toUpperCase();
  const displayName = profile?.name || 'Guest';
  const displayEmail = isGuest ? 'Browsing as Guest' : (user?.email || '');

  const handleSignOut = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    await signOut();
  };

  const genres = (profile?.favorite_genres || [])
    .slice(0, 5)
    .map(id => GENRE_LABELS[id])
    .filter(Boolean);

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg.void} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero header */}
        <View style={st.hero}>
          <LinearGradient
            colors={[Colors.accent.crimsonGlow, 'rgba(7,7,9,0)']}
            style={st.heroGlow}
          />

          {/* Avatar */}
          <View style={st.avatarRing}>
            <View style={st.avatar}>
              <Text style={st.avatarText} allowFontScaling={false}>{initial}</Text>
            </View>
          </View>

          <Text style={st.name} allowFontScaling={false}>{displayName}</Text>
          <Text style={st.email} allowFontScaling={false}>{displayEmail}</Text>

          {isGuest && (
            <Pressable style={st.upgradeBanner}>
              <Ionicons name="sparkles" size={14} color={Colors.accent.gold} />
              <Text style={st.upgradeText} allowFontScaling={false}>
                Create an account to save your progress
              </Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.accent.gold} />
            </Pressable>
          )}

          {/* Stats row */}
          <View style={st.statsRow}>
            <View style={st.stat}>
              <Text style={st.statNum} allowFontScaling={false}>{items.length}</Text>
              <Text style={st.statLabel} allowFontScaling={false}>Saved</Text>
            </View>
            <View style={st.statDivider} />
            <View style={st.stat}>
              <Text style={st.statNum} allowFontScaling={false}>{sessions.length}</Text>
              <Text style={st.statLabel} allowFontScaling={false}>AI Chats</Text>
            </View>
            <View style={st.statDivider} />
            <View style={st.stat}>
              <Text style={st.statNum} allowFontScaling={false}>{genres.length || '—'}</Text>
              <Text style={st.statLabel} allowFontScaling={false}>Genres</Text>
            </View>
          </View>
        </View>

        {/* AI Taste card */}
        <View style={st.section}>
          <View style={st.tasteCard}>
            <LinearGradient
              colors={[Colors.accent.crimsonMuted, Colors.accent.electricMuted]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={st.tasteHeader}>
              <Ionicons name="sparkles" size={16} color={Colors.accent.crimson} />
              <Text style={st.tasteTitle} allowFontScaling={false}>AI Taste Profile</Text>
            </View>
            <Text style={st.tasteBody} allowFontScaling={false}>
              {profile?.ai_taste_profile || 'Your AI taste profile grows as you explore and chat with CineAI.'}
            </Text>
            {genres.length > 0 && (
              <View style={st.genreChips}>
                {genres.map(g => (
                  <View key={g} style={st.genreChip}>
                    <Text style={st.genreChipText} allowFontScaling={false}>{g}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Settings */}
        <View style={st.section}>
          <Text style={st.sectionTitle} allowFontScaling={false}>Account</Text>
          <View style={st.settingsGroup}>
            <SettingRow icon="person-outline" label="Edit Profile" onPress={() => {}} />
            <SettingRow icon="notifications-outline" label="Notifications" onPress={() => {}} />
            <SettingRow icon="language-outline" label="Language" value="English" onPress={() => {}} />
          </View>
        </View>

        <View style={st.section}>
          <Text style={st.sectionTitle} allowFontScaling={false}>Preferences</Text>
          <View style={st.settingsGroup}>
            <SettingRow icon="film-outline" label="Favorite Genres" onPress={() => {}} />
            <SettingRow icon="sparkles-outline" label="AI Personality" value="Cinematic" onPress={() => {}} />
            <SettingRow icon="globe-outline" label="Content Region" value="Global" onPress={() => {}} />
          </View>
        </View>

        <View style={st.section}>
          <Text style={st.sectionTitle} allowFontScaling={false}>Support</Text>
          <View style={st.settingsGroup}>
            <SettingRow icon="help-circle-outline" label="Help & FAQ" onPress={() => {}} />
            <SettingRow icon="document-text-outline" label="Privacy Policy" onPress={() => {}} />
            <SettingRow icon="shield-checkmark-outline" label="Terms of Service" onPress={() => {}} />
          </View>
        </View>

        {/* Sign out */}
        <View style={[st.section, { paddingHorizontal: 20 }]}>
          <Pressable
            style={({ pressed }) => [st.signOutBtn, pressed && { opacity: 0.75 }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={18} color={Colors.semantic.error} />
            <Text style={st.signOutText} allowFontScaling={false}>Sign Out</Text>
          </Pressable>
        </View>

        <Text style={st.version} allowFontScaling={false}>CineAI v3.0 — Powered by Gemini AI</Text>
      </ScrollView>
    </View>
  );
};

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.void },
  hero: { alignItems: 'center', paddingTop: 20, paddingBottom: 32, paddingHorizontal: 24, position: 'relative' },
  heroGlow: { position: 'absolute', top: -40, left: -40, right: -40, height: 300, borderRadius: 200 },
  avatarRing: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 2, borderColor: Colors.accent.crimson,
    padding: 3, marginBottom: 16,
    shadowColor: Colors.accent.crimson, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 8,
  },
  avatar: {
    flex: 1, borderRadius: 45,
    backgroundColor: Colors.accent.crimsonMuted, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 36, fontFamily: 'Poppins_700Bold', color: Colors.accent.crimson },
  name: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginBottom: 4 },
  email: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, marginBottom: 16 },
  upgradeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.accent.goldMuted, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: `${Colors.accent.gold}40`,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
  },
  upgradeText: { flex: 1, fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.accent.gold },
  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.bg.raised, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.glass.border, paddingVertical: 16,
    width: '100%', marginTop: 8,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  statLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.text.tertiary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.glass.border },
  section: { marginBottom: 24 },
  sectionTitle: { paddingHorizontal: 24, fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.text.tertiary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  tasteCard: {
    marginHorizontal: 20, borderRadius: Radius.xl, padding: 20,
    borderWidth: 1, borderColor: Colors.glass.border, overflow: 'hidden',
  },
  tasteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tasteTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  tasteBody: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 22, marginBottom: 12 },
  genreChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  genreChip: { backgroundColor: Colors.accent.crimsonMuted, borderRadius: Radius.full, borderWidth: 1, borderColor: `${Colors.accent.crimson}40`, paddingHorizontal: 10, paddingVertical: 4 },
  genreChipText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.accent.crimson },
  settingsGroup: { marginHorizontal: 20, backgroundColor: Colors.bg.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.glass.border, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.glass.border },
  settingIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.bg.raised, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.text.primary },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: `${Colors.semantic.error}40`,
    backgroundColor: Colors.semantic.errorMuted, paddingVertical: 16,
  },
  signOutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.semantic.error },
  version: { textAlign: 'center', fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary, marginBottom: 8 },
});

export default ProfileScreen;
