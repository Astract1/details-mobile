import { StyleSheet, FlatList, View, TouchableOpacity, SafeAreaView, Platform, Text, TextInput } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts, Colors } from "@/constants/theme";
import { useEffect, useState } from "react";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { getApiUrl } from "@/constants/api";
import { useResponsive } from "@/hooks/use-responsive";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Product = {
  id: number;
  name: string;
  quantity: number;
  price: number;
};

type Movement = {
  id_movimiento: number;
  client: string;
  product: string;
  cantidad: number;
  precio_total_linea: number;
};

export default function MovementsScreen() {
  const [movements, setMovements] = useState<any[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<any[]>([]);

  // Estados de filtros (solo para web)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { isWeb, width } = useResponsive();
  const colorScheme = useColorScheme() ?? "light"; // Forzar tema claro
  const colors = Colors[colorScheme];
  const backgroundColor = Colors[colorScheme].background;
  const cardBackground = Colors[colorScheme].backgroundCard;
  const borderColor = Colors[colorScheme].border;
  const textColor = Colors[colorScheme].text;
  const textSecondary = Colors[colorScheme].textSecondary;

  const maxContentWidth = isWeb && width > 768 ? 1000 : undefined;
  const horizontalPadding = isWeb && width > 768 ? 40 : 16;

  const handleRefresh = async () => {
    try {
      console.log("aaaaaa");
      const response = await fetch(`${getApiUrl()}/movements`);
      const data = await response.json();
      setMovements(data);

      console.log("PRODUCTOS REFRESCADOS", data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/movements`);
        const data = await response.json();

        setMovements(data);
        setFilteredMovements(data);
        console.log("MOVIMIENTOS", data);
      } catch (error) {
        console.error("Error al cargar MOVIMIENTOS:", error);
      }
    };

    fetchProductos();
  }, []);

  // Auto-aplicar filtros cuando cambian los valores o los movimientos
  useEffect(() => {
    let filtered = [...movements];

    // Filtrar por rango de fechas (si existe fecha en los movimientos)
    if (startDate) {
      filtered = filtered.filter(mov => {
        if (!mov.fecha) return false;
        const movDate = new Date(mov.fecha);
        const start = new Date(startDate);
        return movDate >= start;
      });
    }

    if (endDate) {
      filtered = filtered.filter(mov => {
        if (!mov.fecha) return false;
        const movDate = new Date(mov.fecha);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return movDate <= end;
      });
    }

    setFilteredMovements(filtered);
  }, [startDate, endDate, movements]);

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  // Calcular totales
  const totalMovements = filteredMovements.length;
  const totalAmount = filteredMovements.reduce((sum, mov) => sum + parseFloat(mov.precio_total_linea || 0), 0);

  const renderMovement = ({ item }: { item: Movement }) => (
    <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
      <View style={styles.row}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + "15" }]}>
          <MaterialIcons name="shopping-cart" size={24} color={colors.primary} />
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.clientName, { color: textColor }]}>
            {item.client}
          </Text>
          <View style={styles.detailRow}>
            <MaterialIcons name="inventory-2" size={14} color={textSecondary} />
            <Text style={[styles.detailText, { color: textSecondary }]}>
              {item.cantidad} × {item.product}
            </Text>
          </View>
        </View>

        <View style={styles.amountContainer}>
          <Text style={[styles.amountText, { color: colors.success }]}>
            ${parseFloat(item.precio_total_linea).toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}>
        <View style={[styles.contentWrapper, maxContentWidth && { maxWidth: maxContentWidth, alignSelf: "center" }]}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View>
                <ThemedText type="title" style={styles.title}>
                  Historial de Movimientos
                </ThemedText>
                <ThemedText type="default" style={[styles.subtitle, { color: textSecondary }]}>
                  Consulta las transacciones y ventas realizadas
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={handleRefresh}
                style={[styles.refreshButton, { backgroundColor: colors.primary + "15" }]}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Resumen de totales (solo web) */}
          {isWeb && filteredMovements.length > 0 && (
            <View style={[styles.summaryCard, { backgroundColor: cardBackground, borderColor }]}>
              <View style={styles.summaryItem}>
                <MaterialIcons name="receipt-long" size={24} color={colors.primary} />
                <View style={styles.summaryText}>
                  <Text style={[styles.summaryValue, { color: textColor }]}>{totalMovements}</Text>
                  <Text style={[styles.summaryLabel, { color: textSecondary }]}>Transacciones</Text>
                </View>
              </View>
              <View style={styles.summaryItem}>
                <MaterialIcons name="attach-money" size={24} color={colors.success} />
                <View style={styles.summaryText}>
                  <Text style={[styles.summaryValue, { color: colors.success }]}>
                    ${totalAmount.toLocaleString()}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: textSecondary }]}>Total Vendido</Text>
                </View>
              </View>
            </View>
          )}

          {/* Filtros solo para web */}
          {isWeb && (
            <View style={[styles.filtersContainer, { backgroundColor: cardBackground, borderColor }]}>
              <View style={styles.filtersRow}>
                <View style={[styles.filterInput, { flex: 1 }]}>
                  <MaterialIcons name="event" size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor, borderColor }]}
                    placeholder="Fecha inicio (YYYY-MM-DD)"
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholderTextColor={textSecondary}
                  />
                </View>
                <View style={[styles.filterInput, { flex: 1 }]}>
                  <MaterialIcons name="event" size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor, borderColor }]}
                    placeholder="Fecha fin (YYYY-MM-DD)"
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholderTextColor={textSecondary}
                  />
                </View>
              </View>

              <View style={styles.filterButtons}>
                <View style={styles.filterCounter}>
                  <MaterialIcons name="info-outline" size={16} color={colors.primary} />
                  <Text style={[styles.filterCounterText, { color: textSecondary }]}>
                    Mostrando {filteredMovements.length} de {movements.length} movimientos
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.filterBtn, { backgroundColor: colors.error }]}
                  onPress={clearFilters}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="clear" size={18} color="#fff" />
                  <Text style={styles.filterBtnText}>Limpiar Filtros</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {filteredMovements.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: cardBackground, borderColor }]}>
              <MaterialIcons name="shopping-cart" size={48} color={textSecondary} />
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                {isWeb && (startDate || endDate)
                  ? "No se encontraron movimientos con los filtros aplicados."
                  : "No hay movimientos registrados."}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredMovements}
              keyExtractor={(item) => item.id_movimiento.toString()}
              renderItem={renderMovement}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 20,
  },
  contentWrapper: {
    flex: 1,
    width: "100%",
    ...Platform.select({
      web: {
        maxWidth: "100%",
      },
    }),
  },
  header: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  refreshButton: {
    padding: 10,
    borderRadius: 50,
    ...Platform.select({
      web: {
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  emptyContainer: {
    borderRadius: 16,
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  clientName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  // Estilos para resumen
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      },
    }),
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryText: {
    alignItems: "flex-start",
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 14,
    marginTop: 2,
  },
  // Estilos para filtros
  filtersContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    gap: 16,
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      },
    }),
  },
  filtersRow: {
    flexDirection: "row",
    gap: 12,
  },
  filterInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "transparent",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 4,
    fontSize: 16,
    borderWidth: 0,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    alignItems: "center",
  },
  filterCounter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterCounterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  filterBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
