import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useSettings } from '@/contexts/settings-context';

export function useColorScheme(): 'light' | 'dark' {
  const systemColorScheme = useSystemColorScheme();

  // Try to get settings, but handle the case where we're outside the provider
  let theme: 'light' | 'dark' | 'system' = 'system';
  try {
    const { settings } = useSettings();
    theme = settings.theme ?? 'system';
  } catch {
    // If we're outside the SettingsProvider, fall back to system
    theme = 'system';
  }

  if (theme === 'system') {
    return systemColorScheme ?? 'light';
  }

  return theme;
}

// Export the raw system color scheme for cases where we need it
export { useColorScheme as useSystemColorScheme } from 'react-native';
