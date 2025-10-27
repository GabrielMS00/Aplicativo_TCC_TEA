import { View, Text, ScrollView } from 'react-native';
import { FoodCard } from '../../../components/FoodCard';

const Screen = () => {

    return (
        <View className='flex-1 bg-background p-5'>

            <Text className='text-5xl font-extrabold text-text text-center mt-28 mb-8'> 
                Café da Manhã
            </Text>

            <ScrollView className='flex-1 mt-16'> 
                <View> 
                    <FoodCard food='Misto quente' preparation='Assado' foodGroup='Outros' />
                    <FoodCard food='Banana' preparation='Natural' foodGroup='Frutas' />
                    <FoodCard food='Pão' preparation='Natural' foodGroup='Cereal e Tubérculo' />
                </View>
            </ScrollView>

        </View>
    );
};

export default Screen;
