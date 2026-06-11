import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getApiKey } from './src/lib/auth';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './src/screens/LoginScreen';
import MainTabs from './src/screens/MainTabs';
import CheckInScreen from './src/screens/CheckInScreen';
import ScanScreen from './src/screens/ScanScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<'Login' | 'Dashboard' | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const key = await getApiKey();
      if (key) {
        setInitialRoute('Main');
      } else {
        setInitialRoute('Login');
      }
    };
    checkAuth();
  }, []);

  if (!initialRoute) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={DarkTheme}>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="CheckIn" component={CheckInScreen} />
          <Stack.Screen name="Scan" component={ScanScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
