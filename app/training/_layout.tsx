import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/contexts/settings-context';
import { t } from '@/types/training';

export default function TrainingLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { settings } = useSettings();
  const language = settings.language;

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#151718' : '#fff',
        },
        headerTintColor: isDark ? '#ECEDEE' : '#11181C',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t('training', language),
        }}
      />
      <Stack.Screen
        name="exercises"
        options={{
          title: t('exercises', language),
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: '',
        }}
      />
    </Stack>
  );
}
