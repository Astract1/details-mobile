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
} from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

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
        `http://localhost:3000/clients/${editandoId}`,
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

      const response = await fetch(`http://localhost:3000/clients`, {
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
      const response = await fetch(`http://localhost:3000/clients/${id}`, {
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
        const response = await fetch("http://localhost:3000/clients");
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
    <ScrollView
      showsVerticalScrollIndicator={true}
      contentContainerStyle={{ paddingBottom: 5 }}
    >
      <ThemedView style={styles.container}>
        {/* Encabezado */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Gestión de Clientes
          </ThemedText>
          <ThemedText type="default">
            Registra, edita o elimina tus clientes fácilmente.
          </ThemedText>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Nombre completo"
            value={nombre}
            onChangeText={setNombre}
            placeholderTextColor="#777"
          />
          <TextInput
            style={styles.input}
            placeholder="Dirección"
            value={direccion}
            onChangeText={setDireccion}
            placeholderTextColor="#777"
          />
          <TextInput
            style={styles.input}
            placeholder="Teléfono"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            placeholderTextColor="#777"
          />

          <TouchableOpacity style={styles.button} onPress={agregarCliente}>
            <Text style={styles.buttonText}>
              {editandoId ? "Guardar Cambios" : "Agregar Cliente"}
            </Text>
          </TouchableOpacity>

          {editandoId && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setEditandoId(null);
                setNombre("");
                setDireccion("");
                setTelefono("");
              }}
            >
              <Text style={styles.buttonText}>Cancelar Edición</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lista */}
        <View style={{ marginTop: 24 }}>
          <ThemedText type="subtitle" style={styles.subtitle}>
            Lista de Clientes
          </ThemedText>

          {clientes.length === 0 ? (
            <Text style={styles.emptyText}>No hay clientes registrados.</Text>
          ) : (
            <FlatList
              data={clientes}
              keyExtractor={(item) => item.id_cliente.toString()}
              renderItem={({ item }) => (
                <View style={styles.clienteCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.actions}>
                      <TouchableOpacity
                        onPress={() => editarCliente(item)}
                        style={[
                          styles.actionBtn,
                          { backgroundColor: "#4CAF50" },
                        ]}
                      >
                        <Text style={styles.actionText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => eliminarCliente(item.id_cliente)}
                        style={[
                          styles.actionBtn,
                          { backgroundColor: "#FF3B30" },
                        ]}
                      >
                        <Text style={styles.actionText}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.clienteNombre}>{item.nombre}</Text>
                  {item.direccion ? (
                    <Text style={styles.cardText}>📍 {item.direccion}</Text>
                  ) : null}
                  {item.telefono ? (
                    <Text style={styles.cardText}>📞 {item.telefono}</Text>
                  ) : null}
                </View>
              )}
            />
          )}
        </View>
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
  cancelButton: {
    backgroundColor: "#6B7280",
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
  clienteCard: {
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  clienteNombre: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222",
  },
  cardText: {
    color: "#555",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
});
