import { Text, View, FlatList } from "react-native";
import { TransactionCard } from "./TransactionCard";
import { useEffect, useState } from "react";
import { Transaction } from "../types/Transaction";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HighLightValue } from "../types/HighLightValue";
import { useAuth } from "../hooks/Auth";

type Props = {
    setHighLightValues: ({ }: HighLightValue) => void
}

export const TransactionsList = ({ setHighLightValues }: Props) => {
    const [data, setData] = useState<Transaction[]>([]);

    const { user } = useAuth();

    const loadTransaction = async () => {
        const dataKey = `@go-finances:transactions_user:${user?.id}`;
        const response = await AsyncStorage.getItem(dataKey);
        const transactions = response ? JSON.parse(response) : [];

        let entriesTotal = 0;
        let expensiveTotal = 0;

        let lastEntrie = '';
        let lastExpensive = '';

        let lastTransaction = '';

        const transactionsFormated: Transaction[] = transactions.map((item: Transaction) => {

            const parsedDate = new Date(item.date);

            const formattedDate = parsedDate.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
            });

            if (item.type === 'up') {
                entriesTotal += Number(item.amount);
                lastEntrie = formattedDate;
            } else {
                expensiveTotal += Number(item.amount);
                lastExpensive = formattedDate;
            }

            lastTransaction = new Date(item.date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
            });

            const amount = Number(item.amount).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
            const date = Intl.DateTimeFormat('pt-br', { day: '2-digit', month: '2-digit', year: '2-digit' })
                .format(new Date(item.date));

            return {
                id: item.id,
                type: item.type,
                name: item.name,
                amount,
                category: item.category,
                date
            }
        })

        let highLightInformations = {
            entrie: Number(entriesTotal).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
            lastEntrie,
            expensive: Number(expensiveTotal).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
            lastExpensive,
            lastTransaction
        }

        setData(transactionsFormated);
        setHighLightValues(highLightInformations);

    }

    useEffect(() => {
        loadTransaction();
    }, [data])

    return (
        <View className="flex-1 px-6 mt-24">
            <Text className="text-xl mb-7">Listagem</Text>

            <FlatList
                data={data}
                renderItem={({ item }) => <TransactionCard {...item} />}
                keyExtractor={item => item.id.toString()}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}
