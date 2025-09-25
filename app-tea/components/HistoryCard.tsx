import { Text, View } from "react-native";

type Props = {
    color: string;
    title: string;
    amount: string;
}

export const HistoryCard = ({ title, amount, color }: Props) => {
    return (
        <View
            className={`w-full bg-shape flex-row justify-between px-6 py-3 mb-2 rounded-md`}
            style={{  borderLeftWidth: 8, borderLeftColor: color }}
        >
            <Text className="font-medium text-lg">{title}</Text>
            <Text className="font-bold text-lg">{amount}</Text>
        </View>
    );
}
