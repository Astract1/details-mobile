import { useTheme } from '@/contexts/ThemeContext';
import { ColorSchemeName } from 'react-native';

export function useColorScheme(): ColorSchemeName {
  const { colorScheme } = useTheme();
  return colorScheme as ColorSchemeName;
}
