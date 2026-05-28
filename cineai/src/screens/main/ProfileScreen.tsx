/**
 * CineAI V3 — Redesigned Premium Profile Experience Rebuild
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  TextInput,
  Switch,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Radius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useWatchlistStore } from '../../store/watchlistStore';
import { useChatStore } from '../../store/chatStore';
import { useLanguageStore, LANGUAGES, LanguageCode } from '../../store/languageStore';

const GENRE_IDS: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 27: 'Horror', 10402: 'Music', 9648: 'Mystery',
  10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller', 10752: 'War', 37: 'Western',
};

const ALL_GENRES = Object.keys(GENRE_IDS).map(id => ({
  id: parseInt(id, 10),
  name: GENRE_IDS[parseInt(id, 10)],
}));

type PanelType =
  | 'main'
  | 'edit-profile'
  | 'notifications'
  | 'language'
  | 'genres'
  | 'ai-personality'
  | 'region'
  | 'faq'
  | 'support'
  | 'legal-privacy'
  | 'legal-terms';

interface SettingRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({ icon, label, value, onPress, danger }) => (
  <Pressable
    style={({ pressed }) => [st.settingRow, pressed && { opacity: 0.7 }]}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={[st.settingIcon, danger && { backgroundColor: 'rgba(230,57,70,0.1)' }]}>
      <Ionicons name={icon} size={18} color={danger ? Colors.semantic.error : '#E63946'} />
    </View>
    <Text style={[st.settingLabel, danger && { color: Colors.semantic.error }]} allowFontScaling={false}>
      {label}
    </Text>
    <View style={st.settingRight}>
      {value ? <Text style={st.settingValue} allowFontScaling={false}>{value}</Text> : null}
      {!danger && <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />}
    </View>
  </Pressable>
);

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { profile, user, isGuest, signOut, updateProfile } = useAuthStore();
  const { items } = useWatchlistStore();
  const { sessions } = useChatStore();
  const t = useLanguageStore(state => state.t);
  const { language, setLanguage } = useLanguageStore();

  const [activePanel, setActivePanel] = useState<PanelType>('main');

  // --- Edit Profile Form States ---
  const [fullName, setFullName] = useState(profile?.name || '');
  const [username, setUsername] = useState(user?.email?.split('@')?.[0] || 'cinephile');
  const [password, setPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editStatus, setEditStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // --- Notification Switch States ---
  const [notifRec, setNotifRec] = useState(true);
  const [notifTrending, setNotifTrending] = useState(true);
  const [notifUpcoming, setNotifUpcoming] = useState(true);
  const [notifAi, setNotifAi] = useState(true);
  const [notifWatchlist, setNotifWatchlist] = useState(true);
  const [notifAlerts, setNotifAlerts] = useState(false);

  // --- AI Personality Mode States ---
  const [aiPersonality, setAiPersonality] = useState('critic');

  // --- Content Region States ---
  const [contentRegion, setContentRegion] = useState('global');

  // --- FAQ Search States ---
  const [faqSearch, setFaqSearch] = useState('');

  // --- Support Form States ---
  const [supportCategory, setSupportCategory] = useState<'contact' | 'problem' | 'feedback'>('contact');
  const [supportEmail, setSupportEmail] = useState(user?.email || '');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [supportError, setSupportError] = useState('');

  // Load preferences from AsyncStorage on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const storedRec = await AsyncStorage.getItem('notifRec');
        if (storedRec !== null) setNotifRec(storedRec === 'true');
        
        const storedTrending = await AsyncStorage.getItem('notifTrending');
        if (storedTrending !== null) setNotifTrending(storedTrending === 'true');
        
        const storedUpcoming = await AsyncStorage.getItem('notifUpcoming');
        if (storedUpcoming !== null) setNotifUpcoming(storedUpcoming === 'true');
        
        const storedAi = await AsyncStorage.getItem('notifAi');
        if (storedAi !== null) setNotifAi(storedAi === 'true');
        
        const storedWatchlist = await AsyncStorage.getItem('notifWatchlist');
        if (storedWatchlist !== null) setNotifWatchlist(storedWatchlist === 'true');
        
        const storedAlerts = await AsyncStorage.getItem('notifAlerts');
        if (storedAlerts !== null) setNotifAlerts(storedAlerts === 'true');

        const storedPersonality = await AsyncStorage.getItem('aiPersonality');
        if (storedPersonality) setAiPersonality(storedPersonality);

        const storedRegion = await AsyncStorage.getItem('contentRegion');
        if (storedRegion) setContentRegion(storedRegion);

        const storedUsername = await AsyncStorage.getItem('customUsername');
        if (storedUsername) setUsername(storedUsername);
      } catch (e) {
        console.error('Failed to load preferences:', e);
      }
    };
    loadPreferences();
  }, []);

  const triggerHaptic = (style = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(style).catch(() => {});
  };

  const handleSignOut = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    await signOut();
  };

  // Save Edit Profile Changes
  const saveProfileEdits = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setEditStatus(null);

    if (fullName.trim().length < 2) {
      setEditStatus({ type: 'error', text: t('edit.errName') });
      return;
    }
    if (username.trim().length < 3) {
      setEditStatus({ type: 'error', text: t('edit.errUsername') });
      return;
    }
    if (password && password.length < 6) {
      setEditStatus({ type: 'error', text: t('edit.errPassword') });
      return;
    }

    setEditLoading(true);
    // Simulate API delay for premium feels
    setTimeout(async () => {
      try {
        await updateProfile({ name: fullName.trim() });
        await AsyncStorage.setItem('customUsername', username.trim());
        if (password) {
          await AsyncStorage.setItem('customPassword', password);
        }
        setEditStatus({ type: 'success', text: t('edit.success') });
        setPassword('');
      } catch (e) {
        setEditStatus({ type: 'error', text: 'An unexpected error occurred.' });
      } finally {
        setEditLoading(false);
      }
    }, 1200);
  };

  // Toggle Notification Switches
  const toggleNotification = async (key: string, value: boolean, setter: (val: boolean) => void) => {
    triggerHaptic();
    setter(value);
    await AsyncStorage.setItem(key, String(value));
  };

  // Save AI Personality Selection
  const savePersonality = async (mode: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setAiPersonality(mode);
    await AsyncStorage.setItem('aiPersonality', mode);
  };

  // Save Content Region Selection
  const saveRegion = async (region: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setContentRegion(region);
    await AsyncStorage.setItem('contentRegion', region);
  };

  // Toggle Favorite Genres Chips
  const toggleGenreSelection = async (genreId: number) => {
    triggerHaptic();
    const current = profile?.favorite_genres || [];
    let updated: number[];
    if (current.includes(genreId)) {
      updated = current.filter(id => id !== genreId);
    } else {
      updated = [...current, genreId];
    }
    await updateProfile({ favorite_genres: updated });
  };

  // Submit Support Desk Forms
  const handleSupportSubmit = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setSupportError('');

    if (!supportEmail.includes('@') || supportEmail.trim().length < 5) {
      setSupportError(t('support.error'));
      return;
    }
    if (supportSubject.trim().length < 3 || supportMessage.trim().length < 10) {
      setSupportError(t('support.error'));
      return;
    }

    setSupportLoading(true);
    // Simulate secure network submission
    setTimeout(() => {
      setSupportLoading(false);
      setSupportSuccess(true);
      setSupportSubject('');
      setSupportMessage('');
    }, 1400);
  };

  const handleLanguageChange = async (code: LanguageCode) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    await setLanguage(code);
  };

  // Helper variables
  const initial = (profile?.name?.[0] || 'G').toUpperCase();
  const displayName = profile?.name || 'Guest';
  const displayEmail = isGuest ? t('profile.badge.guest') : (user?.email || '');
  const activeGenres = (profile?.favorite_genres || []).map(id => GENRE_IDS[id]).filter(Boolean);

  // FAQ Topics array
  const faqTopics = [
    { id: 'q1', q: t('faq.q1'), a: t('faq.a1') },
    { id: 'q2', q: t('faq.q2'), a: t('faq.a2') },
    { id: 'q3', q: t('faq.q3'), a: t('faq.a3') },
    { id: 'q4', q: t('faq.q4'), a: t('faq.a4') },
    { id: 'q5', q: t('faq.q5'), a: t('faq.a5') },
    { id: 'q6', q: t('faq.q6'), a: t('faq.a6') },
    { id: 'q7', q: t('faq.q7'), a: t('faq.a7') },
  ];

  const filteredFaqs = faqTopics.filter(
    item =>
      item.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  // Accordion state tracker for FAQ
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    triggerHaptic();
    setOpenFaqId(openFaqId === id ? null : id);
  };

  // Dynamic values for UI rows
  const activeLangLabel = LANGUAGES.find(l => l.code === language)?.nativeLabel || 'English';
  const aiPersonalityLabel = t(`personality.${aiPersonality}.name`) || 'Cinematic Critic';
  const contentRegionLabel = t(`region.${contentRegion}`) || 'Global';

  // Render Sub-Panels
  const renderPanel = () => {
    switch (activePanel) {
      case 'edit-profile':
        return (
          <View style={st.panelContainer}>
            <View style={st.panelHeader}>
              <Pressable style={st.backBtn} onPress={() => { triggerHaptic(); setActivePanel('main'); setEditStatus(null); }}>
                <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
              </Pressable>
              <Text style={st.panelTitle} allowFontScaling={false}>{t('edit.title')}</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.panelScroll}>
              <View style={st.panelCard}>
                {editStatus && (
                  <View style={[st.statusBox, editStatus.type === 'error' ? st.statusErr : st.statusOk]}>
                    <Ionicons
                      name={editStatus.type === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                      size={20}
                      color={editStatus.type === 'error' ? Colors.semantic.error : Colors.semantic.success}
                    />
                    <Text style={[st.statusBoxText, editStatus.type === 'error' ? { color: Colors.semantic.error } : { color: Colors.semantic.success }]} allowFontScaling={false}>
                      {editStatus.text}
                    </Text>
                  </View>
                )}

                <View style={st.formGroup}>
                  <Text style={st.formLabel} allowFontScaling={false}>{t('edit.fullName')}</Text>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    style={st.formInput}
                    allowFontScaling={false}
                  />
                </View>

                <View style={st.formGroup}>
                  <Text style={st.formLabel} allowFontScaling={false}>{t('edit.username')}</Text>
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter your username"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    style={st.formInput}
                    autoCapitalize="none"
                    allowFontScaling={false}
                  />
                </View>

                <View style={st.formGroup}>
                  <Text style={st.formLabel} allowFontScaling={false}>{t('edit.password')}</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t('edit.newPassword')}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry
                    style={st.formInput}
                    allowFontScaling={false}
                  />
                </View>

                <Pressable
                  style={({ pressed }) => [st.primaryBtn, pressed && { opacity: 0.8 }, editLoading && { backgroundColor: 'rgba(230,57,70,0.5)' }]}
                  onPress={saveProfileEdits}
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <ActivityIndicator size="small" color={Colors.text.onAccent} />
                  ) : (
                    <Text style={st.primaryBtnText} allowFontScaling={false}>{t('edit.save')}</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        );

      case 'notifications':
        return (
          <View style={st.panelContainer}>
            <View style={st.panelHeader}>
              <Pressable style={st.backBtn} onPress={() => { triggerHaptic(); setActivePanel('main'); }}>
                <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
              </Pressable>
              <Text style={st.panelTitle} allowFontScaling={false}>{t('notif.title')}</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.panelScroll}>
              <Text style={st.panelDesc} allowFontScaling={false}>{t('notif.desc')}</Text>

              <View style={st.settingsGroup}>
                <View style={st.switchRow}>
                  <View style={st.switchCopy}>
                    <Text style={st.switchTitle} allowFontScaling={false}>{t('notif.rec')}</Text>
                    <Text style={st.switchDesc} allowFontScaling={false}>{t('notif.recDesc')}</Text>
                  </View>
                  <Switch
                    value={notifRec}
                    onValueChange={(val) => toggleNotification('notifRec', val, setNotifRec)}
                    trackColor={{ false: '#1C1C24', true: '#E63946' }}
                    thumbColor={Colors.text.primary}
                  />
                </View>

                <View style={st.switchRow}>
                  <View style={st.switchCopy}>
                    <Text style={st.switchTitle} allowFontScaling={false}>{t('notif.trending')}</Text>
                    <Text style={st.switchDesc} allowFontScaling={false}>{t('notif.trendingDesc')}</Text>
                  </View>
                  <Switch
                    value={notifTrending}
                    onValueChange={(val) => toggleNotification('notifTrending', val, setNotifTrending)}
                    trackColor={{ false: '#1C1C24', true: '#E63946' }}
                    thumbColor={Colors.text.primary}
                  />
                </View>

                <View style={st.switchRow}>
                  <View style={st.switchCopy}>
                    <Text style={st.switchTitle} allowFontScaling={false}>{t('notif.upcoming')}</Text>
                    <Text style={st.switchDesc} allowFontScaling={false}>{t('notif.upcomingDesc')}</Text>
                  </View>
                  <Switch
                    value={notifUpcoming}
                    onValueChange={(val) => toggleNotification('notifUpcoming', val, setNotifUpcoming)}
                    trackColor={{ false: '#1C1C24', true: '#E63946' }}
                    thumbColor={Colors.text.primary}
                  />
                </View>

                <View style={st.switchRow}>
                  <View style={st.switchCopy}>
                    <Text style={st.switchTitle} allowFontScaling={false}>{t('notif.ai')}</Text>
                    <Text style={st.switchDesc} allowFontScaling={false}>{t('notif.aiDesc')}</Text>
                  </View>
                  <Switch
                    value={notifAi}
                    onValueChange={(val) => toggleNotification('notifAi', val, setNotifAi)}
                    trackColor={{ false: '#1C1C24', true: '#E63946' }}
                    thumbColor={Colors.text.primary}
                  />
                </View>

                <View style={st.switchRow}>
                  <View style={st.switchCopy}>
                    <Text style={st.switchTitle} allowFontScaling={false}>{t('notif.watchlist')}</Text>
                    <Text style={st.switchDesc} allowFontScaling={false}>{t('notif.watchlistDesc')}</Text>
                  </View>
                  <Switch
                    value={notifWatchlist}
                    onValueChange={(val) => toggleNotification('notifWatchlist', val, setNotifWatchlist)}
                    trackColor={{ false: '#1C1C24', true: '#E63946' }}
                    thumbColor={Colors.text.primary}
                  />
                </View>

                <View style={st.switchRow}>
                  <View style={st.switchCopy}>
                    <Text style={st.switchTitle} allowFontScaling={false}>{t('notif.alerts')}</Text>
                    <Text style={st.switchDesc} allowFontScaling={false}>{t('notif.alertsDesc')}</Text>
                  </View>
                  <Switch
                    value={notifAlerts}
                    onValueChange={(val) => toggleNotification('notifAlerts', val, setNotifAlerts)}
                    trackColor={{ false: '#1C1C24', true: '#E63946' }}
                    thumbColor={Colors.text.primary}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        );

      case 'language':
        return (
          <View style={st.panelContainer}>
            <View style={st.panelHeader}>
              <Pressable style={st.backBtn} onPress={() => { triggerHaptic(); setActivePanel('main'); }}>
                <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
              </Pressable>
              <Text style={st.panelTitle} allowFontScaling={false}>{t('lang.title')}</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.panelScroll}>
              <Text style={st.panelDesc} allowFontScaling={false}>{t('lang.desc')}</Text>

              <View style={st.settingsGroup}>
                {LANGUAGES.map((langItem) => {
                  const selected = language === langItem.code;
                  return (
                    <Pressable
                      key={langItem.code}
                      style={[st.itemSelectRow, selected && st.itemSelectRowActive]}
                      onPress={() => handleLanguageChange(langItem.code)}
                    >
                      <View style={st.itemSelectCopy}>
                        <Text style={[st.itemSelectLabel, selected && st.itemSelectLabelActive]} allowFontScaling={false}>
                          {langItem.nativeLabel}
                        </Text>
                        <Text style={st.itemSelectSub} allowFontScaling={false}>{langItem.label}</Text>
                      </View>
                      {selected && <Ionicons name="checkmark-circle" size={20} color="#E63946" />}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        );

      case 'genres':
        return (
          <View style={st.panelContainer}>
            <View style={st.panelHeader}>
              <Pressable style={st.backBtn} onPress={() => { triggerHaptic(); setActivePanel('main'); }}>
                <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
              </Pressable>
              <Text style={st.panelTitle} allowFontScaling={false}>{t('genres.title')}</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.panelScroll}>
              <Text style={st.panelDesc} allowFontScaling={false}>{t('genres.desc')}</Text>

              <View style={st.genresEditCard}>
                <View style={st.genreChipsGrid}>
                  {ALL_GENRES.map((g) => {
                    const selected = (profile?.favorite_genres || []).includes(g.id);
                    return (
                      <Pressable
                        key={g.id}
                        style={[st.genreEditChip, selected && st.genreEditChipSelected]}
                        onPress={() => toggleGenreSelection(g.id)}
                      >
                        <Ionicons
                          name={selected ? 'checkmark' : 'add'}
                          size={14}
                          color={selected ? Colors.text.onAccent : '#E63946'}
                        />
                        <Text style={[st.genreEditChipText, selected && st.genreEditChipTextSelected]} allowFontScaling={false}>
                          {g.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable style={({ pressed }) => [st.primaryBtn, pressed && { opacity: 0.8 }, { marginTop: 24 }]} onPress={() => { triggerHaptic(); setActivePanel('main'); }}>
                  <Text style={st.primaryBtnText} allowFontScaling={false}>{t('genres.save')}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        );

      case 'ai-personality':
        return (
          <View style={st.panelContainer}>
            <View style={st.panelHeader}>
              <Pressable style={st.backBtn} onPress={() => { triggerHaptic(); setActivePanel('main'); }}>
                <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
              </Pressable>
              <Text style={st.panelTitle} allowFontScaling={false}>{t('personality.title')}</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.panelScroll}>
              <Text style={st.panelDesc} allowFontScaling={false}>{t('personality.desc')}</Text>

              <View style={st.optionsCol}>
                {['critic', 'friend', 'expert', 'hype', 'companion', 'nerd'].map((mode) => {
                  const selected = aiPersonality === mode;
                  return (
                    <Pressable
                      key={mode}
                      style={[st.optionCard, selected && st.optionCardSelected]}
                      onPress={() => savePersonality(mode)}
                    >
                      <View style={st.optionHeader}>
                        <View style={[st.optionDotRing, selected && st.optionDotRingActive]}>
                          {selected && <View style={st.optionDot} />}
                        </View>
                        <Text style={[st.optionName, selected && st.optionNameSelected]} allowFontScaling={false}>
                          {t(`personality.${mode}.name`)}
                        </Text>
                      </View>
                      <Text style={st.optionDesc} allowFontScaling={false}>{t(`personality.${mode}.desc`)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        );

      case 'region':
        return (
          <View style={st.panelContainer}>
            <View style={st.panelHeader}>
              <Pressable style={st.backBtn} onPress={() => { triggerHaptic(); setActivePanel('main'); }}>
                <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
              </Pressable>
              <Text style={st.panelTitle} allowFontScaling={false}>{t('region.title')}</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.panelScroll}>
              <Text style={st.panelDesc} allowFontScaling={false}>{t('region.desc')}</Text>

              <View style={st.settingsGroup}>
                {['global', 'us', 'in', 'jp', 'kr'].map((reg) => {
                  const selected = contentRegion === reg;
                  const regName = t(`region.${reg}`);
                  return (
                    <Pressable
                      key={reg}
                      style={[st.itemSelectRow, selected && st.itemSelectRowActive]}
                      onPress={() => saveRegion(reg)}
                    >
                      <Text style={[st.itemSelectLabel, selected && st.itemSelectLabelActive]} allowFontScaling={false}>
                        {regName}
                      </Text>
                      {selected && <Ionicons name="checkmark-circle" size={20} color="#E63946" />}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        );

      case 'faq':
        return (
          <View style={st.panelContainer}>
            <View style={st.panelHeader}>
              <Pressable style={st.backBtn} onPress={() => { triggerHaptic(); setActivePanel('main'); setFaqSearch(''); setOpenFaqId(null); }}>
                <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
              </Pressable>
              <Text style={st.panelTitle} allowFontScaling={false}>{t('faq.title')}</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={st.faqSearchBox}>
              <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" style={st.faqSearchIcon} />
              <TextInput
                value={faqSearch}
                onChangeText={setFaqSearch}
                placeholder={t('faq.search')}
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={st.faqSearchInput}
                allowFontScaling={false}
              />
              {faqSearch.length > 0 && (
                <Pressable onPress={() => { triggerHaptic(); setFaqSearch(''); }}>
                  <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.5)" />
                </Pressable>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.faqScroll}>
              {filteredFaqs.length === 0 ? (
                <View style={st.faqEmpty}>
                  <Ionicons name="alert-circle-outline" size={32} color="rgba(255,255,255,0.3)" />
                  <Text style={st.faqEmptyText} allowFontScaling={false}>No matching topics found.</Text>
                </View>
              ) : (
                filteredFaqs.map((item) => {
                  const isOpen = openFaqId === item.id;
                  return (
                    <View key={item.id} style={[st.faqItem, isOpen && st.faqItemOpen]}>
                      <Pressable style={st.faqRow} onPress={() => toggleFaq(item.id)}>
                        <Text style={[st.faqQuestion, isOpen && { color: Colors.text.primary }]} allowFontScaling={false}>
                          {item.q}
                        </Text>
                        <Ionicons
                          name={isOpen ? 'chevron-down' : 'chevron-forward'}
                          size={16}
                          color={isOpen ? Colors.text.primary : 'rgba(255,255,255,0.4)'}
                        />
                      </Pressable>
                      {isOpen && (
                        <View style={st.faqAnswerWrap}>
                          <Text style={st.faqAnswer} allowFontScaling={false}>{item.a}</Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        );

      case 'support':
        return (
          <View style={st.panelContainer}>
            <View style={st.panelHeader}>
              <Pressable style={st.backBtn} onPress={() => { triggerHaptic(); setActivePanel('main'); setSupportSuccess(false); setSupportError(''); }}>
                <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
              </Pressable>
              <Text style={st.panelTitle} allowFontScaling={false}>{t('support.title')}</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.panelScroll}>
              {supportSuccess ? (
                <View style={st.supportSuccessCard}>
                  <View style={st.supportSuccessIcon}>
                    <Ionicons name="checkmark" size={32} color={Colors.text.onAccent} />
                  </View>
                  <Text style={st.supportSuccessTitle} allowFontScaling={false}>Ticket Submitted!</Text>
                  <Text style={st.supportSuccessBody} allowFontScaling={false}>{t('support.success')}</Text>
                  <Pressable
                    style={({ pressed }) => [st.primaryBtn, pressed && { opacity: 0.8 }, { marginTop: 24, width: '100%' }]}
                    onPress={() => { triggerHaptic(); setSupportSuccess(false); setActivePanel('main'); }}
                  >
                    <Text style={st.primaryBtnText} allowFontScaling={false}>Done</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={st.panelCard}>
                  <Text style={st.supportDesc} allowFontScaling={false}>{t('support.desc')}</Text>

                  {supportError.length > 0 && (
                    <View style={[st.statusBox, st.statusErr]}>
                      <Ionicons name="alert-circle-outline" size={20} color={Colors.semantic.error} />
                      <Text style={[st.statusBoxText, { color: Colors.semantic.error }]} allowFontScaling={false}>
                        {supportError}
                      </Text>
                    </View>
                  )}

                  <View style={st.tabSelector}>
                    <Pressable
                      style={[st.tabItem, supportCategory === 'contact' && st.tabItemActive]}
                      onPress={() => { triggerHaptic(); setSupportCategory('contact'); }}
                    >
                      <Text style={[st.tabItemText, supportCategory === 'contact' && st.tabItemTextActive]} allowFontScaling={false}>
                        {t('support.contact')}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[st.tabItem, supportCategory === 'problem' && st.tabItemActive]}
                      onPress={() => { triggerHaptic(); setSupportCategory('problem'); }}
                    >
                      <Text style={[st.tabItemText, supportCategory === 'problem' && st.tabItemTextActive]} allowFontScaling={false}>
                        {t('support.report')}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[st.tabItem, supportCategory === 'feedback' && st.tabItemActive]}
                      onPress={() => { triggerHaptic(); setSupportCategory('feedback'); }}
                    >
                      <Text style={[st.tabItemText, supportCategory === 'feedback' && st.tabItemTextActive]} allowFontScaling={false}>
                        {t('support.feedback')}
                      </Text>
                    </Pressable>
                  </View>

                  <View style={st.formGroup}>
                    <Text style={st.formLabel} allowFontScaling={false}>{t('support.email')}</Text>
                    <TextInput
                      value={supportEmail}
                      onChangeText={setSupportEmail}
                      placeholder="Your active email"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      style={st.formInput}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      allowFontScaling={false}
                    />
                  </View>

                  <View style={st.formGroup}>
                    <Text style={st.formLabel} allowFontScaling={false}>{t('support.subject')}</Text>
                    <TextInput
                      value={supportSubject}
                      onChangeText={setSupportSubject}
                      placeholder="Summary of issue"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      style={st.formInput}
                      allowFontScaling={false}
                    />
                  </View>

                  <View style={st.formGroup}>
                    <Text style={st.formLabel} allowFontScaling={false}>{t('support.message')}</Text>
                    <TextInput
                      value={supportMessage}
                      onChangeText={setSupportMessage}
                      placeholder="Explain in details (minimum 10 characters)"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      style={[st.formInput, st.formTextarea]}
                      multiline
                      numberOfLines={5}
                      allowFontScaling={false}
                    />
                  </View>

                  <Pressable
                    style={({ pressed }) => [st.primaryBtn, pressed && { opacity: 0.8 }, supportLoading && { backgroundColor: 'rgba(230,57,70,0.5)' }]}
                    onPress={handleSupportSubmit}
                    disabled={supportLoading}
                  >
                    {supportLoading ? (
                      <ActivityIndicator size="small" color={Colors.text.onAccent} />
                    ) : (
                      <Text style={st.primaryBtnText} allowFontScaling={false}>{t('support.submit')}</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        );

      case 'legal-privacy':
        return (
          <View style={st.panelContainer}>
            <View style={st.panelHeader}>
              <Pressable style={st.backBtn} onPress={() => { triggerHaptic(); setActivePanel('main'); }}>
                <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
              </Pressable>
              <Text style={st.panelTitle} allowFontScaling={false}>{t('profile.row.privacy')}</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.panelScroll}>
              <View style={st.panelCard}>
                <Text style={st.legalTitle} allowFontScaling={false}>{t('support.legalTitle')}</Text>
                <Text style={st.legalText} allowFontScaling={false}>{t('support.privacyDesc')}</Text>
              </View>
            </ScrollView>
          </View>
        );

      case 'legal-terms':
        return (
          <View style={st.panelContainer}>
            <View style={st.panelHeader}>
              <Pressable style={st.backBtn} onPress={() => { triggerHaptic(); setActivePanel('main'); }}>
                <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
              </Pressable>
              <Text style={st.panelTitle} allowFontScaling={false}>{t('profile.row.terms')}</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.panelScroll}>
              <View style={st.panelCard}>
                <Text style={st.legalTitle} allowFontScaling={false}>{t('support.legalTitle')}</Text>
                <Text style={st.legalText} allowFontScaling={false}>{t('support.termsDesc')}</Text>
              </View>
            </ScrollView>
          </View>
        );

      default:
        return null;
    }
  };

  if (activePanel !== 'main') {
    return (
      <View style={[st.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg.void} />
        {renderPanel()}
      </View>
    );
  }

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg.void} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
        {/* Dynamic backdrop glows matching Home */}
        <View style={st.hero}>
          <LinearGradient
            colors={[Colors.accent.crimsonGlow, 'rgba(7,7,9,0)']}
            style={st.heroGlow}
          />

          <View style={st.avatarRing}>
            <View style={st.avatar}>
              <Text style={st.avatarText} allowFontScaling={false}>{initial}</Text>
            </View>
          </View>

          <View style={st.identityRow}>
            <Text style={st.name} allowFontScaling={false}>{displayName}</Text>
            <View style={[st.badgeBox, isGuest ? st.badgeGuest : st.badgePrem]}>
              <Ionicons name="sparkles" size={10} color={isGuest ? '#8E8E9F' : '#E63946'} />
              <Text style={[st.badgeText, isGuest ? { color: '#8E8E9F' } : { color: '#E63946' }]} allowFontScaling={false}>
                {isGuest ? t('profile.badge.guest') : t('profile.badge.premium')}
              </Text>
            </View>
          </View>
          <Text style={st.email} allowFontScaling={false}>{displayEmail}</Text>

          {isGuest && (
            <Pressable style={st.upgradeBanner}>
              <Ionicons name="sparkles" size={14} color="#E63946" />
              <Text style={st.upgradeText} allowFontScaling={false}>{t('auth.guestUpgrade')}</Text>
              <Ionicons name="chevron-forward" size={14} color="#E63946" />
            </Pressable>
          )}

          {/* Quick Access Stats Container */}
          <View style={st.statsRow}>
            <View style={st.stat}>
              <Text style={st.statNum} allowFontScaling={false}>{items.length}</Text>
              <Text style={st.statLabel} allowFontScaling={false}>{t('profile.stat.saved')}</Text>
            </View>
            <View style={st.statDivider} />
            <View style={st.stat}>
              <Text style={st.statNum} allowFontScaling={false}>{sessions.length}</Text>
              <Text style={st.statLabel} allowFontScaling={false}>{t('profile.stat.chats')}</Text>
            </View>
            <View style={st.statDivider} />
            <View style={st.stat}>
              <Text style={st.statNum} allowFontScaling={false}>{activeGenres.length || '—'}</Text>
              <Text style={st.statLabel} allowFontScaling={false}>{t('profile.stat.genres')}</Text>
            </View>
          </View>
        </View>

        {/* AI Taste Card Section */}
        <View style={st.section}>
          <View style={st.tasteCard}>
            <LinearGradient
              colors={['rgba(230,57,70,0.12)', 'rgba(64,123,255,0.03)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={st.tasteHeader}>
              <Ionicons name="sparkles" size={16} color="#E63946" />
              <Text style={st.tasteTitle} allowFontScaling={false}>{t('profile.taste.title')}</Text>
            </View>
            <Text style={st.tasteBody} allowFontScaling={false}>
              {profile?.ai_taste_profile || t('profile.taste.default')}
            </Text>
            {activeGenres.length > 0 && (
              <View style={st.genreChips}>
                {activeGenres.map(g => (
                  <View key={g} style={st.genreChip}>
                    <Text style={st.genreChipText} allowFontScaling={false}>{g}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Dynamic Settings Group 1: Account Ecosystem */}
        <View style={st.section}>
          <Text style={st.sectionTitle} allowFontScaling={false}>{t('profile.section.account')}</Text>
          <View style={st.settingsGroup}>
            <SettingRow icon="person-outline" label={t('profile.row.editProfile')} onPress={() => { triggerHaptic(); setActivePanel('edit-profile'); }} />
            <SettingRow icon="notifications-outline" label={t('profile.row.notifications')} onPress={() => { triggerHaptic(); setActivePanel('notifications'); }} />
            <SettingRow icon="language-outline" label={t('profile.row.language')} value={activeLangLabel} onPress={() => { triggerHaptic(); setActivePanel('language'); }} />
          </View>
        </View>

        {/* Dynamic Settings Group 2: Cinematic Preferences */}
        <View style={st.section}>
          <Text style={st.sectionTitle} allowFontScaling={false}>{t('profile.section.preferences')}</Text>
          <View style={st.settingsGroup}>
            <SettingRow icon="film-outline" label={t('profile.row.genres')} onPress={() => { triggerHaptic(); setActivePanel('genres'); }} />
            <SettingRow icon="sparkles-outline" label={t('profile.row.aiPersonality')} value={aiPersonalityLabel} onPress={() => { triggerHaptic(); setActivePanel('ai-personality'); }} />
            <SettingRow icon="globe-outline" label={t('profile.row.region')} value={contentRegionLabel} onPress={() => { triggerHaptic(); setActivePanel('region'); }} />
          </View>
        </View>

        {/* Dynamic Settings Group 3: Support */}
        <View style={st.section}>
          <Text style={st.sectionTitle} allowFontScaling={false}>{t('profile.section.support')}</Text>
          <View style={st.settingsGroup}>
            <SettingRow icon="help-circle-outline" label={t('profile.row.faq')} onPress={() => { triggerHaptic(); setActivePanel('faq'); }} />
            <SettingRow icon="mail-unread-outline" label={t('support.title')} onPress={() => { triggerHaptic(); setActivePanel('support'); }} />
            <SettingRow icon="document-text-outline" label={t('profile.row.privacy')} onPress={() => { triggerHaptic(); setActivePanel('legal-privacy'); }} />
            <SettingRow icon="shield-checkmark-outline" label={t('profile.row.terms')} onPress={() => { triggerHaptic(); setActivePanel('legal-terms'); }} />
          </View>
        </View>

        {/* Redesigned Centered Sign Out Button without Arrow Icon */}
        <View style={st.signOutContainer}>
          <Pressable
            style={({ pressed }) => [st.signOutButton, pressed && { opacity: 0.8 }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={18} color="#E63946" style={{ marginRight: 6 }} />
            <Text style={st.signOutButtonText} allowFontScaling={false}>{t('profile.row.signOut')}</Text>
          </Pressable>
          <Text style={st.signOutSubtext} allowFontScaling={false}>{t('profile.row.signOutSub')}</Text>
        </View>

        <Text style={st.version} allowFontScaling={false}>{t('profile.version')}</Text>
      </ScrollView>
    </View>
  );
};

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070709' },
  hero: { alignItems: 'center', paddingTop: 20, paddingBottom: 32, paddingHorizontal: 24, position: 'relative' },
  heroGlow: { position: 'absolute', top: -50, left: -40, right: -40, height: 280, borderRadius: 200 },
  avatarRing: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 2, borderColor: '#E63946',
    padding: 3, marginBottom: 16,
    shadowColor: '#E63946', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 8,
  },
  avatar: {
    flex: 1, borderRadius: 41,
    backgroundColor: 'rgba(230,57,70,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontFamily: 'Poppins_700Bold', color: '#E63946' },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  name: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  badgeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: Radius.full, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  badgePrem: {
    backgroundColor: 'rgba(230,57,70,0.1)', borderColor: 'rgba(230,57,70,0.3)',
  },
  badgeGuest: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase' },
  email: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, marginBottom: 16 },
  upgradeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(230,57,70,0.08)', borderRadius: Radius.lg,
    borderWidth: 1, borderColor: 'rgba(230,57,70,0.2)',
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
  },
  upgradeText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#E63946', flex: 1 },
  statsRow: {
    flexDirection: 'row', backgroundColor: '#0D0D12', borderRadius: Radius.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', paddingVertical: 16,
    width: '100%', marginTop: 8,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  statLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', color: Colors.text.tertiary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  section: { marginBottom: 24 },
  sectionTitle: { paddingHorizontal: 24, fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.tertiary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  tasteCard: {
    marginHorizontal: 20, borderRadius: Radius.xl, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden',
  },
  tasteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tasteTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  tasteBody: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 20, marginBottom: 12 },
  genreChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  genreChip: { backgroundColor: 'rgba(230,57,70,0.09)', borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(230,57,70,0.2)', paddingHorizontal: 10, paddingVertical: 4 },
  genreChipText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#E63946' },
  settingsGroup: { marginHorizontal: 20, backgroundColor: '#0D0D12', borderRadius: Radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  settingIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  settingLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.text.primary },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary },
  
  // Custom Centered Sign Out Button Styles
  signOutContainer: { alignItems: 'center', marginVertical: 16, paddingHorizontal: 20 },
  signOutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(230,57,70,0.25)',
    backgroundColor: 'rgba(230,57,70,0.08)', paddingVertical: 11, paddingHorizontal: 28,
  },
  signOutButtonText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#E63946' },
  signOutSubtext: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary, marginTop: 6, textAlign: 'center' },
  version: { textAlign: 'center', fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary, marginVertical: 12 },

  // --- Sub Panel Styles ---
  panelContainer: { flex: 1 },
  panelHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)', backgroundColor: '#070709',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)' },
  panelTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  panelScroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },
  panelDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 18, marginBottom: 20 },
  panelCard: { backgroundColor: '#0D0D12', borderRadius: Radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 20 },
  
  // Status Boxes
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: Radius.lg, marginBottom: 16 },
  statusErr: { backgroundColor: 'rgba(230,57,70,0.08)', borderWidth: 1, borderColor: 'rgba(230,57,70,0.2)' },
  statusOk: { backgroundColor: 'rgba(46,196,182,0.08)', borderWidth: 1, borderColor: 'rgba(46,196,182,0.2)' },
  statusBoxText: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },

  // Form Inputs
  formGroup: { marginBottom: 18 },
  formLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 1.0, marginBottom: 8 },
  formInput: {
    backgroundColor: '#13131A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.primary,
  },
  formTextarea: { minHeight: 90, textAlignVertical: 'top' },

  // Buttons
  primaryBtn: {
    backgroundColor: '#E63946', borderRadius: Radius.lg, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center', shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  primaryBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text.onAccent },

  // Switches
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)', gap: 12,
  },
  switchCopy: { flex: 1 },
  switchTitle: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.text.primary, marginBottom: 2 },
  switchDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary, lineHeight: 15 },

  // Select Item Rows
  itemSelectRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  itemSelectRowActive: { backgroundColor: 'rgba(230,57,70,0.03)' },
  itemSelectCopy: { flex: 1 },
  itemSelectLabel: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.text.primary },
  itemSelectLabelActive: { fontFamily: 'Inter_600SemiBold', color: '#E63946' },
  itemSelectSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary, marginTop: 2 },

  // Genres Edit Grid
  genresEditCard: { backgroundColor: '#0D0D12', borderRadius: Radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 16 },
  genreChipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genreEditChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#13131A', borderRadius: Radius.full, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 8,
  },
  genreEditChipSelected: {
    backgroundColor: '#E63946', borderColor: '#E63946',
  },
  genreEditChipText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.secondary },
  genreEditChipTextSelected: { color: Colors.text.onAccent, fontFamily: 'Inter_600SemiBold' },

  // AI Personality Cards
  optionsCol: { gap: 14 },
  optionCard: {
    backgroundColor: '#0D0D12', borderRadius: Radius.xl, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)', padding: 18,
  },
  optionCardSelected: {
    borderColor: 'rgba(230,57,70,0.5)', backgroundColor: 'rgba(230,57,70,0.02)',
  },
  optionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  optionDotRing: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  optionDotRingActive: { borderColor: '#E63946' },
  optionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E63946' },
  optionName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  optionNameSelected: { color: '#E63946' },
  optionDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 18, paddingLeft: 28 },

  // Help FAQ Center
  faqSearchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D0D12',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginHorizontal: 20,
    marginTop: 16, paddingHorizontal: 12, borderRadius: Radius.lg, height: 42,
  },
  faqSearchIcon: { marginRight: 8 },
  faqSearchInput: { flex: 1, color: Colors.text.primary, fontSize: 13, fontFamily: 'Inter_400Regular' },
  faqScroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
  faqItem: {
    backgroundColor: '#0D0D12', borderRadius: Radius.xl, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)', marginBottom: 12, overflow: 'hidden',
  },
  faqItemOpen: { borderColor: 'rgba(255,255,255,0.1)' },
  faqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  faqQuestion: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary, flex: 1, paddingRight: 12 },
  faqAnswerWrap: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.04)', paddingTop: 12 },
  faqAnswer: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 18 },
  faqEmpty: { alignItems: 'center', justifyContent: 'center', marginTop: 40, gap: 10 },
  faqEmptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary },

  // Support desk tabSelector
  tabSelector: { flexDirection: 'row', backgroundColor: '#13131A', borderRadius: Radius.lg, padding: 4, marginBottom: 18 },
  tabItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.md },
  tabItemActive: { backgroundColor: '#E63946' },
  tabItemText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.tertiary },
  tabItemTextActive: { color: Colors.text.onAccent },
  supportSuccessCard: { alignItems: 'center', padding: 24, backgroundColor: '#0D0D12', borderRadius: Radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  supportSuccessIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E63946', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  supportSuccessTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginBottom: 8 },
  supportSuccessBody: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, textAlign: 'center', lineHeight: 20 },
  supportDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 18, marginBottom: 16 },

  // Legal
  legalTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginBottom: 12 },
  legalText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 20 },
});

export default ProfileScreen;
