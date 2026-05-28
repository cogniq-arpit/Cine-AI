import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

LogBox.ignoreLogs([
  'TMDB request failed or is blocked',
  '[expo-av]: Expo AV has been deprecated',
]);
LogBox.ignoreAllLogs(true);
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import * as SplashScreenLib from 'expo-splash-screen';
import { Colors } from './src/constants/theme';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SplashScreen } from './src/screens/SplashScreen';
import { useAuthStore } from './src/store/authStore';
import { useBackendStatusStore } from './src/store/backendStatusStore';
import { useLanguageStore } from './src/store/languageStore';

SplashScreenLib.preventAutoHideAsync();

export default function App() {
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const { loadSession, isLoading } = useAuthStore();
  const { initializeStatus } = useBackendStatusStore();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreenLib.hideAsync();
      initializeStatus();
      useLanguageStore.getState().loadLanguage().catch(() => {});
      loadSession();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const handleSplashFinish = () => {
    setShowCustomSplash(false);
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.background} />
        {showCustomSplash ? (
          <SplashScreen onFinish={handleSplashFinish} />
        ) : (
          <AppNavigator />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
