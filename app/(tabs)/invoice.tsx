import { useEffect, useState } from "react";
import {
  StyleSheet,
  FlatList,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  ScrollView,
  Platform,
  Text,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts, Colors } from "@/constants/theme";
import { getApiUrl } from "@/constants/api";
import { useResponsive } from "@/hooks/use-responsive";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";

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
    return (
      <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + "15" }]}>
            <MaterialIcons name="receipt" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.cardId, { color: textSecondary }]}>ID: {item.id}</Text>
            <Text style={[styles.cardClient, { color: textColor }]}>{item.cliente}</Text>
            <View style={styles.cardDetail}>
              <MaterialIcons name="inventory-2" size={14} color={textSecondary} />
              <Text style={[styles.cardProducts, { color: textSecondary }]}>
                {item.products} {item.products === 1 ? "producto" : "productos"}
              </Text>
            </View>
          </View>
          <View style={styles.totalContainer}>
            <Text style={[styles.totalText, { color: colors.primary }]}>
              ${parseFloat(item.total).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const totalNewInvoice = newProducts.reduce(
    (acc, p) => acc + p.price * p.cantidadTotal,
    0
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}>
        <View style={[styles.contentWrapper, maxContentWidth && { maxWidth: maxContentWidth, alignSelf: "center" }]}>
          <View style={styles.header}>
            <View>
              <ThemedText type="title" style={styles.title}>
                Facturas
              </ThemedText>
              <ThemedText type="default" style={[styles.subtitle, { color: textSecondary }]}>
                Gestiona tus facturas y ventas
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Crear factura</Text>
            </TouchableOpacity>
          </View>

          {invoices.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: cardBackground, borderColor }]}>
              <MaterialIcons name="receipt-long" size={48} color={textSecondary} />
              <Text style={[styles.emptyText, { color: textSecondary }]}>No hay facturas registradas.</Text>
            </View>
          ) : (
            <FlatList
              data={invoices}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderInvoice}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          )}
        </View>
      </View>

      {/* Modal de creación de factura */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <ScrollView 
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.modalContainer, { backgroundColor: cardBackground, borderColor }]}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle" style={styles.modalTitle}>
                  Crear nueva factura
                </ThemedText>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <MaterialIcons name="close" size={24} color={textColor} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <MaterialIcons name="person" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor, borderColor }]}
                  placeholder="Nombre del cliente"
                  value={clientName}
                  onChangeText={setClientName}
                  placeholderTextColor={textSecondary}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <MaterialIcons name="tag" size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor, borderColor }]}
                    placeholder="ID del producto"
                    value={productId}
                    onChangeText={setProductId}
                    keyboardType="numeric"
                    placeholderTextColor={textSecondary}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddProduct}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addButtonText}>Añadir</Text>
                </TouchableOpacity>
              </View>

              {newProducts.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>
                    Productos agregados:
                  </Text>
                  <View style={styles.productsList}>
                    {newProducts.map((p) => (
                      <View key={p.id} style={[styles.productRow, { backgroundColor: backgroundColor, borderColor }]}>
                        <View style={styles.productInfo}>
                          <Text style={[styles.productName, { color: textColor }]}>{p.name}</Text>
                          <Text style={[styles.productPrice, { color: colors.success }]}>
                            ${(p.price * p.cantidadTotal).toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.qtyButtons}>
                          <TouchableOpacity
                            onPress={() => changeQuantity(p.id, -1)}
                            style={[styles.qtyBtn, { backgroundColor: colors.border }]}
                            activeOpacity={0.8}
                          >
                            <MaterialIcons name="remove" size={16} color={textColor} />
                          </TouchableOpacity>
                          <Text style={[styles.productQty, { color: textColor }]}>
                            {+p.cantidadTotal}
                          </Text>
                          <TouchableOpacity
                            onPress={() => changeQuantity(p.id, 1)}
                            style={[styles.qtyBtn, { backgroundColor: colors.border }]}
                            disabled={p.cantidadTotal >= p.quantity}
                            activeOpacity={0.8}
                          >
                            <MaterialIcons name="add" size={16} color={textColor} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>

                  <View style={[styles.totalContainerModal, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
                    <Text style={[styles.totalLabel, { color: textColor }]}>Total:</Text>
                    <Text style={[styles.totalTextModal, { color: colors.primary }]}>
                      ${totalNewInvoice.toLocaleString()}
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.textSecondary }]}
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalBtnText, { color: textColor }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveInvoice}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalBtnText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
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
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(0, 122, 255, 0.3)",
      },
      default: {
        shadowColor: "#007AFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
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
  cardHeader: {
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
  cardId: {
    fontSize: 12,
    marginBottom: 4,
  },
  cardClient: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  cardDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardProducts: {
    fontSize: 13,
    lineHeight: 18,
  },
  totalContainer: {
    alignItems: "flex-end",
  },
  totalText: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  // MODAL
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  modalContainer: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
    ...Platform.select({
      web: {
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "transparent",
    marginBottom: 12,
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
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 100,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  productsList: {
    gap: 8,
    marginBottom: 16,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
  },
  qtyButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  productQty: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 30,
    textAlign: "center",
  },
  totalContainerModal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 8,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
  },
  totalTextModal: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
