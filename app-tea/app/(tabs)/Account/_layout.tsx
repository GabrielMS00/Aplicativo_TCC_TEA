import { Stack } from "expo-router";

const AccountLayout = () => {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Profile" />
            <Stack.Screen name="ChangePassword" />
        </Stack>
    );
}

export default AccountLayout;
