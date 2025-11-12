import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type DialogType = 'warning' | 'error' | 'info';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const getDialogColors = () => {
    switch (type) {
      case 'error':
        return { iconColor: colors.error, iconName: 'error' as const, confirmBg: colors.error };
      case 'info':
        return { iconColor: colors.primary, iconName: 'info' as const, confirmBg: colors.primary };
      case 'warning':
      default:
        return { iconColor: colors.warning, iconName: 'warning' as const, confirmBg: colors.warning };
    }
  };

  const dialogColors = getDialogColors();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.dialog, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <View style={[styles.iconContainer, { backgroundColor: dialogColors.iconColor + "15" }]}>
            <MaterialIcons name={dialogColors.iconName} size={40} color={dialogColors.iconColor} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { backgroundColor: colors.border }]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton, { backgroundColor: dialogColors.confirmBg }]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    // Styling handled by dynamic color
  },
  confirmButton: {
    // Styling handled by dynamic color
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
