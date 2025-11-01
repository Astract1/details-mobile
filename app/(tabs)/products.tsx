import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";

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

  // Modal para edición
  const [modalVisible, setModalVisible] = useState(false);
  const [productoEdit, setProductoEdit] = useState<Producto | null>(null);

  const agregarProducto = async () => {
    if (!nombre.trim() || !precio.trim()) {
      Alert.alert("Error", "El nombre y el precio son obligatorios");
      return;
    }

    const nuevoProducto: Producto = {
      id_producto: Math.floor(Math.random() * 1000000) + 1,
      nombre,
      precio_unitario: parseFloat(precio),
      stock: parseInt(stock) || 0,
    };

    setProductos([...productos, nuevoProducto]);
    setNombre("");
    setPrecio("");
    setStock("");

    try {
      console.log(nuevoProducto);
      const response = await fetch("http://localhost:3000/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoProducto),
      });

      console.log("RESPUESTA CREAR PRODUCTOS", response);
    } catch (error) {
      console.log("ERROR CREAR PRODUCTOS", error);
    }
  };

  const eliminarProducto = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/products/${id}`, {
        method: "DELETE",
      });

      console.log(response);
      console.log(await response.json());

      if (!response.ok) throw new Error("Error al eliminar producto");

      setProductos((prev) => prev.filter((p) => p.id_producto !== id));
      Alert.alert("Éxito", "Producto eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar:", error);
      Alert.alert("Error", "No se pudo eliminar el producto");
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
      Alert.alert("Error", "Nombre y precio deben ser válidos");
      return;
    }

    console.log(productoEdit);

    try {
      const response = await fetch(
        `http://localhost:3000/products/${productoEdit.id_producto}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productoEdit),
        }
      );

      const nuevos = productos.map((p) =>
        p.id_producto === productoEdit.id_producto ? productoEdit : p
      );
      setProductos(nuevos);
    } catch (error) {
      console.log("ERROR EDITAR PRODUCTOS", error);
    } finally {
      cerrarModal();
    }
  };

  const handleRefresh = async () => {
    try {
      console.log("aaaaaa");
      const response = await fetch("http://localhost:3000/products");
      const data = await response.json();
      setProductos(data);

      console.log("PRODUCTOS REFRESCADOS", data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      Alert.alert("Error", "No se pudieron cargar los productos");
    }
  };

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch("http://localhost:3000/products");
        const data = await response.json();
        setProductos(data);
      } catch (error) {
        console.error("Error al cargar productos:", error);
        Alert.alert("Error", "No se pudieron cargar los productos");
      }
    };

    fetchProductos();
  }, []);

  console.log(productos);

  return (
    <ScrollView
      showsVerticalScrollIndicator={true}
      contentContainerStyle={{ paddingBottom: 5 }}
    >
      <ThemedView style={styles.container}>
        {/* Encabezado */}
        {/* Encabezado con botón de refrescar */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <ThemedText type="title" style={styles.title}>
              Gestión de Productos
            </ThemedText>

            <TouchableOpacity
              onPress={handleRefresh}
              style={styles.refreshButton}
            >
              <Ionicons name="refresh" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <ThemedText type="default">
            Agrega y administra tus productos fácilmente
          </ThemedText>
        </View>

        {/* Formulario de creación */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Nombre del producto"
            value={nombre}
            onChangeText={setNombre}
            placeholderTextColor="#777"
          />
          <TextInput
            style={styles.input}
            placeholder="Precio unitario"
            value={precio}
            onChangeText={setPrecio}
            keyboardType="numeric"
            placeholderTextColor="#777"
          />
          <TextInput
            style={styles.input}
            placeholder="Stock disponible"
            value={stock}
            onChangeText={setStock}
            keyboardType="numeric"
            placeholderTextColor="#777"
          />

          <TouchableOpacity style={styles.button} onPress={agregarProducto}>
            <Text style={styles.buttonText}>Agregar Producto</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de productos */}
        <View style={{ marginTop: 24 }}>
          <ThemedText type="subtitle" style={styles.subtitle}>
            Lista de Productos
          </ThemedText>

          {productos.length === 0 ? (
            <Text style={styles.emptyText}>No hay productos registrados.</Text>
          ) : (
            <FlatList
              data={productos}
              keyExtractor={(item) => item.id_producto.toString()}
              renderItem={({ item }) => (
                <View style={styles.productCard}>
                  <View style={styles.cardHeader}>
                    <View>
                      <IconSymbol name="cube.fill" size={22} color="#007AFF" />
                      <Text style={styles.productName}>{item.nombre}</Text>
                    </View>
                    <View>
                      <IconSymbol name="cube.fill" size={22} color="#007AFF" />
                      <Text style={styles.productName}>
                        Id: {item.id_producto}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardText}>
                    💲 Precio: ${item.precio_unitario}
                  </Text>
                  <Text style={styles.cardText}>📦 Stock: {item.stock}</Text>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: "#007AFF" },
                      ]}
                      onPress={() => abrirModalEdicion(item)}
                    >
                      <Text style={styles.actionText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: "#FF3B30" },
                      ]}
                      onPress={() => eliminarProducto(item.id_producto)}
                    >
                      <Text style={styles.actionText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        {/* Modal de edición */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={cerrarModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Editar Producto</Text>

              <TextInput
                style={styles.input}
                placeholder="Nombre"
                value={productoEdit?.nombre || ""}
                onChangeText={(text) =>
                  setProductoEdit((prev) =>
                    prev ? { ...prev, nombre: text } : prev
                  )
                }
              />

              <TextInput
                style={styles.input}
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
              />

              <TextInput
                style={styles.input}
                placeholder="Stock disponible"
                value={productoEdit?.stock ? productoEdit.stock.toString() : ""}
                onChangeText={(text) =>
                  setProductoEdit((prev) =>
                    prev ? { ...prev, stock: parseInt(text) || 0 } : prev
                  )
                }
                keyboardType="numeric"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: "#007AFF" }]}
                  onPress={guardarCambios}
                >
                  <Text style={styles.buttonText}>Guardar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: "#777" }]}
                  onPress={cerrarModal}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F6F8FA",
    flex: 1,
  },
  header: {
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  form: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#FAFAFA",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 10,
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  productName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222",
  },
  cardText: {
    color: "#555",
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 8,
  },
  actionText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  btn: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 10,
  },
});
