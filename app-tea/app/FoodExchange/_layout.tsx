import { Stack } from "expo-router";

const FoodExchangeLayout = () => {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MealOption" />
            <Stack.Screen name="FoodExchangeOption" />
            <Stack.Screen name="FoodExchangeRemake" />
        </Stack>
    );
}

export default FoodExchangeLayout;