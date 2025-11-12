import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface DatePickerProps {
  value: string; // Format: YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
}

export function DatePicker({ value, onChange, placeholder = "Seleccionar fecha", label }: DatePickerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [modalVisible, setModalVisible] = useState(false);

  // Parse current value or use today's date
  const parseDate = (dateString: string) => {
    if (!dateString) {
      const today = new Date();
      return {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate(),
      };
    }
    const [year, month, day] = dateString.split('-').map(Number);
    return { year, month, day };
  };

  const currentDate = parseDate(value);
  const [selectedYear, setSelectedYear] = useState(currentDate.year);
  const [selectedMonth, setSelectedMonth] = useState(currentDate.month);
  const [selectedDay, setSelectedDay] = useState(currentDate.day);

  // Generate year options (current year ± 10 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const days = Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => i + 1);

  const handleConfirm = () => {
    const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    onChange(formattedDate);
    setModalVisible(false);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return placeholder;
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleClear = () => {
    onChange('');
    setModalVisible(false);
  };

  useEffect(() => {
    // Adjust day if it exceeds days in selected month
    const maxDays = getDaysInMonth(selectedYear, selectedMonth);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
    }
  }, [selectedYear, selectedMonth]);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <TouchableOpacity
        style={[styles.input, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="event" size={20} color={colors.primary} style={styles.icon} />
        <Text style={[styles.inputText, { color: value ? colors.text : colors.textSecondary }]}>
          {formatDisplayDate(value)}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Seleccionar Fecha</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickersContainer}>
              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Año</Text>
                <ScrollView style={[styles.pickerScroll, { borderColor: colors.border }]} showsVerticalScrollIndicator={false}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        selectedYear === year && { backgroundColor: colors.primary + '15' },
                      ]}
                      onPress={() => setSelectedYear(year)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: selectedYear === year ? colors.primary : colors.text },
                          selectedYear === year && styles.pickerItemTextSelected,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month Picker */}
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Mes</Text>
                <ScrollView style={[styles.pickerScroll, { borderColor: colors.border }]} showsVerticalScrollIndicator={false}>
                  {months.map((month) => (
                    <TouchableOpacity
                      key={month.value}
                      style={[
                        styles.pickerItem,
                        selectedMonth === month.value && { backgroundColor: colors.primary + '15' },
                      ]}
                      onPress={() => setSelectedMonth(month.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: selectedMonth === month.value ? colors.primary : colors.text },
                          selectedMonth === month.value && styles.pickerItemTextSelected,
                        ]}
                      >
                        {month.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Día</Text>
                <ScrollView style={[styles.pickerScroll, { borderColor: colors.border }]} showsVerticalScrollIndicator={false}>
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerItem,
                        selectedDay === day && { backgroundColor: colors.primary + '15' },
                      ]}
                      onPress={() => setSelectedDay(day)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: selectedDay === day ? colors.primary : colors.text },
                          selectedDay === day && styles.pickerItemTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.clearBtn, { backgroundColor: colors.textSecondary }]}
                onPress={handleClear}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn, { backgroundColor: colors.primary }]}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  icon: {
    marginRight: 8,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    width: '100%',
    maxWidth: 500,
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  pickersContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  pickerScroll: {
    height: 200,
    borderWidth: 1,
    borderRadius: 12,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 15,
  },
  pickerItemTextSelected: {
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearBtn: {
    // Styling handled by dynamic color
  },
  confirmBtn: {
    // Styling handled by dynamic color
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
