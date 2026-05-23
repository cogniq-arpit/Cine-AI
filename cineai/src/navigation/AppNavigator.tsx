import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';
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

const Tab = createBottomTabNavigator<MainTabParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

// ─── Tab Icon Component ────────────────────────────────────────────────────
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TabIcon: React.FC<{
  icon: IoniconName;
  iconFocused: IoniconName;
  label: string;
  focused: boolean;
}> = ({ icon, iconFocused, label, focused }) => {
  const scale = useSharedValue(focused ? 1.1 : 1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, { damping: 12, stiffness: 300 });
  }, [focused]);

  return (
    <Animated.View style={[tabStyles.iconContainer, style]}>
      <Ionicons
        name={focused ? iconFocused : icon}
        size={22}
        color={focused ? Colors.primary : Colors.textMuted}
      />
      <Text style={[tabStyles.label, focused && tabStyles.labelFocused]} numberOfLines={1}>
        {label}
      </Text>
      {focused && <View style={tabStyles.activeDot} />}
    </Animated.View>
  );
};

const tabStyles = StyleSheet.create({
  iconContainer: { alignItems: 'center', gap: 2, paddingTop: 6, width: 75 },
  label: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  labelFocused: { color: Colors.primary },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 1,
  },
});

// ─── Bottom Tab Navigator ──────────────────────────────────────────────────
const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : Colors.backgroundSecondary,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
          ) : null,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="home-outline" iconFocused="home" label="Home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="search-outline" iconFocused="search" label="Search" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="AIChat"
        component={AIChatScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center' }}>
              <View style={[aiTabStyles.aiBtn, focused && aiTabStyles.aiBtnFocused]}>
                <Ionicons
                  name="sparkles"
                  size={22}
                  color={focused ? Colors.primary : Colors.textSecondary}
                />
              </View>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Watchlist"
        component={WatchlistScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="bookmark-outline" iconFocused="bookmark" label="Saved" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="person-outline" iconFocused="person" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const aiTabStyles = StyleSheet.create({
  aiBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginTop: -8,
  },
  aiBtnFocused: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
});

// ─── Auth Stack ────────────────────────────────────────────────────────────
const AuthNavigator: React.FC = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
    initialRouteName="Welcome"
  >
    <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
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
            options={{ animation: 'slide_from_bottom' }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
};

// ─── App Navigator with NavigationContainer ────────────────────────────────
export const AppNavigator: React.FC = () => (
  <NavigationContainer>
    <RootNavigator />
  </NavigationContainer>
);

export default AppNavigator;
