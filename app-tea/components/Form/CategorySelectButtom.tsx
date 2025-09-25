import { Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

type Props = {
    title: string;
    onPress: () => void;
}

export const CategorySelectButtom = ({ title, onPress }: Props) => {
    return (
        <TouchableOpacity 
        activeOpacity={0.7}
        onPress={onPress}
        className="bg-shape flex-row justify-between items-center rounded-md py-5 px-4"
        >
            <Text className="font-medium text-lg">{title}</Text>
            <Feather
                name="chevron-down"
                size={20}
                color={'#969CB2'}
            />
        </TouchableOpacity>
    );
}
