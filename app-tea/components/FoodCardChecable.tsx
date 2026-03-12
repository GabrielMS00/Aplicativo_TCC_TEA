import { Text, View } from "react-native";
import Checkbox from 'expo-checkbox';

interface Props {
    foodName: string;
    isChecked: boolean;
    onValueChange: (newValue: boolean) => void;
}

export const FoodCardChecable = ({ foodName, isChecked, onValueChange }: Props) => {
    return (
        <View
            className={`
                w-full px-6 py-3 mb-5 rounded-md h-16 border border-gray-500
                flex-row items-center justify-between
            `}
        >
            <Text className="font-bold text-2xl pb-1">{foodName}</Text>

            <Checkbox
                className="w-6 h-6 rounded"
                value={isChecked}
                onValueChange={onValueChange}
                color={isChecked ? '#4A90E2' : undefined}
            />
        </View>
    );
}