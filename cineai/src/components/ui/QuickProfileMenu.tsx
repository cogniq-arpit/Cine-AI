import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Typography } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

interface QuickProfileMenuProps {
  visible: boolean;
  onClose: () => void;
  topOffset?: number;
}

export const QuickProfileMenu: React.FC<QuickProfileMenuProps> = ({
  visible,
  onClose,
  topOffset = 82,
}) => {
  const { profile, user, isGuest, signOut } = useAuthStore();

  const initial = (profile?.name?.[0] || 'G').toUpperCase();
  const displayName = profile?.name || (isGuest ? 'Guest' : 'CineAI User');
  const displayEmail = isGuest ? 'guest@cineai.app' : (user?.email || 'account@cineai.app');

  const handleLogout = async () => {
    onClose();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    await signOut();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.menu, { top: topOffset }]}>
          <View style={styles.identityRow}>
            <View style={styles.avatarWrap}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  transition={120}
                />
              ) : (
                <Text style={styles.avatarText} allowFontScaling={false}>
                  {initial}
                </Text>
              )}
            </View>

            <View style={styles.identityTextWrap}>
              <Text style={styles.name} numberOfLines={1} allowFontScaling={false}>
                {displayName}
              </Text>
              <Text style={styles.email} numberOfLines={1} allowFontScaling={false}>
                {displayEmail}
              </Text>
            </View>
          </View>

          <Pressable style={styles.menuAction} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={16} color={Colors.semantic.error} />
            <Text style={styles.logoutText} allowFontScaling={false}>Log out</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7,7,9,0.38)',
  },
  menu: {
    position: 'absolute',
    right: 16,
    width: 252,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(18,18,26,0.96)',
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(230,57,70,0.55)',
    backgroundColor: 'rgba(230,57,70,0.18)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  avatarText: {
    color: Colors.accent.crimson,
    fontSize: 14,
    fontFamily: Typography.fontDisplay,
  },
  identityTextWrap: {
    flex: 1,
  },
  name: {
    color: Colors.text.primary,
    fontSize: 14,
    fontFamily: Typography.fontSemiBold,
  },
  email: {
    marginTop: 2,
    color: Colors.text.secondary,
    fontSize: 11.5,
    fontFamily: Typography.fontPrimary,
  },
  menuAction: {
    minHeight: 38,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    color: Colors.semantic.error,
    fontSize: 12,
    fontFamily: Typography.fontSemiBold,
  },
});

export default QuickProfileMenu;
