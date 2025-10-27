import { Text, TouchableOpacity, View } from "react-native";

type Props = {
    name: string;
    icone: string;
    onPress: () => void;
}

export const MealTypeCard = ({ name, icone, onPress }: Props) => {
    return (
        <View
            className={`w-full px-6 py-3 mb-5 rounded-md h-32 border border-gray-500`}
        >
            <TouchableOpacity onPress={onPress} className="flex-1 flex-row justify-between items-center">
                <Text className="font-bold text-3xl pb-2">{name}</Text>
                <Text className="text-6xl">{icone}</Text>
            </TouchableOpacity>
        </View>
    );
}
