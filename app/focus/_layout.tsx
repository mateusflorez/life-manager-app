import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, useColorScheme } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/contexts/settings-context';
import { t } from '@/types/focus';

export default function FocusLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { settings } = useSettings();
  const language = settings.language;

  const headerTintColor = isDark ? '#ECEDEE' : '#11181C';
  const headerBackground = isDark ? '#151718' : '#fff';

  const BackButton = () => (
    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
      <IconSymbol
        name="chevron.left"
        size={24}
        color={headerTintColor}
      />
    </TouchableOpacity>
  );

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: headerBackground },
        headerTintColor,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t('focus', language),
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: t('history', language),
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack>
  );
}
