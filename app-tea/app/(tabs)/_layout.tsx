import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";

const TabLayout = () => {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#87CFCF', headerShown: false }}>
            <Tabs.Screen
                name="Home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Feather size={28} name="home" color={color} />
                }}
            />
            <Tabs.Screen
                name="Register"
                options={{
                    title: 'Cadastrar',
                    tabBarIcon: ({ color }) => <Feather size={28} name="user-plus" color={color} />
                }}
            />
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