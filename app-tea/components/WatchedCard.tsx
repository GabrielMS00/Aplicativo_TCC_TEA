import { Text, TouchableOpacity, View } from "react-native";
import { CardData } from "../types/CardData";

export const WatchedCard = (card : CardData) => {
    return (
        <View
            className={`w-full bg-card flex-row justify-between px-6 py-3 mb-3 rounded-md h-40`}
            style={{ borderLeftWidth: 8, borderLeftColor: '#A6C98C' }}
        >
            <View>
                <Text className="font-bold text-2xl pb-2">{card.name}</Text>
                <Text className="font-medium text-lg">{`Idade: ${card.idade}`}</Text>
                <Text className="font-medium text-lg">{`Nível de suporte: ${card.suporte}`}</Text>
            </View>
            <View>
                <TouchableOpacity onPress={card.onPressOptions as any}>
                    <Text className="font-bold text-2xl">{'...'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
