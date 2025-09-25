import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Transaction } from "../types/Transaction";
import { categories } from "../data/categories";

export const TransactionCard = ({ ...data }: Transaction) => {

    const category = categories.filter(
        item => item.key === data.category
    )[0];

    const color = data.type === 'up' ? 'text-success' : 'text-attention';

    return (
        <View className="bg-shape rounded-md px-6 py-4 mb-4">
            <Text className="text-base font-medium">{data.name}</Text>
            <Text className={`text-xl font-semibold m-1 ${color}`}>{data.type === 'up' ? 'R$ ' : 'R$ -'}{data.amount}</Text>

            <View className="flex-row justify-between items-center mt-5">
                <View className="flex-row items-center">
                    <Feather
                        name={category.icon as any}
                        size={20}
                        color={'#969CB2'}
                    />
                    <Text className="text-text text-sm ml-4">{category.name}</Text>
                </View>

                <Text className="text-text text-sm">{data.date}</Text>
            </View>
        </View>
    );
}
