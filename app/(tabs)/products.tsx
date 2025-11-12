import { ThemedText } from "@/components/themed-text";
import { getApiUrl } from "@/constants/api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsive } from "@/hooks/use-responsive";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useToast } from "@/components/toast/ToastContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Producto {
  id_producto: number;
  nombre: string;
  precio_unitario: number;
  stock: number;
}

export default function ProductsScreen() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);

  // Modal para edición
  const [modalVisible, setModalVisible] = useState(false);
  const [productoEdit, setProductoEdit] = useState<Producto | null>(null);

  // Confirmación de eliminación
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [productoToDelete, setProductoToDelete] = useState<number | null>(null);

  const { isWeb, width } = useResponsive();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const backgroundColor = Colors[colorScheme].background;
  const cardBackground = Colors[colorScheme].backgroundCard;
  const borderColor = Colors[colorScheme].border;
  const textColor = Colors[colorScheme].text;
  const textSecondary = Colors[colorScheme].textSecondary;
  const toast = useToast();

  const maxContentWidth = isWeb && width > 768 ? 800 : undefined;
  const horizontalPadding = isWeb && width > 768 ? 40 : 16;

  const agregarProducto = async () => {
    if (!nombre.trim() || !precio.trim()) {
      toast.error("El nombre y el precio son obligatorios");
      return;
    }

    const productoData = {
      nombre,
      precio_unitario: parseFloat(precio),
      stock: parseInt(stock) || 0,
    };

    setIsLoading(true);
    setNombre("");
    setPrecio("");
    setStock("");

    try {
      const response = await fetch(`${getApiUrl()}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productoData),
      });

      if (!response.ok) {
        throw new Error("Error al crear el producto");
      }

      // Recargar todos los productos
      const responseList = await fetch(`${getApiUrl()}/products`);
      const productosActualizados = await responseList.json();
      setProductos(productosActualizados);

      toast.success("Producto agregado correctamente");
    } catch (error) {
      console.error("ERROR CREAR PRODUCTOS", error);
      toast.error("No se pudo crear el producto");
    } finally {
      setIsLoading(false);
    }
  };

  const mostrarConfirmacionEliminar = (id: number) => {
    setProductoToDelete(id);
    setConfirmDialogVisible(true);
  };

  const eliminarProducto = async () => {
    if (!productoToDelete) return;

    setConfirmDialogVisible(false);

    try {
      const response = await fetch(`${getApiUrl()}/products/${productoToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar producto");

      // Recargar todos los productos desde el servidor
      const refreshResponse = await fetch(`${getApiUrl()}/products`);
      const updatedProductos = await refreshResponse.json();
      setProductos(updatedProductos);

      toast.success("Producto eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("No se pudo eliminar el producto");
    } finally {
      setProductoToDelete(null);
    }
  };

  const abrirModalEdicion = (producto: Producto) => {
    setProductoEdit(producto);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setProductoEdit(null);
  };

  const guardarCambios = async () => {
    if (!productoEdit) return;

    if (!productoEdit.nombre.trim() || productoEdit.precio_unitario <= 0) {
      toast.error("Nombre y precio deben ser válidos");
      return;
    }

    try {
      const response = await fetch(
        `${getApiUrl()}/products/${productoEdit.id_producto}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productoEdit),
        }
      );

      if (!response.ok) {
        throw new Error("Error al actualizar el producto");
      }

      // Recargar todos los productos desde el servidor
      const refreshResponse = await fetch(`${getApiUrl()}/products`);
      const updatedProductos = await refreshResponse.json();
      setProductos(updatedProductos);

      toast.success("Producto actualizado correctamente");
    } catch (error) {
      console.log("ERROR EDITAR PRODUCTOS", error);
      toast.error("No se pudo actualizar el producto");
    } finally {
      cerrarModal();
    }
  };

  const handleRefresh = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/products`);
      const data = await response.json();
      setProductos(data);
      toast.success("Productos actualizados");
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast.error("No se pudieron cargar los productos");
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

  console.log(productos);

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
                Gestión de Productos
              </ThemedText>
              <TouchableOpacity
                onPress={handleRefresh}
                style={[styles.refreshButton, { backgroundColor: colors.primary + "15" }]}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <ThemedText type="default" style={[styles.subtitle, { color: textSecondary }]}>
              Agrega y administra tus productos fácilmente
            </ThemedText>
          </View>

        {/* Formulario de creación */}
        <View style={[styles.form, { backgroundColor: cardBackground, borderColor }]}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="inventory-2" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              placeholder="Nombre del producto"
              value={nombre}
              onChangeText={setNombre}
              placeholderTextColor={textSecondary}
            />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="attach-money" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              placeholder="Precio unitario"
              value={precio}
              onChangeText={setPrecio}
              keyboardType="numeric"
              placeholderTextColor={textSecondary}
            />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="warehouse" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              placeholder="Stock disponible"
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
              placeholderTextColor={textSecondary}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
            onPress={agregarProducto}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Agregar Producto</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Lista de productos */}
        <View style={{ marginTop: 24 }}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Lista de Productos
          </ThemedText>

          {isLoadingList ? (
            <View style={[styles.loadingContainer, { backgroundColor: cardBackground, borderColor }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: textSecondary }]}>Cargando productos...</Text>
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
                    <View style={styles.cardIcon}>
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
                          <MaterialIcons name="warehouse" size={16} color={colors.warning} />
                          <Text style={[styles.cardStock, { color: colors.warning }]}>
                            Stock: {item.stock}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary }]}
                      onPress={() => abrirModalEdicion(item)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons name="edit" size={16} color="#fff" />
                      <Text style={styles.actionText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.error }]}
                      onPress={() => mostrarConfirmacionEliminar(item.id_producto)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons name="delete" size={16} color="#fff" />
                      <Text style={styles.actionText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Modal de edición */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={cerrarModal}
        >
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.modalContainer, { backgroundColor: cardBackground, borderColor }]}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle" style={styles.modalTitle}>Editar Producto</ThemedText>
                <TouchableOpacity onPress={cerrarModal} style={styles.closeButton}>
                  <MaterialIcons name="close" size={24} color={textColor} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <MaterialIcons name="inventory-2" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor, borderColor }]}
                  placeholder="Nombre"
                  value={productoEdit?.nombre || ""}
                  onChangeText={(text) =>
                    setProductoEdit((prev) =>
                      prev ? { ...prev, nombre: text } : prev
                    )
                  }
                  placeholderTextColor={textSecondary}
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialIcons name="attach-money" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor, borderColor }]}
                  placeholder="Precio unitario"
                  value={
                    productoEdit?.precio_unitario
                      ? productoEdit.precio_unitario.toString()
                      : ""
                  }
                  onChangeText={(text) =>
                    setProductoEdit((prev) =>
                      prev
                        ? { ...prev, precio_unitario: parseFloat(text) || 0 }
                        : prev
                    )
                  }
                  keyboardType="numeric"
                  placeholderTextColor={textSecondary}
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialIcons name="warehouse" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor, borderColor }]}
                  placeholder="Stock disponible"
                  value={productoEdit?.stock ? productoEdit.stock.toString() : ""}
                  onChangeText={(text) =>
                    setProductoEdit((prev) =>
                      prev ? { ...prev, stock: parseInt(text) || 0 } : prev
                    )
                  }
                  keyboardType="numeric"
                  placeholderTextColor={textSecondary}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.textSecondary }]}
                  onPress={cerrarModal}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalBtnText, { color: textColor }]}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                  onPress={guardarCambios}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalBtnText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmDialogVisible}
        title="Eliminar Producto"
        message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="error"
        onConfirm={eliminarProducto}
        onCancel={() => {
          setConfirmDialogVisible(false);
          setProductoToDelete(null);
        }}
      />
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
  } as any,
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
    ...Platform.select({
      web: {
        width: "100%",
      },
    }) as any,
  } as any,
  container: {
    flex: 1,
    width: "100%",
    ...Platform.select({
      web: {
        maxWidth: "100%",
      },
    }) as any,
  } as any,
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
  } as any,
  title: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  form: {
    marginTop: 10,
    borderRadius: 16,
    padding: 20,
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
  } as any,
  inputContainer: {
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
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
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
  } as any,
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    letterSpacing: 0.3,
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
  loadingContainer: {
    borderRadius: 16,
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    gap: 16,
  },
  loadingText: {
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
  } as any,
  cardContent: {
    flexDirection: "row",
    marginBottom: 16,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
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
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
    justifyContent: "center",
  },
  actionText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 500,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
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
  } as any,
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 4,
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
