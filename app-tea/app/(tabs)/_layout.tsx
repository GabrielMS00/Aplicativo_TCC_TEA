// app-tea/app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from '../../context/AuthContext'; // <-- ADICIONE

const TabLayout = () => {
    const { user } = useAuth(); // <-- ADICIONE

    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#87CFCF', headerShown: false }}>
            <Tabs.Screen
                name="Home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Feather size={28} name="home" color={color} />
                }}
            />

            {user?.tipo_usuario === 'cuidador' && (
                <Tabs.Screen
                    name="Register"
                    options={{
                        title: 'Cadastrar',
                        tabBarIcon: ({ color }) => <Feather size={28} name="user-plus" color={color} />
                    }}
                />
            )}

            <Tabs.Screen
                name="Account"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color }) => <Feather size={28} name="user" color={color} />
                }}
            />
        </Tabs>
    );
}

export default TabLayout;