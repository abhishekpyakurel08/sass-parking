import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, ScanLine, Clock, LogIn, LogOut } from 'lucide-react-native';
import { View, ActivityIndicator, Platform } from 'react-native';

import LoginScreen        from '../screens/LoginScreen';
import DashboardScreen    from '../screens/DashboardScreen';
import CheckInScreen      from '../screens/CheckInScreen';
import EntryScreen        from '../screens/EntryScreen';
import ExitScreen         from '../screens/ExitScreen';
import PaymentScreen      from '../screens/PaymentScreen';
import HistoryScreen      from '../screens/HistoryScreen';
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
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingTop: 12,
  },
  tabBarActiveTintColor:   colors.primary,
  tabBarInactiveTintColor: colors.textSecondary,
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
        tabBarIcon: ({ color, focused }) => (
          <View style={{
            backgroundColor: focused ? colors.success : 'transparent',
            padding: 6, borderRadius: 8, marginTop: -4,
          }}>
            <LogIn color={focused ? '#fff' : color} size={22} />
          </View>
        ),
        tabBarLabelStyle: { marginTop: 2 },
      }}
    />
    <Tab.Screen
      name="ExitTab"
      component={ExitScreen}
      options={{
        tabBarLabel: 'Exit',
        tabBarIcon: ({ color, focused }) => (
          <View style={{
            backgroundColor: focused ? '#EF4444' : 'transparent',
            padding: 6, borderRadius: 8, marginTop: -4,
          }}>
            <LogOut color={focused ? '#fff' : color} size={22} />
          </View>
        ),
        tabBarLabelStyle: { marginTop: 2 },
      }}
    />
    <Tab.Screen
      name="Scanner"
      component={PaymentScreen}
      options={{
        tabBarLabel: 'Scanner',
        tabBarIcon: ({ color, focused }) => (
          <View style={{
            backgroundColor: focused ? colors.primary : 'transparent',
            padding: 6, borderRadius: 8, marginTop: -4,
          }}>
            <ScanLine color={focused ? '#fff' : color} size={22} />
          </View>
        ),
        tabBarLabelStyle: { marginTop: 2 },
      }}
    />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{
        tabBarLabel: 'History',
        tabBarIcon: ({ color }) => <Clock color={color} size={22} />,
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
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
