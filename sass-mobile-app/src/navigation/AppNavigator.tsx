import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, ScanLine, Clock } from 'lucide-react-native';
import { View, Text, ActivityIndicator } from 'react-native';

import LoginScreen        from '../screens/LoginScreen';
import DashboardScreen    from '../screens/DashboardScreen';
import CheckInScreen      from '../screens/CheckInScreen';
import PaymentScreen      from '../screens/PaymentScreen';
import HistoryScreen      from '../screens/HistoryScreen';
import TicketDetailScreen from '../screens/TicketDetailScreen';
import { colors }         from '../theme/colors';
import { useAuthStore }   from '../store/authStore';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Bottom Tab Navigator ──────────────────────────────────────────────────────
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.tabBar,
        borderTopColor: colors.border,
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarActiveTintColor:   colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{ tabBarIcon: ({ color }) => <Home color={color} size={24} /> }}
    />
    <Tab.Screen
      name="Scanner"
      component={PaymentScreen}
      options={{
        tabBarIcon: ({ color, focused }) => (
          <View style={{
            backgroundColor: focused ? colors.success : 'transparent',
            padding: 8, borderRadius: 8, marginTop: -5,
          }}>
            <ScanLine color={focused ? '#fff' : color} size={24} />
          </View>
        ),
        tabBarLabel: ({ color, focused }) => (
          <Text style={{ color: focused ? colors.success : color, fontSize: 10, marginTop: 4 }}>
            Scanner
          </Text>
        ),
      }}
    />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{ tabBarIcon: ({ color }) => <Clock color={color} size={24} /> }}
    />
  </Tab.Navigator>
);

// ── Root Navigator with auth gate ─────────────────────────────────────────────
export default function AppNavigator() {
  const { isAuthenticated, loadStoredUser } = useAuthStore();
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    loadStoredUser().finally(() => setBooting(false));
  }, []);

  if (booting) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
        initialRouteName={isAuthenticated ? 'MainTabs' : 'Login'}
      >
        <Stack.Screen name="Login"        component={LoginScreen} />
        <Stack.Screen name="MainTabs"     component={MainTabs} />
        <Stack.Screen name="CheckIn"      component={CheckInScreen} />
        <Stack.Screen name="Payment"      component={PaymentScreen} />
        <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
