import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { getApiUrl } from "@/constants/api";
import { useResponsive } from "@/hooks/use-responsive";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";

interface Cliente {
  id_cliente: number;
  nombre: string;
  direccion: string;
  telefono: string;
}

export default function ClientesScreen() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const { isWeb, width } = useResponsive();
  const colorScheme = useColorScheme() ?? "light"; // Forzar tema claro
  const colors = Colors[colorScheme];
  const backgroundColor = Colors[colorScheme].background;
  const cardBackground = Colors[colorScheme].backgroundCard;
  const borderColor = Colors[colorScheme].border;
  const textColor = Colors[colorScheme].text;
  const textSecondary = Colors[colorScheme].textSecondary;
  
  const maxContentWidth = isWeb && width > 768 ? 800 : undefined;
  const horizontalPadding = isWeb && width > 768 ? 40 : 16;

  // 🔹 Agregar o actualizar cliente
  const agregarCliente = async () => {
    if (!nombre.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return;
    }

    if (editandoId) {
      // Si se está editando un cliente existente
      const actualizados = clientes.map((c) =>
        c.id_cliente === editandoId ? { ...c, nombre, direccion, telefono } : c
      );
      setClientes(actualizados);
      setEditandoId(null);

      const response = await fetch(
        `${getApiUrl()}/clients/${editandoId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre,
            direccion,
            telefono,
          }),
        }
      );

      Alert.alert("Éxito", "Cliente actualizado correctamente");
    } else {
      // Crear nuevo cliente
      const nuevoCliente: Cliente = {
        id_cliente: clientes.length + 1,
        nombre,
        direccion,
        telefono,
      };
      setClientes([...clientes, nuevoCliente]);
      Alert.alert("Éxito", "Cliente agregado correctamente");

      const response = await fetch(`${getApiUrl()}/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          direccion,
          telefono,
        }),
      });

      console.log("RESPUESTA AGREGAR CLIENTES", response);
    }

    setNombre("");
    setDireccion("");
    setTelefono("");
  };

  // 🔹 Eliminar cliente
  const eliminarCliente = async (id: number) => {
    try {
      const response = await fetch(`${getApiUrl()}/clients/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el cliente");
      }

      // Actualizamos el estado eliminando el cliente
      setClientes((prevClientes) =>
        prevClientes.filter((c) => c.id_cliente !== id)
      );

      Alert.alert("Éxito", "Cliente eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar el cliente:", error);
      Alert.alert("Error", "No se pudo eliminar el cliente");
    }
  };

  // 🔹 Editar cliente (rellena formulario)
  const editarCliente = (cliente: Cliente) => {
    setNombre(cliente.nombre);
    setDireccion(cliente.direccion);
    setTelefono(cliente.telefono);
    setEditandoId(cliente.id_cliente);
    console.log(cliente);
  };

  useEffect(() => {
    const obtenerClientes = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/clients`);
        if (!response.ok) {
          throw new Error("Error al obtener los clientes");
        }

        const data = await response.json();
        setClientes(data);
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "No se pudo conectar con el servidor");
      }
    };

    obtenerClientes();
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
            <ThemedText type="title" style={styles.title}>
              Gestión de Clientes
            </ThemedText>
            <ThemedText type="default" style={[styles.subtitle, { color: textSecondary }]}>
              Registra, edita o elimina tus clientes fácilmente.
            </ThemedText>
          </View>

        {/* Formulario */}
        <View style={[styles.form, { backgroundColor: cardBackground, borderColor }]}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              placeholder="Nombre completo"
              value={nombre}
              onChangeText={setNombre}
              placeholderTextColor={textSecondary}
            />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="location-on" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              placeholder="Dirección"
              value={direccion}
              onChangeText={setDireccion}
              placeholderTextColor={textSecondary}
            />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="phone" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              placeholder="Teléfono"
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
              placeholderTextColor={textSecondary}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]} 
            onPress={agregarCliente}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {editandoId ? "Guardar Cambios" : "Agregar Cliente"}
            </Text>
          </TouchableOpacity>

          {editandoId && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { backgroundColor: colors.textSecondary }]}
              onPress={() => {
                setEditandoId(null);
                setNombre("");
                setDireccion("");
                setTelefono("");
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Cancelar Edición</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lista */}
        <View style={{ marginTop: 24 }}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Lista de Clientes
          </ThemedText>

          {clientes.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: cardBackground, borderColor }]}>
              <MaterialIcons name="people-outline" size={48} color={textSecondary} />
              <Text style={[styles.emptyText, { color: textSecondary }]}>No hay clientes registrados.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {clientes.map((item) => (
                <View key={item.id_cliente} style={[styles.clienteCard, { backgroundColor: cardBackground, borderColor }]}>
                  <View style={styles.cardContent}>
                    <View style={styles.cardIcon}>
                      <MaterialIcons name="person" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={[styles.clienteNombre, { color: textColor }]}>{item.nombre}</Text>
                      {item.direccion ? (
                        <View style={styles.cardDetail}>
                          <MaterialIcons name="location-on" size={16} color={textSecondary} />
                          <Text style={[styles.cardText, { color: textSecondary }]}>{item.direccion}</Text>
                        </View>
                      ) : null}
                      {item.telefono ? (
                        <View style={styles.cardDetail}>
                          <MaterialIcons name="phone" size={16} color={textSecondary} />
                          <Text style={[styles.cardText, { color: textSecondary }]}>{item.telefono}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      onPress={() => editarCliente(item)}
                      style={[styles.actionBtn, styles.editBtn, { backgroundColor: colors.success }]}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons name="edit" size={16} color="#fff" />
                      <Text style={styles.actionText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => eliminarCliente(item.id_cliente)}
                      style={[styles.actionBtn, styles.deleteBtn, { backgroundColor: colors.error }]}
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
        minHeight: "100vh",
      },
    }),
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
    ...Platform.select({
      web: {
        width: "100%",
      },
    }),
  },
  container: {
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
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
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
  cancelButton: {
    marginTop: 12,
  },
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
  listContainer: {
    gap: 12,
  },
  clienteCard: {
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
  clienteNombre: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  cardDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  editBtn: {
    // backgroundColor handled dynamically
  },
  deleteBtn: {
    // backgroundColor handled dynamically
  },
  actionText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
