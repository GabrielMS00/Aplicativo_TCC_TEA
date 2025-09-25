import { Stack } from "expo-router";

const RegisterLayout = () => {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Register" />
            <Stack.Screen name="CategorySelect" />
        </Stack>
    );
}

export default RegisterLayout;
