import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/contexts/settings-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function BooksLayout() {
  const colorScheme = useColorScheme();
  const { settings } = useSettings();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const translations = {
    en: {
      books: 'Books',
      addBook: 'Add Book',
      bookDetail: 'Book',
    },
    pt: {
      books: 'Livros',
      addBook: 'Adicionar Livro',
      bookDetail: 'Livro',
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
          title: t.books,
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: t.addBook,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: t.bookDetail,
        }}
      />
    </Stack>
  );
}
