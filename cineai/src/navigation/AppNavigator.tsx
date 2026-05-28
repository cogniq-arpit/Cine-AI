import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  Dimensions,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Motion, Radius } from '../constants/theme';

// ─── Screen Imports ────────────────────────────────────────────────────────
import { HomeScreen } from '../screens/main/HomeScreen';
import { ExploreScreen } from '../screens/main/ExploreScreen';
import { SearchScreen } from '../screens/main/SearchScreen';
import { AIChatScreen } from '../screens/main/AIChatScreen';
import { WatchlistScreen } from '../screens/main/WatchlistScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { MovieDetailsScreen } from '../screens/MovieDetailsScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import type { MainTabParamList, AuthStackParamList, RootStackParamList } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NAV_BAR_WIDTH = Math.min(SCREEN_WIDTH - (SCREEN_WIDTH < 360 ? 24 : 32), 370);
const NAV_BAR_LEFT = Math.max((SCREEN_WIDTH - NAV_BAR_WIDTH) / 2, 12);
const NAV_BAR_INSET = SCREEN_WIDTH < 360 ? 7 : 10;
const NAV_TAB_SLOT_WIDTH = Math.floor((NAV_BAR_WIDTH - NAV_BAR_INSET * 2) / 5);
const AI_TAB_WIDTH = Math.min(76, Math.max(66, NAV_TAB_SLOT_WIDTH + 8));
const Tab = createBottomTabNavigator<MainTabParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

// ─── Tab Icon Component ────────────────────────────────────────────────────
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  icon: IoniconName;
  iconFocused: IoniconName;
  label: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ icon, iconFocused, label, focused }) => {
  const scale = useSharedValue(focused ? 1.03 : 1);
  const translateY = useSharedValue(focused ? -1.5 : 0);
  const dotScale = useSharedValue(focused ? 1 : 0);
  const dotOpacity = useSharedValue(focused ? 1 : 0);
  const capsuleOpacity = useSharedValue(focused ? 1 : 0);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotOpacity.value,
  }));

  const capsuleStyle = useAnimatedStyle(() => ({
    opacity: capsuleOpacity.value,
    transform: [{ scale: withSpring(focused ? 1 : 0.8, Motion.springs.snappy) }],
  }));

  React.useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withSpring(1.07, Motion.springs.snappy),
        withSpring(1.03, Motion.springs.snappy)
      );
      translateY.value = withSpring(-1.5, Motion.springs.snappy);
      dotScale.value = withSpring(1, Motion.springs.bounce);
      dotOpacity.value = withTiming(1, { duration: 150 });
      capsuleOpacity.value = withTiming(1, { duration: 200 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } else {
      scale.value = withSpring(1, Motion.springs.gentle);
      translateY.value = withSpring(0, Motion.springs.gentle);
      dotScale.value = withSpring(0, Motion.springs.snappy);
      dotOpacity.value = withTiming(0, { duration: 100 });
      capsuleOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [focused]);

  return (
    <Animated.View style={[tabStyles.iconContainer, containerStyle]}>
      <View style={tabStyles.iconWrapper}>
        {/* Ambient glassmorphic glowing capsule underlay centered exactly behind the icon */}
        <Animated.View style={[tabStyles.activeCapsule, capsuleStyle]} />
        <Ionicons
          name={focused ? iconFocused : icon}
          size={20}
          color={focused ? Colors.text.primary : Colors.text.tertiary}
        />
      </View>
      <Text
        style={[
          tabStyles.label,
          focused ? tabStyles.labelFocused : tabStyles.labelUnfocused
        ]}
        numberOfLines={1}
        allowFontScaling={false}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {label}
      </Text>
      <Animated.View style={[tabStyles.activeDot, dotStyle]} />
    </Animated.View>
  );
};

const tabStyles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: NAV_TAB_SLOT_WIDTH,
    height: 54,
    position: 'relative',
  },
  iconWrapper: {
    width: 42,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeCapsule: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 13,
    backgroundColor: 'rgba(230, 57, 70, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.18)',
    shadowColor: Colors.accent.crimson,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  label: {
    fontSize: 9.2,
    lineHeight: 12,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginTop: 1,
    width: NAV_TAB_SLOT_WIDTH,
  },
  labelFocused: {
    color: Colors.text.primary,
    fontFamily: 'Inter_600SemiBold',
    opacity: 1,
  },
  labelUnfocused: {
    color: Colors.text.tertiary,
    opacity: 0.75,
  },
  activeDot: {
    width: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.accent.crimson,
    marginTop: 1,
    shadowColor: Colors.accent.crimson,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
});

// ─── AI Center Tab Button ──────────────────────────────────────────────────
const AITabButton: React.FC<{ focused: boolean; onPress: () => void }> = ({
  focused,
  onPress,
}) => {
  const scale = useSharedValue(focused ? 1.05 : 1);
  const t = useLanguageStore(state => state.t);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: withTiming(focused ? 0.8 : 0.4, { duration: 250 }),
    shadowRadius: withTiming(focused ? 12 : 6, { duration: 250 }),
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, Motion.springs.snappy);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const handlePressOut = () => {
    scale.value = withSpring(focused ? 1.05 : 1, Motion.springs.bounce);
  };

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.05 : 1, Motion.springs.snappy);
  }, [focused]);

  return (
    <Animated.View style={[aiTabStyles.outerContainer, containerStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={t('tab.aiChat')}
        style={StyleSheet.absoluteFill}
      >
        <LinearGradient
          colors={
            focused
              ? ['#FF5563', '#E63946', '#C1121F']
              : ['#1E1E28', '#12121A']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            aiTabStyles.btn,
            focused ? aiTabStyles.btnFocused : aiTabStyles.btnUnfocused,
          ]}
        >
          {/* Subtle top inner reflection border */}
          <View style={aiTabStyles.innerHighlight} />
          
          <Text
            style={[
              aiTabStyles.btnText,
              focused ? aiTabStyles.btnTextFocused : aiTabStyles.btnTextUnfocused,
            ]}
            allowFontScaling={false}
          >
            {t('tab.aiChat')}
          </Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const aiTabStyles = StyleSheet.create({
  outerContainer: {
    top: 11, // Perfectly centers the Cine AI button vertically within the tab bar
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    height: 34,
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 2 },
  },
  btn: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  btnFocused: {
    borderWidth: 1,
    borderColor: '#FF7F8C',
  },
  btnUnfocused: {
    borderWidth: 1.5,
    borderColor: 'rgba(230, 57, 70, 0.28)',
  },
  innerHighlight: {
    position: 'absolute',
    top: 1,
    left: 4,
    right: 4,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: Radius.full,
  },
  btnText: {
    fontSize: 9.5,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
  btnTextFocused: {
    color: Colors.text.onAccent,
  },
  btnTextUnfocused: {
    color: Colors.accent.crimsonLight,
  },
});

// ─── Main Tab Navigator ────────────────────────────────────────────────────
const MainTabNavigator: React.FC = () => {
  const t = useLanguageStore(state => state.t);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 14,
          left: 20,
          right: 20,
          height: 60,
          borderRadius: Radius['3xl'],
          borderWidth: 1,
          borderColor: 'rgba(230, 57, 70, 0.12)', // Subtle crimson glowing border
          backgroundColor: '#0D0D12', // Solid OLED deep background
          shadowColor: '#E63946', // OLED soft crimson underglow
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.16,
          shadowRadius: 20,
          elevation: 10,
          paddingBottom: 0,
          borderTopWidth: 0,
          overflow: 'hidden',
        },
        tabBarBackground: () => null,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          paddingHorizontal: 0,
          marginHorizontal: 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="home-outline"
              iconFocused="home"
              label={t('tab.home')}
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="compass-outline"
              iconFocused="compass"
              label={t('tab.explore')}
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="AIChat"
        component={AIChatScreen}
        options={({ navigation }) => ({
          tabBarIcon: ({ focused }) => (
            <AITabButton
              focused={focused}
              onPress={() => navigation.navigate('AIChat')}
            />
          ),
        })}
      />
      <Tab.Screen
        name="Watchlist"
        component={WatchlistScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="bookmark-outline"
              iconFocused="bookmark"
              label={t('tab.saved')}
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="person-outline"
              iconFocused="person"
              label={t('tab.profile')}
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// ─── Auth Stack ────────────────────────────────────────────────────────────
const AuthNavigator: React.FC = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'fade',
      contentStyle: { backgroundColor: Colors.bg.void },
    }}
    initialRouteName="Welcome"
  >
    <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
    <AuthStack.Screen
      name="Login"
      component={LoginScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <AuthStack.Screen
      name="SignUp"
      component={SignUpScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <AuthStack.Screen
      name="ForgotPassword"
      component={ForgotPasswordScreen}
      options={{ animation: 'slide_from_bottom' }}
    />
    <AuthStack.Screen
      name="Onboarding"
      component={OnboardingScreen}
      options={{ animation: 'fade' }}
    />
  </AuthStack.Navigator>
);

// ─── Root Navigator ────────────────────────────────────────────────────────
const RootNavigator: React.FC = () => {
  const { isAuthenticated, hasCompletedOnboarding } = useAuthStore();

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: Colors.bg.void },
      }}
    >
      {!isAuthenticated ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : !hasCompletedOnboarding ? (
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <RootStack.Screen name="Main" component={MainTabNavigator} />
          <RootStack.Screen
            name="Search"
            component={SearchScreen}
            options={{
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: Colors.bg.void },
            }}
          />
          <RootStack.Screen
            name="MovieDetails"
            component={MovieDetailsScreen}
            options={{
              animation: 'slide_from_bottom',
              contentStyle: { backgroundColor: Colors.bg.void },
            }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
};

// ─── App Navigator ─────────────────────────────────────────────────────────
export const AppNavigator: React.FC = () => (
  <NavigationContainer>
    <RootNavigator />
  </NavigationContainer>
);

export default AppNavigator;
