import { useColorScheme } from '@/components/useColorScheme';
import { useCart } from '@/src/contexts/CartContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { type ColorValue, Text, View } from 'react-native';

function CartBadge() {
  const { itemCount } = useCart();
  if (itemCount === 0) return null;
  return (
    <View
      style={{
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: '#E53E3E',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
        {itemCount > 99 ? '99+' : String(itemCount)}
      </Text>
    </View>
  );
}

function TabIcon({
  name,
  color,
  withBadge,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: ColorValue;
  withBadge?: boolean;
}) {
  return (
    <View>
      <Ionicons name={name} size={24} color={color as string} />
      {withBadge && <CartBadge />}
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tint = colorScheme === 'dark' ? '#fff' : '#2B6CB0';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tint,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <TabIcon name="home-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Produtos',
          tabBarIcon: ({ color }) => (
            <TabIcon name="grid-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Carrinho',
          tabBarIcon: ({ color }) => (
            <TabIcon name="cart-outline" color={color} withBadge />
          ),
        }}
      />
      <Tabs.Screen
        name="webhooks"
        options={{
          title: 'Webhooks',
          tabBarIcon: ({ color }) => (
            <TabIcon name="notifications-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <TabIcon name="person-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
