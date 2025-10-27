import { Text, TouchableOpacity, View } from "react-native";

type Props = {
    food: string;
    foodGroup: string;
    preparation: string;
}

export const FoodCard = ({ food, foodGroup, preparation }: Props) => {
    return (
        <View
            className={`w-full px-6 py-3 mb-5 rounded-md h-32 border border-gray-500`}
        >
            <TouchableOpacity className="flex-1 flex-col justify-start items-start">
                <Text className="font-bold text-2xl pb-1">{food}</Text>
                <Text className="text-xl">{preparation}</Text>
                <Text className="text-xl">{foodGroup}</Text>
            </TouchableOpacity>
        </View>
    );
}
