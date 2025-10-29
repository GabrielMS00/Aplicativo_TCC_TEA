import { View, Text, Alert } from 'react-native'; // Adicionar Alert
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MealTypeCard } from '../../../components/MealTypeCard';

const Screen = () => {
    const router = useRouter();
    // Pega o assistidoId passado como parâmetro da tela Home
    const { assistidoId } = useLocalSearchParams<{ assistidoId?: string }>();

    // Lista de refeições (mantida)
    const mealOptions = [
        { name: 'Café da Manhã', icone: '☕' },
        { name: 'Almoço', icone: '🍽️' },
        { name: 'Lanche', icone: '🥪' },
        { name: 'Jantar', icone: '🥗' },
    ];

    const handleCardPress = (mealName: string) => {
        if (!assistidoId) {
             Alert.alert("Erro", "ID do assistido não encontrado. Tente voltar para a Home e selecionar novamente.");
             console.error("MealOption: assistidoId não encontrado nos parâmetros.");
             return;
        }
        // Navega para a próxima tela passando o assistidoId e o nome da refeição
        router.push({
            // Ajuste o path se necessário (depende de onde a pasta FoodExchange está)
            pathname: '(tabs)/FoodExchange/FoodExchangeOption',
            params: { assistidoId: assistidoId, mealName: mealName }
        });
    }

    return (
        <View className='flex-1 bg-background p-5'>
            <View className='flex-1 justify-center'>
                <Text className='text-4xl lg:text-5xl font-extrabold text-text text-center mt-16 mb-16'>
                    Gerar Sugestão Para:
                </Text>
                {mealOptions.map((meal) => (
                     <MealTypeCard
                        key={meal.name}
                        name={meal.name}
                        icone={meal.icone}
                        onPress={() => handleCardPress(meal.name)}
                    />
                ))}
            </View>
        </View>
    );
};

export default Screen;