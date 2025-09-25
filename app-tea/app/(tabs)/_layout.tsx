import { Redirect, Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../hooks/Auth";
import { ActivityIndicator, View } from "react-native";

const TabLayout = () => {

    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FF872C" />
            </View>
        );
    }

    if (user === null) {
        return <Redirect href="/" />;
    }

    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#FF872C', headerShown: false }}>
            <Tabs.Screen
                name="Dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color }) => <Feather size={28} name="list" color={color} />
                }}
            />
            <Tabs.Screen
                name="Register"
                options={{
                    title: 'Registrar',
                    headerShown: false,
                    tabBarIcon: ({ color }) => <Feather size={28} name="plus-circle" color={color} />
                }}
            />
            <Tabs.Screen
                name="Resume"
                options={{
                    title: 'Resumo',
                    headerShown: false,
                    tabBarIcon: ({ color }) => <Feather size={28} name="activity" color={color} />
                }}
            />
        </Tabs>
    );
}

export default TabLayout;
