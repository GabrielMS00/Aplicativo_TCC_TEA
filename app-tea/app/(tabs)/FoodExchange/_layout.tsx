import { Stack } from "expo-router";

// Este layout controla a navegação DENTRO da seção FoodExchange
// Ex: MealOption -> FoodExchangeOption -> FoodExchangeRemake
const FoodExchangeLayout = () => {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            {/* Define as telas que fazem parte desta pilha de navegação */}
            <Stack.Screen name="MealOption" />
            <Stack.Screen name="FoodExchangeOption" />
            <Stack.Screen name="FoodExchangeRemake" />
             {/* Adicione outras telas específicas de FoodExchange aqui se criar mais */}
        </Stack>
    );
}

// Renomeado para refletir o propósito
export default FoodExchangeLayout;