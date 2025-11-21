import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/contexts/settings-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TasksLayout() {
  const colorScheme = useColorScheme();
  const { settings } = useSettings();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const translations = {
    en: {
      tasks: 'Tasks',
      addTask: 'Add Task',
    },
    pt: {
      tasks: 'Tarefas',
      addTask: 'Adicionar Tarefa',
    },
  };

  const t = translations[settings.language];

  const BackButton = () => (
    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
      <IconSymbol name="chevron.left" size={24} color={isDark ? '#ECEDEE' : '#11181C'} />
    </TouchableOpacity>
  );

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#151718' : '#fff',
        },
        headerTintColor: isDark ? '#ECEDEE' : '#11181C',
        headerShadowVisible: false,
        headerLeft: () => <BackButton />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t.tasks,
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: t.addTask,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
