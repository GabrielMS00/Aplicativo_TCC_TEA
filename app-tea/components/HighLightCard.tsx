import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

type Props = {
    type: 'up' | 'down' | 'total';
    title: string;
    amount: string;
    lastTransaction: string;
}

const icon = {
    up: 'arrow-up-circle',
    down: 'arrow-down-circle',
    total: 'dollar-sign'
}

const color = {
    up: '#12A454',
    down: '#E83F5B',
    total: '#FFFFFF'
}


export const HighLightCard = ({ type, title, amount, lastTransaction }: Props) => {

    const textColor = type === 'total' ? 'text-shape' : 'text-black';
    const bgColor = type === 'total' ? 'bg-secondary' : 'bg-shape';

    return (
        <View className={`w-80 rounded-lg px-5 py-6 pb-11 m-4 ${bgColor}`}>
            <View className="flex-row justify-between">
                <Text className={`text-xl ${textColor}`}>{title}</Text>
                <Feather
                    name={icon[type] as any}
                    size={40}
                    color={color[type]}
                />
            </View>

            <View>
                <Text className={`font-bold text-4xl mt-8 ${type === 'total' ? "text-shape" : "text-black"}`}>R$ {amount}</Text>
                <Text 
                className={`text-sm ${textColor}`}>{lastTransaction}</Text>
            </View>
        </View>
    );
}
