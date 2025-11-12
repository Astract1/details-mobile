import { DatePicker } from "@/components/DatePicker";
import { ThemedText } from "@/components/themed-text";
import { useToast } from "@/components/toast/ToastContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getApiUrl } from "@/constants/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsive } from "@/hooks/use-responsive";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);

  // Estados para autocompletado de clientes
  const [clients, setClients] = useState<any[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);

  // Estados para selector de productos
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

  // Estados de filtros (solo para web)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [clientFilter, setClientFilter] = useState("");

  const toast = useToast();
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

  // Seleccionar un cliente del autocompletado
  const selectClient = (clientName: string) => {
    setClientName(clientName);
    setShowClientSuggestions(false);
  };

  // Agregar producto desde el selector
  const handleAddProductFromPicker = (product: any) => {
    const alreadyAdded = newProducts.find((p) => p.id === product.id);
    if (alreadyAdded) {
      toast.warning("Este producto ya fue agregado");
      return;
    }

    if (product.quantity <= 0) {
      toast.error("Este producto no tiene stock disponible");
      return;
    }

    setNewProducts([...newProducts, { ...product, cantidadTotal: 1 }]);
    setShowProductPicker(false);
    setProductSearchTerm("");
    toast.success("Producto agregado");
  };

  const handleAddProduct = () => {
    const id = Number(productId);
    const found = availableProducts.find((p) => p.id === id);
    if (!found) {
      toast.error("Producto no encontrado");
      return;
    }
    const alreadyAdded = newProducts.find((p) => p.id === id);
    if (alreadyAdded) {
      toast.warning("Este producto ya fue agregado");
      return;
    }

    setNewProducts([...newProducts, { ...found, cantidadTotal: 1 }]);
    setProductId("");
    toast.success("Producto agregado");
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
    if (!clientName.trim()) {
      toast.error("Debe ingresar el nombre del cliente");
      return;
    }
    if (newProducts.length === 0) {
      toast.error("Debe agregar al menos un producto");
      return;
    }

    const total = newProducts.reduce(
      (acc, p) => acc + (parseFloat(p.price) * parseInt(p.cantidadTotal)),
      0
    );

    console.log("newProducts", newProducts);

    setIsLoading(true);

    const clientNameToSave = clientName;
    const productsToSave = [...newProducts];

    setModalVisible(false);
    setClientName("");
    setProductId("");
    setNewProducts([]);

    const fecha = new Date().toISOString().slice(0, 19).replace("T", " ");

    console.log(total, fecha);

    console.log("PRODUCTOS", productsToSave);
    let data: any;
    try {
      const response = await fetch(`${getApiUrl()}/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente: clientNameToSave,
          fecha,
          total,
          products: productsToSave.length,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "Error al crear la factura");
        return;
      }

      data = await response.json();

      if (!data.factura || !data.factura.id_factura) {
        toast.error("La respuesta del servidor no contiene la información esperada");
        return;
      }

      // Recargar todas las facturas desde el servidor para mantener sincronización
      const refreshResponse = await fetch(`${getApiUrl()}/invoices`);
      const updatedInvoices = await refreshResponse.json();
      setInvoices(updatedInvoices);
      setFilteredInvoices(updatedInvoices);

      console.log("RESPUESTA CREAR FACTURA:", data);
      toast.success("Factura creada correctamente");

      // Actualizar productos
      try {
        const response = await fetch(`${getApiUrl()}/products`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cliente: clientNameToSave.trim(),
            total,
            newProducts: productsToSave,
            id_factura: data.factura.id_factura,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.log("ERROR ACTUALIZANDO PRODUCTOS", errorData);
          toast.warning("La factura se creó pero hubo un error al actualizar los productos");
        } else {
          console.log("RESPUESTA ACTUALIZAR PRODUCTOS", response);
        }
      } catch (error) {
        console.log("ERROR ACTUALIZANDO PRODUCTOS", error);
        toast.warning("La factura se creó pero hubo un error al actualizar los productos");
      }
    } catch (error) {
      console.log("ERROR CREANDO FACTURA", error);
      toast.error("No se pudo crear la factura. Por favor, intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar clientes
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/clients`);
        const data = await response.json();
        setClients(data);
      } catch (error) {
        console.error("Error al cargar clientes:", error);
      }
    };

    if (modalVisible) {
      fetchClients();
    }
  }, [modalVisible]);

  // Cargar productos
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
        setFilteredProducts(products);
      } catch (error) {
        console.error("Error al cargar productos:", error);
        toast.error("No se pudieron cargar los productos");
      }
    };

    if (modalVisible) {
      fetchProductos();
    }
  }, [modalVisible]);

  // Filtrar clientes mientras escribe
  useEffect(() => {
    if (clientName.trim() === "") {
      setFilteredClients([]);
      setShowClientSuggestions(false);
      return;
    }

    const filtered = clients.filter(client =>
      client.nombre.toLowerCase().includes(clientName.toLowerCase())
    );
    setFilteredClients(filtered);
    setShowClientSuggestions(filtered.length > 0);
  }, [clientName, clients]);

  // Filtrar productos por búsqueda
  useEffect(() => {
    if (productSearchTerm.trim() === "") {
      setFilteredProducts(availableProducts);
      return;
    }

    const filtered = availableProducts.filter(product =>
      product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [productSearchTerm, availableProducts]);

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoadingList(true);
      try {
        const response = await fetch(`${getApiUrl()}/invoices`);
        const data = await response.json();

        console.log("INVOICES", data);

        setInvoices(data);
        setFilteredInvoices(data);
      } catch (error) {
        console.error("Error al cargar facturas:", error);
        toast.error("No se pudieron cargar las facturas");
      } finally {
        setIsLoadingList(false);
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
        toast.error(errorData.message || "No se pudieron cargar los detalles de la factura");
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
      toast.error("No se pudieron cargar los detalles de la factura");
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
            <View style={{ flex: 1 }}>
              <ThemedText type="title" style={styles.title}>
                Facturas
              </ThemedText>
              <ThemedText type="default" style={[styles.subtitle, { color: textSecondary }]}>
                {isWeb ? "Consulta el historial de facturas" : "Gestiona tus facturas y ventas"}
              </ThemedText>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <ThemeToggle />
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
                <View style={{ flex: 1 }}>
                  <DatePicker
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="Fecha inicio"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <DatePicker
                    value={endDate}
                    onChange={setEndDate}
                    placeholder="Fecha fin"
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
                <View style={styles.filterActionsRow}>
                  <TouchableOpacity
                    style={[styles.exportBtn, { backgroundColor: colors.success }]}
                    onPress={() => {
                      const params = new URLSearchParams();
                      if (startDate) params.append('start_date', startDate);
                      if (endDate) params.append('end_date', endDate);
                      if (clientFilter) params.append('client', clientFilter);
                      const url = `${getApiUrl()}/export/invoices/excel?${params.toString()}`;
                      if (Platform.OS === 'web') {
                        window.open(url, '_blank');
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="file-download" size={18} color="#fff" />
                    <Text style={styles.exportBtnText}>Excel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.exportBtn, { backgroundColor: colors.error }]}
                    onPress={() => {
                      const params = new URLSearchParams();
                      if (startDate) params.append('start_date', startDate);
                      if (endDate) params.append('end_date', endDate);
                      if (clientFilter) params.append('client', clientFilter);
                      const url = `${getApiUrl()}/export/invoices/pdf?${params.toString()}`;
                      if (Platform.OS === 'web') {
                        window.open(url, '_blank');
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="picture-as-pdf" size={18} color="#fff" />
                    <Text style={styles.exportBtnText}>PDF</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterBtn, { backgroundColor: colors.textSecondary }]}
                    onPress={clearFilters}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="clear" size={18} color="#fff" />
                    <Text style={styles.filterBtnText}>Limpiar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {isLoadingList ? (
            <View style={[styles.loadingListContainer, { backgroundColor: cardBackground, borderColor }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingListText, { color: textSecondary }]}>
                Cargando facturas...
              </Text>
            </View>
          ) : filteredInvoices.length === 0 ? (
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

              {/* Autocompletado de clientes */}
              <View style={{ position: 'relative', zIndex: 1000 }}>
                <View style={[styles.inputContainer, { borderColor }]}>
                  <MaterialIcons name="person" size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Buscar o escribir nombre del cliente"
                    value={clientName}
                    onChangeText={setClientName}
                    placeholderTextColor={textSecondary}
                    autoCapitalize="words"
                  />
                </View>

                {/* Sugerencias de clientes */}
                {showClientSuggestions && filteredClients.length > 0 && (
                  <View style={[styles.suggestionsContainer, { backgroundColor: cardBackground, borderColor }]}>
                    <ScrollView style={styles.suggestionsList} nestedScrollEnabled={true}>
                      {filteredClients.map((client) => (
                        <TouchableOpacity
                          key={client.id_cliente}
                          style={[styles.suggestionItem, { borderBottomColor: borderColor }]}
                          onPress={() => selectClient(client.nombre)}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons name="person" size={18} color={colors.primary} />
                          <View style={{ marginLeft: 10, flex: 1 }}>
                            <Text style={[styles.suggestionText, { color: textColor }]}>{client.nombre}</Text>
                            {client.telefono && (
                              <Text style={[styles.suggestionSubtext, { color: textSecondary }]}>{client.telefono}</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Selector visual de productos */}
              <TouchableOpacity
                style={[styles.productPickerButton, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
                onPress={() => setShowProductPicker(true)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="add-shopping-cart" size={22} color={colors.primary} />
                <Text style={[styles.productPickerButtonText, { color: colors.primary }]}>
                  Buscar y agregar productos
                </Text>
              </TouchableOpacity>

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
                  disabled={isLoading}
                >
                  <Text style={[styles.modalBtnText, { color: textColor }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveInvoice}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalBtnText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de selector de productos */}
      <Modal
        visible={showProductPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProductPicker(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.productPickerModal, { backgroundColor: cardBackground, borderColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Seleccionar producto
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowProductPicker(false);
                  setProductSearchTerm("");
                }}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            {/* Búsqueda de productos */}
            <View style={[styles.inputContainer, { borderColor }]}>
              <MaterialIcons name="search" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Buscar producto por nombre..."
                value={productSearchTerm}
                onChangeText={setProductSearchTerm}
                placeholderTextColor={textSecondary}
                autoFocus
                autoCapitalize="none"
              />
            </View>

            {/* Lista de productos */}
            <ScrollView style={styles.productPickerList} showsVerticalScrollIndicator={false}>
              {filteredProducts.length === 0 ? (
                <View style={styles.emptyProductsContainer}>
                  <MaterialIcons name="inventory-2" size={48} color={textSecondary} />
                  <Text style={[styles.emptyText, { color: textSecondary }]}>
                    No se encontraron productos
                  </Text>
                </View>
              ) : (
                filteredProducts.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={[styles.productPickerItem, { backgroundColor: backgroundColor, borderColor }]}
                    onPress={() => handleAddProductFromPicker(product)}
                    activeOpacity={0.7}
                    disabled={product.quantity <= 0}
                  >
                    <View style={[styles.productPickerIcon, { backgroundColor: colors.primary + "15" }]}>
                      <MaterialIcons name="inventory-2" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.productPickerInfo}>
                      <Text style={[styles.productPickerName, { color: textColor }]}>
                        {product.name}
                      </Text>
                      <View style={styles.productPickerDetails}>
                        <View style={styles.productPickerDetail}>
                          <MaterialIcons name="attach-money" size={16} color={colors.success} />
                          <Text style={[styles.productPickerDetailText, { color: colors.success }]}>
                            ${parseFloat(product.price).toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.productPickerDetail}>
                          <MaterialIcons
                            name="inventory"
                            size={16}
                            color={product.quantity > 10 ? colors.success : product.quantity > 0 ? "#FFA500" : colors.error}
                          />
                          <Text style={[
                            styles.productPickerDetailText,
                            { color: product.quantity > 10 ? colors.success : product.quantity > 0 ? "#FFA500" : colors.error }
                          ]}>
                            Stock: {product.quantity}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <MaterialIcons
                      name={product.quantity > 0 ? "add-circle" : "block"}
                      size={28}
                      color={product.quantity > 0 ? colors.primary : colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
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
    }) as any,
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
        boxShadow: "0 4px 12px rgba(0, 122, 255, 0.3)" as any,
      },
      default: {
        shadowColor: "#007AFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      },
    }) as any,
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
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)" as any,
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
      },
    }) as any,
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
  filterActionsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  exportBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  loadingListContainer: {
    borderRadius: 16,
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 40,
  },
  loadingListText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  // Estilos para autocompletado de clientes
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" as any,
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
      },
    }) as any,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  suggestionSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  // Estilos para selector de productos
  productPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 10,
    marginBottom: 12,
  },
  productPickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  productPickerModal: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    maxWidth: 600,
    width: '90%',
    maxHeight: '80%',
    alignSelf: 'center',
    ...Platform.select({
      web: {
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)" as any,
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
      },
    }) as any,
  },
  productPickerList: {
    marginTop: 16,
  },
  emptyProductsContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  productPickerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productPickerInfo: {
    flex: 1,
  },
  productPickerName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  productPickerDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  productPickerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productPickerDetailText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
