import { ThemedText } from "@/components/themed-text";
import { getApiUrl } from "@/constants/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsive } from "@/hooks/use-responsive";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useToast } from "@/components/toast/ToastContext";

interface Producto {
  id_producto: number;
  nombre: string;
  precio_unitario: number;
  stock: number;
}

export default function InventoryScreen() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toast = useToast();
  const { isWeb, width } = useResponsive();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const backgroundColor = Colors[colorScheme].background;
  const cardBackground = Colors[colorScheme].backgroundCard;
  const borderColor = Colors[colorScheme].border;
  const textColor = Colors[colorScheme].text;
  const textSecondary = Colors[colorScheme].textSecondary;

  const maxContentWidth = isWeb && width > 768 ? 1000 : undefined;
  const horizontalPadding = isWeb && width > 768 ? 40 : 16;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`${getApiUrl()}/products`);
      const data = await response.json();
      setProductos(data);
      toast.success("Inventario actualizado");
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast.error("No se pudieron cargar los productos");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchProductos = async () => {
      setIsLoadingList(true);
      try {
        const response = await fetch(`${getApiUrl()}/products`);
        const data = await response.json();
        setProductos(data);
      } catch (error) {
        console.error("Error al cargar productos:", error);
        toast.error("No se pudieron cargar los productos");
      } finally {
        setIsLoadingList(false);
      }
    };

    fetchProductos();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding },
        ]}
      >
        <View style={[styles.container, maxContentWidth && { maxWidth: maxContentWidth, alignSelf: "center" }]}>
          {/* Encabezado */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <ThemedText type="title" style={styles.title}>
                Inventario de Productos
              </ThemedText>
              <TouchableOpacity
                onPress={handleRefresh}
                style={[styles.refreshButton, { backgroundColor: colors.primary + "15" }]}
                activeOpacity={0.8}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="refresh" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
            <ThemedText type="default" style={[styles.subtitle, { color: textSecondary }]}>
              Consulta el stock y precios actuales de tus productos
            </ThemedText>
          </View>

          {/* Resumen de inventario */}
          <View style={[styles.summaryCard, { backgroundColor: cardBackground, borderColor }]}>
            <View style={styles.summaryItem}>
              <MaterialIcons name="inventory" size={24} color={colors.primary} />
              <View style={styles.summaryText}>
                <Text style={[styles.summaryValue, { color: textColor }]}>{productos.length}</Text>
                <Text style={[styles.summaryLabel, { color: textSecondary }]}>Productos</Text>
              </View>
            </View>
            <View style={styles.summaryItem}>
              <MaterialIcons name="warehouse" size={24} color={colors.warning} />
              <View style={styles.summaryText}>
                <Text style={[styles.summaryValue, { color: textColor }]}>
                  {productos.reduce((sum, p) => sum + p.stock, 0)}
                </Text>
                <Text style={[styles.summaryLabel, { color: textSecondary }]}>Stock Total</Text>
              </View>
            </View>
          </View>

          {/* Lista de productos */}
          <View style={{ marginTop: 24 }}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Productos Disponibles
            </ThemedText>

            {isLoadingList ? (
              <View style={[styles.loadingListContainer, { backgroundColor: cardBackground, borderColor }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingListText, { color: textSecondary }]}>
                  Cargando inventario...
                </Text>
              </View>
            ) : productos.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: cardBackground, borderColor }]}>
                <MaterialIcons name="inventory-2" size={48} color={textSecondary} />
                <Text style={[styles.emptyText, { color: textSecondary }]}>No hay productos registrados.</Text>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {productos.map((item) => (
                  <View key={item.id_producto} style={[styles.productCard, { backgroundColor: cardBackground, borderColor }]}>
                    <View style={styles.cardContent}>
                      <View style={[styles.cardIcon, { backgroundColor: colors.primary + "15" }]}>
                        <MaterialIcons name="inventory-2" size={24} color={colors.primary} />
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={[styles.productName, { color: textColor }]}>{item.nombre}</Text>
                        <View style={styles.cardDetail}>
                          <MaterialIcons name="tag" size={14} color={textSecondary} />
                          <Text style={[styles.cardId, { color: textSecondary }]}>ID: {item.id_producto}</Text>
                        </View>
                        <View style={styles.cardDetailsRow}>
                          <View style={styles.cardDetail}>
                            <MaterialIcons name="attach-money" size={16} color={colors.success} />
                            <Text style={[styles.cardPrice, { color: colors.success }]}>
                              ${item.precio_unitario.toLocaleString()}
                            </Text>
                          </View>
                          <View style={styles.cardDetail}>
                            <MaterialIcons
                              name="warehouse"
                              size={16}
                              color={item.stock < 10 ? colors.error : colors.warning}
                            />
                            <Text style={[
                              styles.cardStock,
                              { color: item.stock < 10 ? colors.error : colors.warning }
                            ]}>
                              Stock: {item.stock}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {item.stock < 10 && (
                      <View style={[styles.warningBadge, { backgroundColor: colors.error + "15" }]}>
                        <MaterialIcons name="warning" size={16} color={colors.error} />
                        <Text style={[styles.warningText, { color: colors.error }]}>Stock bajo</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    ...Platform.select({
      web: {
        minHeight: "100vh" as any,
      },
    }) as any,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
    ...Platform.select({
      web: {
        width: "100%",
      },
    }) as any,
  },
  container: {
    flex: 1,
    width: "100%",
    ...Platform.select({
      web: {
        maxWidth: "100%",
      },
    }) as any,
  },
  header: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  refreshButton: {
    padding: 10,
    borderRadius: 50,
    ...Platform.select({
      web: {
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" as any,
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }) as any,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)" as any,
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      },
    }) as any,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  emptyContainer: {
    borderRadius: 16,
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  listContainer: {
    gap: 12,
  },
  productCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)" as any,
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      },
    }) as any,
  },
  cardContent: {
    flexDirection: "row",
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  cardDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  cardDetailsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  cardId: {
    fontSize: 12,
    lineHeight: 16,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardStock: {
    fontSize: 14,
    fontWeight: "500",
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  warningText: {
    fontSize: 13,
    fontWeight: "600",
  },
  loadingListContainer: {
    borderRadius: 16,
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  loadingListText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
});
