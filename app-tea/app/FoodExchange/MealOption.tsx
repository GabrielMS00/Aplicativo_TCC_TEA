import { View, Text, Alert, TouchableOpacity, ScrollView } from 'react-native'; // <-- Adicionado ScrollView
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MealTypeCard } from '../../components/MealTypeCard';
import { useAuth } from '../../context/AuthContext';

const Screen = () => {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { assistidoId } = useLocalSearchParams<{ assistidoId?: string }>();

    const mealOptions = [
        { name: 'Café da Manhã', icone: '☕' },
        { name: 'Almoço', icone: '🍽️' },
        { name: 'Lanche', icone: '🥪' },
        { name: 'Jantar', icone: '🥗' },
    ];

    const handleCardPress = (mealName: string) => {
        if (!assistidoId) {
            Alert.alert("Erro", "ID do seu perfil não encontrado. Tente novamente.");
            console.error("MealOption: assistidoId não encontrado nos parâmetros.");
            return;
        }
        router.push({
            pathname: '/FoodExchange/FoodExchangeOption',
            params: { assistidoId: assistidoId, mealName: mealName }
        });
    }

    // Navega para a tela de Perfil (que está dentro das abas)
    const handleProfilePress = () => {
        router.push('/(tabs)/Account/Profile');
    }

    return (
        <View className='flex-1 bg-background'>

            {/* --- CABEÇALHO ATUALIZADO --- */}
            <View className="w-full bg-primary h-60 justify-center items-center flex-row">
                <View className="w-full px-6 flex-row justify-between items-center">
                    {/* Coluna da Esquerda: Olá + Nome */}
                    <View className="flex-row items-center ">
                        <View className="ml-4">
                            <Text className="text-text text-2xl">Olá,</Text>
                            <Text className="text-text text-4xl font-bold">{user?.nome || 'Usuário'}</Text>
                        </View>
                    </View>
                    {/* Coluna da Direita: Perfil + Sair */}
                    <View className="flex-col items-end">
                        <TouchableOpacity onPress={handleProfilePress}>
                            <Text className="text-text text-2xl font-bold">PERFIL</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={signOut}>
                            <Text className="text-attention text-2xl font-bold pt-3">SAIR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView
                className='flex-1'
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: 'center',
                    padding: 20
                }}
            >
                <Text className='text-4xl lg:text-5xl font-extrabold text-text text-center mb-16'>
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
            </ScrollView>
        </View>
    );
};

export default Screen;