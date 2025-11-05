import { StyleSheet, FlatList, View, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { getApiUrl } from "@/constants/api";

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
    <ThemedView style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <IconSymbol name="cart.fill" size={24} color="#4A90E2" />
        </View>

        <View style={{ flex: 1 }}>
          <ThemedText type="subtitle" style={{ fontFamily: Fonts.rounded }}>
            {item.client}
          </ThemedText>
          <ThemedText style={styles.detailText}>
            Compró {item.cantidad} × {item.product}
          </ThemedText>
        </View>

        <ThemedText type="defaultSemiBold" style={styles.amountText}>
          ${item.precio_total_linea.toLocaleString()}
        </ThemedText>
      </View>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Movimientos
        </ThemedText>
        <ThemedText type="default" style={styles.subtitle}>
          Consulta los movimientos de compra de los clientes.
        </ThemedText>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={movements}
        keyExtractor={(item) => item.id_movimiento.toString()}
        renderItem={renderMovement}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    color: "#6B7280",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  refreshButton: {
    backgroundColor: "#E6F0FF",
    padding: 8,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#E0ECFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  detailText: {
    color: "#6B7280",
    fontSize: 13,
  },
  amountText: {
    color: "#4A90E2",
    fontSize: 15,
  },
});
