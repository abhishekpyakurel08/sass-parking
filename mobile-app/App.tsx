import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getApiKey } from './src/lib/auth';
import { brandingService } from './src/lib/branding';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './src/screens/LoginScreen';
import MainTabs from './src/screens/MainTabs';
import CheckInScreen from './src/screens/CheckInScreen';
import ScanScreen from './src/screens/ScanScreen';
import TicketDetailScreen from './src/screens/TicketDetailScreen';
import PaymentReceiptScreen from './src/screens/PaymentReceiptScreen';
import ManualExitScreen from './src/screens/ManualExitScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<'Login' | 'Main' | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const key = await getApiKey();
      if (key) {
        setInitialRoute('Main');
        // Fetch tenant branding when authenticated
        await brandingService.fetchBranding();
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
          <Stack.Screen name="ManualExit" component={ManualExitScreen} />
          <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
          <Stack.Screen name="PaymentReceipt" component={PaymentReceiptScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
