import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AccountProvider } from '@/contexts/account-context';
import { SettingsProvider } from '@/contexts/settings-context';
import { FinanceProvider } from '@/contexts/finance-context';
import { InvestmentProvider } from '@/contexts/investment-context';
import { TasksProvider } from '@/contexts/tasks-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SettingsProvider>
      <AccountProvider>
        <FinanceProvider>
          <InvestmentProvider>
            <TasksProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="finance" options={{ headerShown: false }} />
                  <Stack.Screen name="investments" options={{ headerShown: false }} />
                  <Stack.Screen name="tasks" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
            </TasksProvider>
          </InvestmentProvider>
        </FinanceProvider>
      </AccountProvider>
    </SettingsProvider>
  );
}
