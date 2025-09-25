import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { categories } from "../../../data/categories";
import { Feather } from "@expo/vector-icons";
import { Buttom } from "../../../components/Form/Buttom";
import { GestureHandlerRootView } from 'react-native-gesture-handler';


type Category = {
    key: string;
    name: string;
}

type Props = {
    category: Category;
    setCategory: (category: Category) => void;
    closeSelectCategory: () => void;
}


const Screen = ({ category, setCategory, closeSelectCategory }: Props) => {

    const handleCategorySelect = (category: Category) => {
        setCategory(category);
    }

    return (
        <GestureHandlerRootView className="flex-1 bg-background pb-10">
            <View className="w-full h-32 bg-primary items-center justify-end pb-5">
                <Text className="text-shape text-lg font-semibold">Categoria</Text>
            </View>

            <FlatList
                data={categories}
                keyExtractor={(item) => item.key}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        className={`w-full p-5 flex-row items-center border-b-1 border-text 
                            ${category.key === item.key ? 'bg-secondary_light' : 'bg-background'}
                        `}
                        onPress={() => handleCategorySelect(item)}
                    >
                        <Feather
                            name={item.icon as any}
                            size={20}
                            className="mr-4"
                        />
                        <Text className="font-semibold text-lg">{item.name}</Text>
                    </TouchableOpacity>
                )}
                className="flex-1 w-full"
            />

            <View className="w-full px-6">
                <Buttom
                    title="Selecionar"
                    activeOpacity={0.7}
                    onPress={closeSelectCategory}
                />
            </View>
        </GestureHandlerRootView>
    );
}

export default Screen;
