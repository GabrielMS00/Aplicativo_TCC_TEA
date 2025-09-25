import { View, TouchableWithoutFeedback, Keyboard, Alert } from "react-native";
import { InputForm } from "./InputForm";
import { Buttom } from "./Buttom";
import { TransactionTypeButtom } from "./TransactionTypeButtom";
import { useState } from "react";
import { CategorySelectButtom } from "./CategorySelectButtom";
import { useForm } from "react-hook-form";
import { FormData } from "../../types/FormData";
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup'
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from 'react-native-uuid';
import { router } from "expo-router";
import { useAuth } from "../../hooks/Auth";

// type category = {
//     key: string,
//     name: string,
// }

type Props = {
    openCategory: () => void;
    category: {
        key: string,
        name: string,
    };
    resetCategory: () => void;
}

const schema = Yup.object().shape({
    name: Yup
        .string()
        .required('Nome é obrigatório'),
    amount: Yup
        .number()
        .typeError('Informe um valor numérico')
        .positive('O valor não pode ser negativo')
        .required('Preço é obrigatório')
})

export const Form = ({ openCategory, category, resetCategory }: Props) => {

    const { user } = useAuth();

    const [type, setType] = useState('');

    const handleTransactionTypeSelect = (type: 'up' | 'down') => {
        setType(type);
    }

    const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: yupResolver(schema) as any
    });

    const dataKey = `@go-finances:transactions_user:${user?.id}`;

    const handleRegister = async (form: FormData) => {
        if (!type)
            return Alert.alert('Selecione o tipo da transação')

        if (category.key === 'category')
            return Alert.alert('Selecione a categoria')

        const newTransaction = {
            id: String(uuid.v4()),
            name: form.name,
            amount: form.amount,
            type,
            category: category.key,
            date: new Date()
        }

        try {
            const data = await AsyncStorage.getItem(dataKey);
            const currentData = data ? JSON.parse(data) : [];

            const dataFormatted = [
                ...currentData,
                newTransaction
            ]

            await AsyncStorage.setItem(dataKey, JSON.stringify(dataFormatted));

            resetForm();

        } catch (error) {
            console.log(error);
            Alert.alert("Não foi possíevl salvar");
        }
    }

    const resetForm = () => {
        reset();
        setType('');
        resetCategory();

        router.replace('/Dashboard');
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 w-full px-6 pt-6 justify-between">
                <View>
                    <InputForm
                        name="name"
                        control={control}
                        placeholder="Nome"
                        autoCapitalize="sentences"
                        autoCorrect={false}
                        error={errors.name && errors.name.message as any}
                        className="w-full px-5 py-4 bg-shape rounded-md mb-2 text-xl text-black"
                    />
                    <InputForm
                        name="amount"
                        control={control}
                        placeholder="Preço"
                        keyboardType="numeric"
                        error={errors.amount && errors.amount.message as any}
                        className="w-full px-5 py-4 bg-shape rounded-md mb-2 text-xl text-black"
                    />

                    <View className="flex-row justify-between mt-2 mb-4">
                        <TransactionTypeButtom
                            type="up"
                            title="Entrada"
                            activeOpacity={0.7}
                            onPress={() => handleTransactionTypeSelect('up')}
                            isActive={type === 'up'}
                        />
                        <TransactionTypeButtom
                            type="down"
                            title="Saída"
                            activeOpacity={0.7}
                            onPress={() => handleTransactionTypeSelect('down')}
                            isActive={type === 'down'}
                        />
                    </View>

                    <CategorySelectButtom title={category.name} onPress={openCategory} />
                </View>


                <Buttom
                    title="Enviar"
                    activeOpacity={0.7}
                    onPress={handleSubmit(handleRegister)}
                />
            </View>
        </TouchableWithoutFeedback>
    );
}
