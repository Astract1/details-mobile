import { Tabs } from "expo-router";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Platform } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      {/* TABS SOLO PARA MÓVIL - Gestión Transaccional */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Clientes",
          href: isWeb ? null : undefined,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          title: "Productos",
          href: isWeb ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="shopping-cart" size={28} color={color} />
          ),
        }}
      />

      {/* TAB COMPARTIDO - Visible en ambos */}
      <Tabs.Screen
        name="invoice"
        options={{
          title: "Facturas",
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialIcons
              name={focused ? "receipt" : "receipt-long"}
              size={28}
              color={color}
            />
          ),
        }}
      />

      {/* TABS SOLO PARA WEB - Reportes y Consultas */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          href: !isWeb ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="movements"
        options={{
          title: "Movimientos",
          href: !isWeb ? null : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialIcons
              name={focused ? "compare-arrows" : "swap-horiz"}
              size={28}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventario",
          href: !isWeb ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inventory" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
