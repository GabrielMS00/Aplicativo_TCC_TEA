import { Text, View, ActivityIndicator, ScrollView } from "react-native";
import { HistoryCard } from "../../components/HistoryCard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Transaction } from "../../types/Transaction";
import { categories } from "../../data/categories";
import { useCallback, useState } from "react";
import { BorderlessButton, GestureHandlerRootView } from "react-native-gesture-handler";
import { VictoryPie } from "victory-native";
import { Feather } from "@expo/vector-icons";
import { addMonths, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../../hooks/Auth";

type CategoryData = {
  name: string;
  totalFormatted: string;
  total: number;
  color: string;
  percent: string;
};

const Screen = () => {
  const [totalByCategories, setTotalByCategories] = useState<CategoryData[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();

  const handleChangeDate = (action: "next" | "prev") => {
    if (action === "next") setSelectedDate(addMonths(selectedDate, 1));
    else setSelectedDate(subMonths(selectedDate, 1));
  };

  const loadData = async () => {
    setIsLoading(true);

    const dataKey = `@go-finances:transactions_user:${user?.id}`;
    const response = await AsyncStorage.getItem(dataKey);
    const transactions: Transaction[] = response ? JSON.parse(response) : [];

    const expensives = transactions.filter(
      (t) =>
        t.type === "down" &&
        new Date(t.date).getMonth() === selectedDate.getMonth() &&
        new Date(t.date).getFullYear() === selectedDate.getFullYear()
    );

    const expensiveTotal = expensives.reduce((acc, t) => acc + Number(t.amount), 0);

    const totals: CategoryData[] = categories
      .map((category) => {
        const total = expensives
          .filter((e) => e.category === category.key)
          .reduce((sum, e) => sum + Number(e.amount), 0);
        if (total > 0) {
          return {
            name: category.name,
            total,
            totalFormatted: total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
            color: category.color,
            percent: `${((total / expensiveTotal) * 100).toFixed(0)}%`,
          };
        }
        return null;
      })
      .filter(Boolean) as CategoryData[];

    setTotalByCategories(totals);
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedDate])
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-background pb-4">
        {/* Cabeçalho */}
        <View className="bg-primary w-full h-32 items-center justify-end pb-5">
          <Text className="text-shape text-lg font-semibold">Resumo por categoria</Text>
        </View>

        {/* Loading */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator color="#5636D3" size="large" />
          </View>
        ) : (
          <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
            {/* Seleção de mês */}
            <View className="w-full flex-row justify-between items-center px-7 mb-4">
              <BorderlessButton onPress={() => handleChangeDate("prev")}>
                <Feather name="chevron-left" size={26} />
              </BorderlessButton>

              <Text className="text-2xl font-semibold">
                {format(selectedDate, "MMMM, yyyy", { locale: ptBR })}
              </Text>

              <BorderlessButton onPress={() => handleChangeDate("next")}>
                <Feather name="chevron-right" size={26} />
              </BorderlessButton>
            </View>

            {/* Gráfico */}
            <View className="w-full items-center mb-6">
              <VictoryPie
                data={totalByCategories}
                x="percent"
                y="total"
                colorScale={totalByCategories.map((c) => c.color)}
                style={{ labels: { fontSize: 18, fontWeight: "bold", fill: "#FFFFFF" } }}
                labelRadius={50}
              />
            </View>

            {/* Histórico */}
            {totalByCategories.map((item, index) => (
              <HistoryCard
                key={index}
                title={item.name}
                amount={item.totalFormatted}
                color={item.color}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

export default Screen;



