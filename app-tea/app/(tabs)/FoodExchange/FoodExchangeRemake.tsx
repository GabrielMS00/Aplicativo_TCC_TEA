import React, { useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { Button } from '../../../components/Button';
import { FoodCardChecable } from '../../../components/FoodCardChecable';
import { router } from 'expo-router';

interface FoodItem {
    id: string;
    name: string;
    isChecked: boolean;
}

const MOCKED_FOOD_SUGGESTIONS = [
    { id: '1', name: 'Misto quente' },
    { id: '2', name: 'Banana' },
    { id: '3', name: 'Pão' },
    { id: '4', name: 'Maçã Cozida' },
    { id: '5', name: 'Iogurte' },
    { id: '6', name: 'Ovo Mexido' },
    { id: '7', name: 'Tapioca' },
    { id: '8', name: 'Mamão' },
    { id: '9', name: 'Queijo Branco' },
    { id: '10', name: 'Suco de Laranja' },
];

const Screen = () => {

    const [foodList, setFoodList] = useState<FoodItem[]>(
        MOCKED_FOOD_SUGGESTIONS.map(food => ({
            ...food,
            isChecked: false,
        }))
    );

    const handleCheckChange = (idDoItemClicado: string, newValue: boolean) => {
        setFoodList(currentFoodList =>
            currentFoodList.map(food =>
                food.id === idDoItemClicado
                    ? { ...food, isChecked: newValue }
                    : food
            )
        );
    };

    const handleProsseguir = () => {
        // const selectedFoods = foodList.filter(food => food.isChecked);
        // console.log('Alimentos selecionados:', selectedFoods.map(f => f.name));
        router.replace('/FoodExchange/FoodExchangeOption');
    };

    return (
        <View className='flex-1 bg-background p-5'>

            <Text className='text-4xl font-extrabold text-text text-center mt-28 mb-2'>
                Alimentos Aceitos
            </Text>

            <Text className='text-xl font-semibold text-text text-center mb-8'>
                Selecione todos os alimentos que foram aceitos
            </Text>

            <FlatList
                data={foodList}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <FoodCardChecable
                        foodName={item.name}
                        isChecked={item.isChecked}
                        onValueChange={(newValue) => handleCheckChange(item.id, newValue)}
                    />
                )}
                className='flex-1 mt-6'
                contentContainerStyle={{ paddingBottom: 20 }} 
            />

            <View>
                <Button title='Prosseguir' type='success' className='my-4' onPress={handleProsseguir} />
            </View>

        </View>
    );
};

export default Screen;