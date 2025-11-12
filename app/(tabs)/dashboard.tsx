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
import { ThemeToggle } from "@/components/ThemeToggle";

interface DashboardData {
  overview: {
    totalClients: number;
    totalProducts: number;
    totalInvoices: number;
    totalSales: number;
    currentMonthSales: number;
    lowStockProducts: number;
  };
  topProducts: Array<{ nombre: string; total_vendido: number }>;
  topClients: Array<{ nombre: string; total_facturas: number; total_gastado: number }>;
  salesByMonth: Array<{ mes: string; total: number }>;
  recentInvoices: Array<{ id_factura: number; cliente: string; total: number; fecha: string; products: number }>;
}

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  const maxContentWidth = isWeb && width > 768 ? 1200 : undefined;
  const horizontalPadding = isWeb && width > 768 ? 40 : 16;

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/analytics/dashboard`);
      if (!response.ok) throw new Error("Error al cargar datos del dashboard");
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("No se pudieron cargar los datos del dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchDashboardData();
      toast.success("Dashboard actualizado");
    } catch (error) {
      toast.error("No se pudo actualizar el dashboard");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: textSecondary }]}>
            Cargando dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <MaterialIcons name="error-outline" size={48} color={colors.error} />
          <Text style={[styles.loadingText, { color: textSecondary }]}>
            No se pudieron cargar los datos
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <ThemedText type="title" style={styles.title}>
                  Dashboard
                </ThemedText>
                <ThemedText type="default" style={[styles.subtitle, { color: textSecondary }]}>
                  Resumen general de tu negocio
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <ThemeToggle />
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
            </View>
          </View>

          {/* Overview Cards */}
          <View style={styles.overviewGrid}>
            <View style={[styles.overviewCard, { backgroundColor: cardBackground, borderColor }]}>
              <MaterialIcons name="people" size={32} color={colors.primary} />
              <Text style={[styles.overviewValue, { color: textColor }]}>{data.overview.totalClients}</Text>
              <Text style={[styles.overviewLabel, { color: textSecondary }]}>Clientes</Text>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: cardBackground, borderColor }]}>
              <MaterialIcons name="inventory-2" size={32} color={colors.secondary} />
              <Text style={[styles.overviewValue, { color: textColor }]}>{data.overview.totalProducts}</Text>
              <Text style={[styles.overviewLabel, { color: textSecondary }]}>Productos</Text>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: cardBackground, borderColor }]}>
              <MaterialIcons name="receipt-long" size={32} color={colors.success} />
              <Text style={[styles.overviewValue, { color: textColor }]}>{data.overview.totalInvoices}</Text>
              <Text style={[styles.overviewLabel, { color: textSecondary }]}>Facturas</Text>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: cardBackground, borderColor }]}>
              <MaterialIcons name="attach-money" size={32} color={colors.success} />
              <Text style={[styles.overviewValue, { color: colors.success }]}>
                ${data.overview.totalSales.toLocaleString()}
              </Text>
              <Text style={[styles.overviewLabel, { color: textSecondary }]}>Ventas Totales</Text>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: cardBackground, borderColor }]}>
              <MaterialIcons name="calendar-today" size={32} color={colors.primary} />
              <Text style={[styles.overviewValue, { color: textColor }]}>
                ${data.overview.currentMonthSales.toLocaleString()}
              </Text>
              <Text style={[styles.overviewLabel, { color: textSecondary }]}>Ventas del Mes</Text>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: cardBackground, borderColor }]}>
              <MaterialIcons name="warning" size={32} color={colors.warning} />
              <Text style={[styles.overviewValue, { color: colors.warning }]}>
                {data.overview.lowStockProducts}
              </Text>
              <Text style={[styles.overviewLabel, { color: textSecondary }]}>Stock Bajo</Text>
            </View>
          </View>

          {/* Top Products & Clients */}
          <View style={styles.rowContainer}>
            {/* Top Products */}
            <View style={[styles.sectionCard, { backgroundColor: cardBackground, borderColor }]}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="star" size={24} color={colors.warning} />
                <Text style={[styles.sectionTitle, { color: textColor }]}>Top Productos</Text>
              </View>
              {data.topProducts.map((product, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemLeft}>
                    <Text style={[styles.rankNumber, { color: colors.primary }]}>#{index + 1}</Text>
                    <Text style={[styles.listItemText, { color: textColor }]}>{product.nombre}</Text>
                  </View>
                  <Text style={[styles.listItemValue, { color: colors.success }]}>
                    {product.total_vendido} vendidos
                  </Text>
                </View>
              ))}
            </View>

            {/* Top Clients */}
            <View style={[styles.sectionCard, { backgroundColor: cardBackground, borderColor }]}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="emoji-events" size={24} color={colors.success} />
                <Text style={[styles.sectionTitle, { color: textColor }]}>Top Clientes</Text>
              </View>
              {data.topClients.map((client, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemLeft}>
                    <Text style={[styles.rankNumber, { color: colors.primary }]}>#{index + 1}</Text>
                    <View>
                      <Text style={[styles.listItemText, { color: textColor }]}>{client.nombre}</Text>
                      <Text style={[styles.listItemSubtext, { color: textSecondary }]}>
                        {client.total_facturas} facturas
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.listItemValue, { color: colors.success }]}>
                    ${parseFloat(client.total_gastado.toString()).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Invoices */}
          <View style={[styles.sectionCard, { backgroundColor: cardBackground, borderColor }]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="history" size={24} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>Facturas Recientes</Text>
            </View>
            {data.recentInvoices.map((invoice) => (
              <View key={invoice.id_factura} style={[styles.invoiceItem, { borderBottomColor: borderColor }]}>
                <View style={styles.invoiceLeft}>
                  <Text style={[styles.invoiceId, { color: textSecondary }]}>#{invoice.id_factura}</Text>
                  <Text style={[styles.invoiceClient, { color: textColor }]}>{invoice.cliente}</Text>
                  <Text style={[styles.invoiceDate, { color: textSecondary }]}>
                    {new Date(invoice.fecha).toLocaleDateString('es-ES')}
                  </Text>
                </View>
                <Text style={[styles.invoiceTotal, { color: colors.success }]}>
                  ${parseFloat(invoice.total.toString()).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  container: {
    flex: 1,
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 4,
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
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  overviewCard: {
    flex: 1,
    minWidth: 150,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
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
  overviewValue: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 12,
  },
  overviewLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  rowContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  sectionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  listItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: "700",
    minWidth: 30,
  },
  listItemText: {
    fontSize: 15,
    fontWeight: "500",
  },
  listItemSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  listItemValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  invoiceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  invoiceLeft: {
    flex: 1,
  },
  invoiceId: {
    fontSize: 12,
    marginBottom: 4,
  },
  invoiceClient: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 13,
  },
  invoiceTotal: {
    fontSize: 18,
    fontWeight: "700",
  },
});
