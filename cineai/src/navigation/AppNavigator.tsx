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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Motion, Radius } from '../constants/theme';

// ─── Screen Imports ────────────────────────────────────────────────────────
import { HomeScreen } from '../screens/main/HomeScreen';
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
import type { MainTabParamList, AuthStackParamList, RootStackParamList } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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
  const scale = useSharedValue(1);
  const dotScale = useSharedValue(focused ? 1 : 0);
  const dotOpacity = useSharedValue(focused ? 1 : 0);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotOpacity.value,
  }));

  React.useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withSpring(1.2, Motion.springs.snappy),
        withSpring(1.0, Motion.springs.snappy)
      );
      dotScale.value = withSpring(1, Motion.springs.bounce);
      dotOpacity.value = withTiming(1, { duration: 150 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } else {
      scale.value = withSpring(1, Motion.springs.gentle);
      dotScale.value = withSpring(0, Motion.springs.snappy);
      dotOpacity.value = withTiming(0, { duration: 100 });
    }
  }, [focused]);

  return (
    <Animated.View style={[tabStyles.iconContainer, containerStyle]}>
      <Ionicons
        name={focused ? iconFocused : icon}
        size={21}
        color={focused ? Colors.accent.crimson : Colors.text.tertiary}
      />
      <Text
        style={[tabStyles.label, focused && tabStyles.labelFocused]}
        numberOfLines={1}
        allowFontScaling={false}
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
    gap: 3,
    paddingTop: 6,
    width: 68,
    minHeight: 52,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: Colors.text.tertiary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  labelFocused: {
    color: Colors.accent.crimson,
    fontFamily: 'Inter_600SemiBold',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent.crimson,
    marginTop: 1,
    shadowColor: Colors.accent.crimson,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
});

// ─── AI Center Tab Button ──────────────────────────────────────────────────
const AITabButton: React.FC<{ focused: boolean; onPress: () => void }> = ({
  focused,
  onPress,
}) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(focused ? 1 : 0.4);
  const ringScale = useSharedValue(1);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  React.useEffect(() => {
    if (focused) {
      glowOpacity.value = withTiming(1, { duration: 250 });
      // Subtle breathing ring animation
      const pulse = () => {
        ringScale.value = withSequence(
          withTiming(1.15, { duration: 1200 }),
          withTiming(1, { duration: 1200 })
        );
      };
      pulse();
    } else {
      glowOpacity.value = withTiming(0.4, { duration: 200 });
      ringScale.value = withSpring(1, Motion.springs.gentle);
    }
  }, [focused]);

  const handlePressIn = () => {
    scale.value = withSpring(0.88, Motion.springs.snappy);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Motion.springs.bounce);
  };

  return (
    <Animated.View style={[aiTabStyles.outerContainer, containerStyle]}>
      {/* Glow ring */}
      <Animated.View style={[aiTabStyles.glowRing, glowStyle]} />
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[aiTabStyles.btn, focused && aiTabStyles.btnFocused]}
        accessibilityRole="button"
        accessibilityLabel="CineAI Chat"
      >
        <Ionicons
          name="sparkles"
          size={11}
          color={focused ? Colors.text.onAccent : Colors.accent.crimsonLight}
        />
        <Text
          style={[aiTabStyles.btnText, focused && aiTabStyles.btnTextFocused]}
          allowFontScaling={false}
        >
          CINE AI
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const aiTabStyles = StyleSheet.create({
  outerContainer: {
    top: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 92,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: Colors.accent.crimson,
    backgroundColor: 'transparent',
  },
  btn: {
    flexDirection: 'row',
    width: 82,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.bg.raised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.accent.crimsonMuted,
    shadowColor: Colors.accent.crimson,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    gap: 4,
  },
  btnFocused: {
    backgroundColor: Colors.accent.crimson,
    borderColor: Colors.accent.crimsonLight,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  btnText: {
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    color: Colors.accent.crimsonLight,
    letterSpacing: 0.5,
  },
  btnTextFocused: {
    color: Colors.text.onAccent,
  },
});

// ─── Main Tab Navigator ────────────────────────────────────────────────────
const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 20 : 10,
          left: 20,
          right: 20,
          height: 56,
          borderRadius: Radius['3xl'],
          borderWidth: 1,
          borderColor: Colors.glass.border,
          backgroundColor:
            Platform.OS === 'ios'
              ? 'rgba(13,13,18,0.5)'
              : 'rgba(13,13,18,0.92)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 8,
          paddingBottom: 0,
          borderTopWidth: 0,
          overflow: 'hidden',
        },
        tabBarBackground: () => (
          <BlurView
            intensity={Platform.OS === 'ios' ? 50 : 0}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarShowLabel: false,
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
              label="Home"
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="search-outline"
              iconFocused="search"
              label="Search"
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
              label="Saved"
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
              label="Profile"
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
