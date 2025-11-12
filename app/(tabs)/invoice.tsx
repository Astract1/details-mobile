import { ThemedText } from "@/components/themed-text";
import { getApiUrl } from "@/constants/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsive } from "@/hooks/use-responsive";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
  fecha?: string;
};

type InvoiceProduct = {
  id: number;
  name: string;
  quantity: number;
  price: number;
  total: number;
};

type InvoiceDetails = {
  id: number;
  cliente: string;
  fecha: string;
  total: string;
  products: InvoiceProduct[];
};

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [clientName, setClientName] = useState("");
  const [productId, setProductId] = useState("");
  const [newProducts, setNewProducts] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  // Estados de filtros (solo para web)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [clientFilter, setClientFilter] = useState("");

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
      (acc, p) => acc + (parseFloat(p.price) * parseInt(p.cantidadTotal)),
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

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert("Error", errorData.message || "Error al crear la factura");
        return;
      }

      data = await response.json();

      if (!data.factura || !data.factura.id_factura) {
        Alert.alert("Error", "La respuesta del servidor no contiene la información esperada");
        return;
      }

      // Recargar todas las facturas desde el servidor para mantener sincronización
      const refreshResponse = await fetch(`${getApiUrl()}/invoices`);
      const updatedInvoices = await refreshResponse.json();
      setInvoices(updatedInvoices);
      setFilteredInvoices(updatedInvoices);

      console.log("RESPUESTA CREAR FACTURA:", data);
      Alert.alert("Éxito", "Factura creada correctamente");

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

        if (!response.ok) {
          const errorData = await response.json();
          console.log("ERROR ACTUALIZANDO PRODUCTOS", errorData);
          Alert.alert("Advertencia", "La factura se creó pero hubo un error al actualizar los productos");
        } else {
          console.log("RESPUESTA ACTUALIZAR PRODUCTOS", response);
        }
      } catch (error) {
        console.log("ERROR ACTUALIZANDO PRODUCTOS", error);
        Alert.alert("Advertencia", "La factura se creó pero hubo un error al actualizar los productos");
      }
    } catch (error) {
      console.log("ERROR CREANDO FACTURA", error);
      Alert.alert("Error", "No se pudo crear la factura. Por favor, intente nuevamente.");
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
        setFilteredInvoices(data);
      } catch (error) {
        console.error("Error al cargar facturas:", error);
        Alert.alert("Error", "No se pudieron cargar las facturas");
      }
    };

    fetchInvoices();
  }, []);

  // Auto-aplicar filtros cuando cambian los valores o las facturas
  useEffect(() => {
    let filtered = [...invoices];

    // Filtrar por cliente
    if (clientFilter.trim()) {
      filtered = filtered.filter(inv =>
        inv.cliente.toLowerCase().includes(clientFilter.toLowerCase())
      );
    }

    // Filtrar por rango de fechas
    if (startDate) {
      filtered = filtered.filter(inv => {
        if (!inv.fecha) return false;
        const invoiceDate = new Date(inv.fecha);
        const start = new Date(startDate);
        return invoiceDate >= start;
      });
    }

    if (endDate) {
      filtered = filtered.filter(inv => {
        if (!inv.fecha) return false;
        const invoiceDate = new Date(inv.fecha);
        const end = new Date(endDate);
        // Agregar un día completo al final
        end.setHours(23, 59, 59, 999);
        return invoiceDate <= end;
      });
    }

    setFilteredInvoices(filtered);
  }, [clientFilter, startDate, endDate, invoices]);

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setClientFilter("");
  };

  const handleInvoicePress = async (invoice: Invoice) => {
    setLoadingDetails(true);
    setDetailModalVisible(true);
    
    try {
      const response = await fetch(`${getApiUrl()}/invoices/${invoice.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert("Error", errorData.message || "No se pudieron cargar los detalles de la factura");
        setDetailModalVisible(false);
        return;
      }
      
      const data = await response.json();
      
      // El backend devuelve { invoice: {...}, ... }, necesitamos extraer el invoice
      if (data.invoice) {
        setSelectedInvoice(data.invoice);
      } else {
        // Fallback: si no viene en formato esperado, usar data directamente
        setSelectedInvoice(data);
      }
    } catch (error) {
      console.error("Error al cargar detalles de la factura:", error);
      Alert.alert("Error", "No se pudieron cargar los detalles de la factura");
      setDetailModalVisible(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const renderInvoice = ({ item }: { item: Invoice }) => {
    return (
      <TouchableOpacity
        onPress={() => handleInvoicePress(item)}
        activeOpacity={0.7}
      >
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
      </TouchableOpacity>
    );
  };

  const totalNewInvoice = newProducts.reduce(
    (acc, p) => acc + (parseFloat(p.price) * parseInt(p.cantidadTotal)),
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
                {isWeb ? "Consulta el historial de facturas" : "Gestiona tus facturas y ventas"}
              </ThemedText>
            </View>
            {!isWeb && (
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Crear factura</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filtros solo para web */}
          {isWeb && (
            <View style={[styles.filtersContainer, { backgroundColor: cardBackground, borderColor }]}>
              <View style={styles.filtersRow}>
                <View style={[styles.filterInput, { flex: 1 }]}>
                  <MaterialIcons name="search" size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor, borderColor }]}
                    placeholder="Buscar por cliente..."
                    value={clientFilter}
                    onChangeText={setClientFilter}
                    placeholderTextColor={textSecondary}
                  />
                </View>
              </View>

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
                    Mostrando {filteredInvoices.length} de {invoices.length} facturas
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

          {filteredInvoices.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: cardBackground, borderColor }]}>
              <MaterialIcons name="receipt-long" size={48} color={textSecondary} />
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                {isWeb && (startDate || endDate || clientFilter)
                  ? "No se encontraron facturas con los filtros aplicados."
                  : "No hay facturas registradas."}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredInvoices}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderInvoice}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          )}
        </View>
      </View>

      {/* Modal de detalles de factura */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setDetailModalVisible(false);
          setSelectedInvoice(null);
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <ScrollView 
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.modalContainer, { backgroundColor: cardBackground, borderColor }]}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle" style={styles.modalTitle}>
                  Detalles de la factura
                </ThemedText>
                <TouchableOpacity 
                  onPress={() => {
                    setDetailModalVisible(false);
                    setSelectedInvoice(null);
                  }} 
                  style={styles.closeButton}
                >
                  <MaterialIcons name="close" size={24} color={textColor} />
                </TouchableOpacity>
              </View>

              {loadingDetails ? (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.loadingText, { color: textSecondary }]}>Cargando...</Text>
                </View>
              ) : selectedInvoice ? (
                <>
                  <View style={[styles.invoiceInfoContainer, { backgroundColor: backgroundColor, borderColor }]}>
                    <View style={styles.infoRow}>
                      <View style={styles.infoLabelContainer}>
                        <MaterialIcons name="receipt" size={18} color={colors.primary} />
                        <Text style={[styles.infoLabel, { color: textSecondary }]}>ID Factura:</Text>
                      </View>
                      <Text style={[styles.infoValue, { color: textColor }]}>
                        #{selectedInvoice.id || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <View style={styles.infoLabelContainer}>
                        <MaterialIcons name="person" size={18} color={colors.primary} />
                        <Text style={[styles.infoLabel, { color: textSecondary }]}>Cliente:</Text>
                      </View>
                      <Text style={[styles.infoValue, { color: textColor }]}>
                        {selectedInvoice.cliente || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <View style={styles.infoLabelContainer}>
                        <MaterialIcons name="calendar-today" size={18} color={colors.primary} />
                        <Text style={[styles.infoLabel, { color: textSecondary }]}>Fecha:</Text>
                      </View>
                      <Text style={[styles.infoValue, { color: textColor }]}>
                        {selectedInvoice.fecha ? new Date(selectedInvoice.fecha).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {selectedInvoice.products && selectedInvoice.products.length > 0 && (
                    <>
                      <Text style={[styles.sectionTitle, { color: textColor, marginTop: 24 }]}>
                        Productos:
                      </Text>
                      <View style={styles.productsList}>
                        {selectedInvoice.products.map((product) => (
                          <View key={product.id} style={[styles.productRow, { backgroundColor: backgroundColor, borderColor }]}>
                            <View style={styles.productInfo}>
                              <Text style={[styles.productName, { color: textColor }]}>{product.name}</Text>
                              <View style={styles.productDetails}>
                                <Text style={[styles.productDetail, { color: textSecondary }]}>
                                  Cantidad: {product.quantity}
                                </Text>
                                <Text style={[styles.productDetail, { color: textSecondary }]}>
                                  Precio unitario: ${parseFloat(product.price.toString()).toLocaleString()}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.productTotalContainer}>
                              <Text style={[styles.productTotal, { color: colors.primary }]}>
                                ${parseFloat(product.total.toString()).toLocaleString()}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </>
                  )}

                  <View style={[styles.totalContainerModal, { backgroundColor: colors.primary + "15", borderColor: colors.primary, marginTop: 16 }]}>
                    <Text style={[styles.totalLabel, { color: textColor }]}>Total:</Text>
                    <Text style={[styles.totalTextModal, { color: colors.primary }]}>
                      ${selectedInvoice.total ? parseFloat(selectedInvoice.total.toString()).toLocaleString() : '0.00'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: colors.primary, marginTop: 24 }]}
                    onPress={() => {
                      setDetailModalVisible(false);
                      setSelectedInvoice(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalBtnText}>Cerrar</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.loadingText, { color: textSecondary }]}>No se encontraron detalles</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

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
                            ${(parseFloat(p.price) * parseInt(p.cantidadTotal)).toLocaleString()}
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
  // Estilos para modal de detalles
  invoiceInfoContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  productDetails: {
    marginTop: 4,
    gap: 4,
  },
  productDetail: {
    fontSize: 13,
  },
  productTotalContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  productTotal: {
    fontSize: 18,
    fontWeight: "700",
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
