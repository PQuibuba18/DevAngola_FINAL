import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '../../constants/Colors';

function Icon({ icon, color }: { icon: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{icon}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   Colors.red,
        tabBarInactiveTintColor: Colors.ink400,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor:  Colors.ink100,
          borderTopWidth:  1,
          height:          60,
          paddingBottom:   8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerShown:      false,
      }}
    >
      <Tabs.Screen name="feed"     options={{ title: 'Feed',      tabBarIcon: ({ color }) => <Icon icon="⊡"  color={color} /> }} />
      <Tabs.Screen name="jobs"     options={{ title: 'Vagas',     tabBarIcon: ({ color }) => <Icon icon="💼" color={color} /> }} />
      <Tabs.Screen name="new-post" options={{ title: 'Publicar',  tabBarIcon: ({ color }) => <Icon icon="＋" color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Mensagens', tabBarIcon: ({ color }) => <Icon icon="✉"  color={color} /> }} />
      <Tabs.Screen name="profile"  options={{ title: 'Perfil',    tabBarIcon: ({ color }) => <Icon icon="◉"  color={color} /> }} />
    </Tabs>
  );
}
