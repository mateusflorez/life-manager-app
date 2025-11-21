import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AccountProvider } from '@/contexts/account-context';
import { SettingsProvider } from '@/contexts/settings-context';
import { FinanceProvider } from '@/contexts/finance-context';
import { InvestmentProvider } from '@/contexts/investment-context';
import { TasksProvider } from '@/contexts/tasks-context';
import { BooksProvider } from '@/contexts/books-context';
import { MoodProvider } from '@/contexts/mood-context';
import { useSettings } from '@/contexts/settings-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { settings } = useSettings();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const translations = {
    en: { profile: 'Profile' },
    pt: { profile: 'Perfil' },
  };

  const t = translations[settings.language];

  const BackButton = () => (
    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
      <IconSymbol name="chevron.left" size={24} color={isDark ? '#ECEDEE' : '#11181C'} />
    </TouchableOpacity>
  );

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="finance" options={{ headerShown: false }} />
        <Stack.Screen name="investments" options={{ headerShown: false }} />
        <Stack.Screen name="tasks" options={{ headerShown: false }} />
        <Stack.Screen name="books" options={{ headerShown: false }} />
        <Stack.Screen name="mood" options={{ headerShown: false }} />
        <Stack.Screen
          name="profile"
          options={{
            title: t.profile,
            headerStyle: {
              backgroundColor: isDark ? '#151718' : '#fff',
            },
            headerTintColor: isDark ? '#ECEDEE' : '#11181C',
            headerShadowVisible: false,
            headerLeft: () => <BackButton />,
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <AccountProvider>
        <FinanceProvider>
          <InvestmentProvider>
            <TasksProvider>
              <BooksProvider>
                <MoodProvider>
                  <RootLayoutNav />
                </MoodProvider>
              </BooksProvider>
            </TasksProvider>
          </InvestmentProvider>
        </FinanceProvider>
      </AccountProvider>
    </SettingsProvider>
  );
}
