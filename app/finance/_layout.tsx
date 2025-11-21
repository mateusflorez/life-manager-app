import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/contexts/settings-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

export default function FinanceLayout() {
  const colorScheme = useColorScheme();
  const { settings } = useSettings();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

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

  const BackButton = () => (
    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
      <IconSymbol name="chevron.left" size={24} color={isDark ? '#ECEDEE' : '#11181C'} />
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarStyle: {
          backgroundColor: isDark ? '#151718' : '#fff',
          borderTopColor: isDark ? '#333' : '#E0E0E0',
        },
        headerStyle: {
          backgroundColor: isDark ? '#151718' : '#fff',
        },
        headerTintColor: isDark ? '#ECEDEE' : '#11181C',
        headerLeft: () => <BackButton />,
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
