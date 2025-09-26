import { Stack } from "expo-router";
import 'intl';
import 'intl/locale-data/jsonp/pt-BR';
import "../global.css";

export default function RootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
        </Stack>
    );
}
