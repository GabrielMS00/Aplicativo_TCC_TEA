import { Image, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { HighLightCards } from "../../components/HighLightCards";
import { TransactionsList } from "../../components/TransactionsList";
import { BorderlessButton, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useState } from "react";
import { HighLightValue } from "../../types/HighLightValue";
import { useAuth } from "../../hooks/Auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Screen = () => {

    const { logOut, user } = useAuth();

    // Função para limpar todas as transações de uma conta.
    const removeAll = () => {
        AsyncStorage.removeItem(`@go-finances:transactions_user:${user?.id}`);
    }

    const initialHighlightValue = {
        entrie: '0',
        lastEntrie: '',
        expensive: '0',
        lastExpensive: '',
        lastTransaction: ''
    }

    const [highLightValues, setHighlightValues] = useState<HighLightValue>(initialHighlightValue as HighLightValue);

    const avatar = 'https://wp-content.bluebus.com.br/wp-content/uploads/2017/03/31142426/twitter-novo-avatar-padrao-2017-bluebus-660x440.png';

    return (
        <GestureHandlerRootView>
            <View className="flex-1 bg-background">
                <View className="w-full bg-primary h-80 justify-center items-center flex-row">
                    <View className="w-full px-6 flex-row justify-between items-center -mt-28">
                        <View className="flex-row items-center ">
                            <Image
                                source={{ uri: user?.photo ? user.photo : avatar }}
                                resizeMode="cover"
                                className="w-16 h-16 rounded-full"
                            />
                            <View className="ml-4">
                                <Text className="text-shape text-xl">Olá,</Text>
                                <Text className="text-shape text-xl font-bold">{user?.name}</Text>
                            </View>
                        </View>

                        <BorderlessButton onPress={logOut}>
                            <Feather
                                name="power"
                                size={28}
                                color={'#FF872C'}
                            />
                        </BorderlessButton>

                    </View>
                </View>

                <HighLightCards
                    entrie={highLightValues.entrie}
                    lastEntrie={highLightValues.lastEntrie}
                    expensive={highLightValues.expensive}
                    lastExpensive={highLightValues.lastExpensive}
                    lastTransaction={highLightValues.lastTransaction}
                />

                <TransactionsList setHighLightValues={setHighlightValues} />
            </View>
        </GestureHandlerRootView>
    );
}

export default Screen;
