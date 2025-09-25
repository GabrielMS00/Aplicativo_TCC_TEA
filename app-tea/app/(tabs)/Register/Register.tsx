import { Text, View, Modal } from "react-native";
import { Form } from "../../../components/Form/Form";
import { useState } from "react";
import CategorySelect from './CategorySelect'


const Screen = () => {

    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [category, setCategory] = useState({
        key: 'category',
        name: 'Categoria',
    });

    const handleCloseSelectCategory = () => {
        setCategoryModalOpen(false);
    }

    const handleOpenSelectCategory = () => {
        setCategoryModalOpen(true);
    }

    const resetCategory = () => {
        setCategory(
            {
                key: 'category',
                name: 'Categoria',
            }
        )
    }

    return (
        <View className="flex-1 bg-background pb-5">
            <View className="bg-primary w-full h-32 items-center justify-end pb-5">
                <Text className="text-shape text-lg font-semibold">Cadastro</Text>
            </View>

            <Form
                openCategory={handleOpenSelectCategory}
                category={category as any}
                resetCategory={resetCategory}
            />

            <Modal visible={categoryModalOpen}>
                <CategorySelect
                    category={category}
                    setCategory={setCategory}
                    closeSelectCategory={handleCloseSelectCategory}
                />
            </Modal>
        </View>
    );
}

export default Screen;
