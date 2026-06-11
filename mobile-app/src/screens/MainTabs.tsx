import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';

import DashboardScreen from './DashboardScreen';
import HistoryScreen from './HistoryScreen';
import SettingsScreen from './SettingsScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: 'transparent',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarBackground: () => (
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        ),
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
