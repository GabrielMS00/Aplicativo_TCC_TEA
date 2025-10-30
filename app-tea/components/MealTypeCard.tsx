import { Text, Pressable, View } from "react-native";

type Props = {
    name: string;
    icone: string;
    onPress: () => void;
}

export const MealTypeCard = ({ name, icone, onPress }: Props) => {
    return (

        <Pressable onPress={onPress}>

            <View
                className={`w-full px-6 py-3 mb-5 rounded-md h-32 border border-gray-500 bg-card flex-row justify-between items-center`}
            >
                <Text className="font-bold text-3xl pb-2 text-text">{name}</Text>
                <Text className="text-6xl">{icone}</Text>
            </View>
        </Pressable>
    );
}