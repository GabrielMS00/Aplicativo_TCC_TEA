import { View, Text, ScrollView } from 'react-native';
import { Button } from '../../../components/Button';
import { FoodCardChecable } from '../../../components/FoodCardChecable';

const Screen = () => {

    return (
        <View className='flex-1 bg-background p-5'>

            <Text className='text-4xl font-extrabold text-text text-center mt-28 mb-8'>
                Selecione os alimentos aceitos
            </Text>

            <ScrollView className='flex-1 mt-6'>
                <View>
                    {/* <FoodCardChecable food='Misto quente'/>
                    <FoodCardChecable food='Banana'/>
                    <FoodCardChecable food='Pão'/> */}
                </View>
            </ScrollView>

            <View>
                <Button title='Prosseguir' type='success' className='my-4' />
            </View>

        </View>
    );
};

export default Screen;
