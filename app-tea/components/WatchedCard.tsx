import { Text, TouchableOpacity, View } from "react-native";
import { CardData } from "../types/CardData";

export const WatchedCard = ({ id, name, idade, suporte, onPressOptions }: CardData) => {

    return (
        <View
            className={`w-full bg-card flex-row justify-between px-6 py-3 mb-3 rounded-md h-40`}
            style={{ borderLeftWidth: 8, borderLeftColor: '#A6C98C' }}
        >
            <View className="flex-1 mr-4">
                <Text className="font-bold text-2xl pb-2" numberOfLines={1} ellipsizeMode="tail">{name}</Text>
                <Text className="font-medium text-lg">{`Idade: ${idade}`}</Text>
                <Text className="font-medium text-lg">{`Nível de suporte: ${suporte}`}</Text>
            </View>
            <View>
                <TouchableOpacity onPress={() => onPressOptions(id, name)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text className="font-bold text-3xl leading-tight">...</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}