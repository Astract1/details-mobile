import { StyleSheet, FlatList, View, TouchableOpacity, SafeAreaView, Platform, Text } from "react-native";
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
  
  const { isWeb, width } = useResponsive();
  const colorScheme = useColorScheme() ?? "light"; // Forzar tema claro
  const colors = Colors[colorScheme];
  const backgroundColor = Colors[colorScheme].background;
  const cardBackground = Colors[colorScheme].backgroundCard;
  const borderColor = Colors[colorScheme].border;
  const textColor = Colors[colorScheme].text;
  const textSecondary = Colors[colorScheme].textSecondary;
  
  const maxContentWidth = isWeb && width > 768 ? 900 : undefined;
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
        console.log("MOVIMIENTOS", data);
      } catch (error) {
        console.error("Error al cargar MOVIMIENTOS:", error);
      }
    };

    fetchProductos();
  }, []);

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
            ${item.precio_total_linea.toLocaleString()}
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
                  Movimientos
                </ThemedText>
                <ThemedText type="default" style={[styles.subtitle, { color: textSecondary }]}>
                  Consulta los movimientos de compra de los clientes.
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

          {movements.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: cardBackground, borderColor }]}>
              <MaterialIcons name="shopping-cart" size={48} color={textSecondary} />
              <Text style={[styles.emptyText, { color: textSecondary }]}>No hay movimientos registrados.</Text>
            </View>
          ) : (
            <FlatList
              data={movements}
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
});
