import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import COLORS from "@/constants/colors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="users">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Users</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sims">
        <Icon sf={{ default: "simcard", selected: "simcard.fill" }} />
        <Label>SIM</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="vault">
        <Icon sf={{ default: "lock", selected: "lock.fill" }} />
        <Label>Vault</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.tabActive,
        tabBarInactiveTintColor: COLORS.tabInactive,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : COLORS.tabBar,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.tabBar }]} />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 10,
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="house.fill" tintColor={color} size={size} />
            ) : (
              <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="person.2.fill" tintColor={color} size={size} />
            ) : (
              <MaterialCommunityIcons name="account-group" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="sims"
        options={{
          title: 'SIM',
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="simcard.fill" tintColor={color} size={size} />
            ) : (
              <MaterialCommunityIcons name="sim" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="lock.fill" tintColor={color} size={size} />
            ) : (
              <MaterialCommunityIcons name="shield-key" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="gearshape.fill" tintColor={color} size={size} />
            ) : (
              <MaterialCommunityIcons name="cog" size={size} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
