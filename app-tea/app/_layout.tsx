import { Stack } from "expo-router";
import 'intl';
import 'intl/locale-data/jsonp/pt-BR';
import "../global.css";
import { AuthProvider } from '../context/AuthContext'; 

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootNavigation />
        </AuthProvider>
    );
}

// Componente separado para poder usar os hooks do Expo Router dentro do AuthProvider
function RootNavigation() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
        </Stack>
    );
}