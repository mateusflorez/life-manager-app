import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSettings } from "@/contexts/settings-context";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { settings } = useSettings();

  const translations = {
    en: {
      home: "Home",
      achievements: "Achievements",
      config: "Config",
    },
    pt: {
      home: "Início",
      achievements: "Conquistas",
      config: "Config",
    },
  };

  const t = translations[settings.language] || translations.en;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.home,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: t.achievements,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="trophy.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="config"
        options={{
          title: t.config,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
