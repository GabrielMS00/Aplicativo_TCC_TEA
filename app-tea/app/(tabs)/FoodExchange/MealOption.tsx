import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MealTypeCard } from '../../../components/MealTypeCard';

const Screen = () => {

    const router = useRouter();

    const handleCardPress = () => {
        router.push('/FoodExchange/FoodExchangeOption');
    }

    return (
        <View className='flex-1 bg-background p-5'>

            <View className='flex-1 justify-center'>

                <Text className='text-5xl font-extrabold text-text text-center mt-16 mb-16'>Sugestões de Trocas</Text>

                <MealTypeCard name='Café da Manhã' icone='☕' onPress={handleCardPress}/>
                <MealTypeCard name='Café da Manhã' icone='🍽️' onPress={handleCardPress}/>
                <MealTypeCard name='Café da Manhã' icone='🥪' onPress={handleCardPress}/>
                <MealTypeCard name='Café da Manhã' icone='🥗' onPress={handleCardPress}/>

            </View>

        </View>
    );
};

export default Screen;
