import { Slot } from "expo-router";
import { StatusBar } from 'react-native';
import 'intl';
import 'intl/locale-data/jsonp/pt-BR';
import "../global.css";
import { AuthProvider } from "../hooks/Auth";

export default function RootLayout() {
    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <AuthProvider>
                <Slot />
            </AuthProvider>
        </>
    );
}
