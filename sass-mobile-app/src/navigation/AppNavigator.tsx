import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, ScanLine, Clock, LogIn, LogOut, Settings2 } from 'lucide-react-native';
import { View, ActivityIndicator, Platform } from 'react-native';

import LoginScreen        from '../screens/LoginScreen';
import DashboardScreen    from '../screens/DashboardScreen';
import CheckInScreen      from '../screens/CheckInScreen';
import EntryScreen        from '../screens/EntryScreen';
import ExitScreen         from '../screens/ExitScreen';
import PaymentScreen      from '../screens/PaymentScreen';
import HistoryScreen      from '../screens/HistoryScreen';
import SettingsScreen     from '../screens/SettingsScreen';
import TicketDetailScreen from '../screens/TicketDetailScreen';
import { colors }         from '../theme/colors';
import { useAuthStore }   from '../store/authStore';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Shared tab bar options ────────────────────────────────────────────────────
const tabBarScreenOptions = {
  headerShown: false,
  tabBarStyle: {
    backgroundColor: colors.tabBar,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    paddingTop: 10,
    // Floating shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 16,
  },
  tabBarActiveTintColor:   colors.primary,
  tabBarInactiveTintColor: colors.textSecondary,
  tabBarLabelStyle: {
    fontSize: 10,
    fontWeight: '600' as const,
    marginTop: 2,
  },
};

// ── 🟢 ENTRY-only tabs: Entry Gate home + History ─────────────────────────────
const EntryTabs = () => (
  <Tab.Navigator screenOptions={tabBarScreenOptions}>
    <Tab.Screen
      name="EntryHome"
      component={EntryScreen}
      options={{
        tabBarLabel: 'Entry Gate',
        tabBarIcon: ({ color }) => <LogIn color={color} size={24} />,
      }}
    />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{
        tabBarLabel: 'History',
        tabBarIcon: ({ color }) => <Clock color={color} size={24} />,
      }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        tabBarLabel: 'Settings',
        tabBarIcon: ({ color }) => <Settings2 color={color} size={24} />,
      }}
    />
  </Tab.Navigator>
);

// ── 🔴 EXIT-only tabs: Exit Gate home + History ───────────────────────────────
const ExitTabs = () => (
  <Tab.Navigator screenOptions={tabBarScreenOptions}>
    <Tab.Screen
      name="ExitHome"
      component={ExitScreen}
      options={{
        tabBarLabel: 'Exit Gate',
        tabBarIcon: ({ color }) => <LogOut color={color} size={24} />,
      }}
    />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{
        tabBarLabel: 'History',
        tabBarIcon: ({ color }) => <Clock color={color} size={24} />,
      }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        tabBarLabel: 'Settings',
        tabBarIcon: ({ color }) => <Settings2 color={color} size={24} />,
      }}
    />
  </Tab.Navigator>
);

// ── 🔵 BOTH / OWNER tabs: Dashboard + Entry + Exit + History ─────────────────
const BothTabs = () => (
  <Tab.Navigator screenOptions={tabBarScreenOptions}>
    <Tab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{
        tabBarLabel: 'Overview',
        tabBarIcon: ({ color }) => <Home color={color} size={24} />,
      }}
    />
    <Tab.Screen
      name="EntryTab"
      component={EntryScreen}
      options={{
        tabBarLabel: 'Entry',
        tabBarIcon: ({ color }) => <LogIn color={color} size={24} />,
      }}
    />
    <Tab.Screen
      name="Scanner"
      component={PaymentScreen}
      options={{
        tabBarLabel: 'Scanner',
        tabBarIcon: ({ focused }) => (
          <View style={{
            width: 56,
            height: 56,
            backgroundColor: colors.primary,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: -32, // Floats above the tab bar
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 8,
          }}>
            <ScanLine color="#fff" size={26} />
          </View>
        ),
        tabBarLabelStyle: { marginTop: 4, fontSize: 10, fontWeight: 'bold' },
      }}
    />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{
        tabBarLabel: 'History',
        tabBarIcon: ({ color }) => <Clock color={color} size={24} />,
      }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        tabBarLabel: 'Settings',
        tabBarIcon: ({ color }) => <Settings2 color={color} size={24} />,
      }}
    />
  </Tab.Navigator>
);

// ── Pick the right tab navigator based on gate_assignment ─────────────────────
const MainTabs = () => {
  const { user } = useAuthStore();
  const assignment = user?.gate_assignment;

  if (assignment === 'ENTRY') return <EntryTabs />;
  if (assignment === 'EXIT')  return <ExitTabs />;
  return <BothTabs />;
};

// ── Root Navigator with auth gate ─────────────────────────────────────────────
export default function AppNavigator() {
  const { isAuthenticated, loadStoredUser } = useAuthStore();
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    loadStoredUser().finally(() => setBooting(false));
  }, [loadStoredUser]);

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
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade_from_bottom',
          presentation: 'card',
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs"     component={MainTabs} />
            <Stack.Screen name="CheckIn"      component={CheckInScreen} />
            <Stack.Screen name="Entry"        component={EntryScreen} />
            <Stack.Screen name="Exit"         component={ExitScreen} />
            <Stack.Screen name="Payment"      component={PaymentScreen} />
            <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
            <Stack.Screen name="Settings"     component={SettingsScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
