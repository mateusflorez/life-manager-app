import { Tabs } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/contexts/settings-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

export default function FinanceLayout() {
  const colorScheme = useColorScheme();
  const { settings } = useSettings();

  const translations = {
    en: {
      overview: 'Overview',
      cards: 'Cards',
      recurring: 'Recurring',
      months: 'Months',
    },
    pt: {
      overview: 'Visão Geral',
      cards: 'Cartões',
      recurring: 'Recorrentes',
      months: 'Meses',
    },
  };

  const t = translations[settings.language];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#151718' : '#fff',
          borderTopColor: colorScheme === 'dark' ? '#333' : '#E0E0E0',
        },
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#151718' : '#fff',
        },
        headerTintColor: colorScheme === 'dark' ? '#ECEDEE' : '#11181C',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.overview,
          tabBarIcon: ({ color }) => (
            <IconSymbol name="chart.pie.fill" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: t.cards,
          tabBarIcon: ({ color }) => (
            <IconSymbol name="creditcard.fill" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recurring"
        options={{
          title: t.recurring,
          tabBarIcon: ({ color }) => (
            <IconSymbol name="arrow.2.squarepath" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="months"
        options={{
          title: t.months,
          tabBarIcon: ({ color }) => (
            <IconSymbol name="calendar" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
