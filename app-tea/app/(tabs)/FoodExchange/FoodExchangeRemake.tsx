import React, { useState } from 'react';
import { View, Text, ScrollView, FlatList } from 'react-native';
import { Button } from '../../../components/Button';
import { FoodCardChecable } from '../../../components/FoodCardChecable';

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
        const selectedFoods = foodList.filter(food => food.isChecked);
        console.log('Alimentos selecionados:', selectedFoods.map(f => f.name));
    };

    return (
        <View className='flex-1 bg-background p-5'>

            <Text className='text-4xl font-extrabold text-text text-center mt-28 mb-8'>
                Selecione os alimentos aceitos
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
            />

            <View>
                <Button title='Prosseguir' type='success' className='my-4' onPress={handleProsseguir} />
            </View>

        </View>
    );
};

export default Screen;