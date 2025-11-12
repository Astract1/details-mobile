import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function ThemeToggle() {
  const { themeMode, setThemeMode } = useTheme();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getIcon = () => {
    if (themeMode === 'light') return 'light-mode';
    if (themeMode === 'dark') return 'dark-mode';
    return 'brightness-auto';
  };

  const getLabel = () => {
    if (themeMode === 'light') return 'Claro';
    if (themeMode === 'dark') return 'Oscuro';
    return 'Auto';
  };

  const cycleTheme = async () => {
    if (themeMode === 'light') {
      await setThemeMode('dark');
    } else if (themeMode === 'dark') {
      await setThemeMode('system');
    } else {
      await setThemeMode('light');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.primary + '15' }]}
      onPress={cycleTheme}
      activeOpacity={0.7}
    >
      <MaterialIcons name={getIcon()} size={20} color={colors.primary} />
      <Text style={[styles.label, { color: colors.primary }]}>{getLabel()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
