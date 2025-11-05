import { useEffect, useState } from "react";
import {
  StyleSheet,
  FlatList,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";
import { getApiUrl } from "@/constants/api";

type Product = {
  id: number;
  name: string;
  quantity: number;
  price: number;
};

type Invoice = {
  id: number;
  cliente: string;
  products: number;
  total: string;
};

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [clientName, setClientName] = useState("");
  const [productId, setProductId] = useState("");
  const [newProducts, setNewProducts] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  const generateRandomId = () => Math.floor(1000 + Math.random() * 9000);

  const handleAddProduct = () => {
    const id = Number(productId);
    const found = availableProducts.find((p) => p.id === id);
    if (!found) return alert("Producto no encontrado");
    const alreadyAdded = newProducts.find((p) => p.id === id);
    if (alreadyAdded) return alert("Este producto ya fue agregado");

    setNewProducts([...newProducts, { ...found, cantidadTotal: 1 }]);
    setProductId("");
  };

  const changeQuantity = (id: number, delta: number) => {
    console.log(newProducts, delta);
    setNewProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, cantidadTotal: Math.max(1, p.cantidadTotal + delta) }
          : p
      )
    );
  };

  const handleSaveInvoice = async () => {
    if (!clientName.trim()) return alert("Debe ingresar el nombre del cliente");
    if (newProducts.length === 0)
      return alert("Debe agregar al menos un producto");

    const total = newProducts.reduce(
      (acc, p) => acc + p.price * p.cantidadTotal,
      0
    );

    console.log("newProducts", newProducts);

    setModalVisible(false);
    setClientName("");
    setProductId("");
    setNewProducts([]);

    const fecha = new Date().toISOString().slice(0, 19).replace("T", " ");

    console.log(total, fecha);

    console.log("PRODUCTOS", newProducts);
    let data: any;
    try {
      const response = await fetch(`${getApiUrl()}/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente: clientName,
          fecha,
          total,
          products: newProducts.length,
        }),
      });

      data = await response.json();

      const newInvoice: any = {
        id: data.factura.id_factura,
        cliente: clientName.trim(),
        products: newProducts.length,
        total,
      };
      setInvoices((prev) => [...prev, newInvoice]);

      console.log("RESPUESTA CREAR FACTURA:", data);
    } catch (error) {
      console.log("ERROR CREANDO FACTURA", error);
    }

    console.log("data.factura.id_factura", data.factura.id_factura);

    // Actualizar productos
    try {
      const response = await fetch(`${getApiUrl()}/products`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente: clientName.trim(),
          total,
          newProducts,
          id_factura: data.factura.id_factura,
        }),
      });

      console.log("RESPUESTA ACTUALIZAR PRODUCTOS", response);
    } catch (error) {
      console.log("ERROR ACTUALIZANDO PRODUCTOS", error);
    }
  };

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/products/a`);
        const data = await response.json();

        console.log("PRODUCTOS", data);

        const products = data.map((prod: any) => ({
          ...prod,
          cantidadTotal: 1,
        }));

        setAvailableProducts(products);
      } catch (error) {
        console.error("Error al cargar productos:", error);
        Alert.alert("Error", "No se pudieron cargar los productos");
      }
    };

    fetchProductos();
  }, [modalVisible]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/invoices`);
        const data = await response.json();

        console.log("INVOICES", data);

        setInvoices(data);
      } catch (error) {
        console.error("Error al cargar facturas:", error);
        Alert.alert("Error", "No se pudieron cargar las facturas");
      }
    };

    fetchInvoices();
  }, []);

  const renderInvoice = ({ item }: { item: Invoice }) => {
    // const total = item.products.reduce(
    //   (acc, p) => acc + p.price * p.quantity,
    //   0
    // );

    return (
      <ThemedView style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <IconSymbol
              name="person.crop.circle.fill"
              size={28}
              color="#4A90E2"
            />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle" style={{ fontFamily: Fonts.rounded }}>
              Id: {item.id}
            </ThemedText>
            <ThemedText type="subtitle" style={{ fontFamily: Fonts.rounded }}>
              {item.cliente}
            </ThemedText>
            <ThemedText style={{ color: "#6B7280", fontSize: 13 }}>
              {item.products} productos
            </ThemedText>
          </View>
          <ThemedText type="defaultSemiBold" style={styles.totalText}>
            {/* ${total.toLocaleString()} */}${item.total}
          </ThemedText>
        </View>

        {/* <View style={styles.divider} /> */}

        {/* <View style={styles.productsContainer}>
          {item.products.map((p) => (
            <View key={p.id} style={styles.productRow}>
              <ThemedText style={styles.productName}>{p.name}</ThemedText>
              <ThemedText style={styles.productQty}>x{p.quantity}</ThemedText>
              <ThemedText style={styles.productPrice}>
                ${(p.price * p.quantity).toLocaleString()}
              </ThemedText>
            </View>
          ))}
        </View> */}
      </ThemedView>
    );
  };

  const totalNewInvoice = newProducts.reduce(
    (acc, p) => acc + p.price * p.cantidadTotal,
    0
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Facturas
        </ThemedText>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setModalVisible(true)}
        >
          <ThemedText style={styles.createButtonText}>
            + Crear factura
          </ThemedText>
        </TouchableOpacity>
      </View>

      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderInvoice}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Modal de creación de factura */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ThemedText style={styles.modalTitle}>
              Crear nueva factura
            </ThemedText>

            <TextInput
              style={styles.input}
              placeholder="Nombre del cliente"
              value={clientName}
              onChangeText={setClientName}
            />

            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="ID del producto"
                value={productId}
                onChangeText={setProductId}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddProduct}
              >
                <ThemedText style={styles.addButtonText}>Añadir</ThemedText>
              </TouchableOpacity>
            </View>

            {newProducts.length > 0 && (
              <>
                <ThemedText style={styles.sectionTitle}>
                  Productos agregados:
                </ThemedText>
                {newProducts.map((p) => (
                  <View key={p.id} style={styles.productRow}>
                    <ThemedText style={styles.productName}>{p.name}</ThemedText>

                    <View style={styles.qtyButtons}>
                      <TouchableOpacity
                        onPress={() => changeQuantity(p.id, -1)}
                        style={styles.qtyBtn}
                      >
                        <ThemedText>-</ThemedText>
                      </TouchableOpacity>
                      <ThemedText style={styles.productQty}>
                        {+p.cantidadTotal}
                      </ThemedText>
                      <TouchableOpacity
                        onPress={() => changeQuantity(p.id, 1)}
                        style={styles.qtyBtn}
                        disabled={p.cantidadTotal >= p.quantity}
                      >
                        <ThemedText>+</ThemedText>
                      </TouchableOpacity>
                    </View>

                    <ThemedText style={styles.productPrice}>
                      ${(p.price * p.quantity).toLocaleString()}
                    </ThemedText>
                  </View>
                ))}

                <ThemedText style={styles.totalTextModal}>
                  Total: ${totalNewInvoice.toLocaleString()}
                </ThemedText>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#E5E7EB" }]}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#4A90E2" }]}
                onPress={handleSaveInvoice}
              >
                <ThemedText style={{ color: "#fff" }}>Guardar</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: { fontSize: 22, fontWeight: "bold" },
  createButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  createButtonText: { color: "#fff", fontWeight: "bold" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E0ECFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  totalText: { color: "#4A90E2", fontSize: 16 },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 10 },
  productsContainer: { gap: 6 },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  productName: { flex: 1, fontSize: 14 },
  productQty: { width: 40, textAlign: "center", color: "#6B7280" },
  productPrice: { width: 80, textAlign: "right", color: "#111827" },

  // MODAL
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 10,
    height: 40,
  },
  addButtonText: { color: "#fff", fontWeight: "bold" },
  sectionTitle: { fontWeight: "bold", marginBottom: 6 },
  qtyButtons: { flexDirection: "row", alignItems: "center", gap: 6 },
  qtyBtn: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  totalTextModal: {
    marginTop: 10,
    fontWeight: "bold",
    textAlign: "right",
    color: "#4A90E2",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  row: { flexDirection: "row", gap: 8 },
});
