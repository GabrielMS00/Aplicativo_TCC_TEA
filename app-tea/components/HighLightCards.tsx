import { ScrollView } from "react-native";
import { HighLightCard } from "./HighLightCard";
import { HighLightValue } from "../types/HighLightValue";

export const HighLightCards = ({ entrie, lastEntrie, expensive, lastExpensive, lastTransaction }: HighLightValue) => {

    const formatedEntrie = Number(
        entrie.replace(/\./g, '').replace(',', '.')
    );
    const formatedExpensive = Number(
        expensive.replace(/\./g, '').replace(',', '.')
    );

    const total = (formatedEntrie - formatedExpensive).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const entriesString = entrie === '0,00' ? '' : `Última entrada dia ${lastEntrie}`;
    const expensivesString = expensive === '0,00' ? '' : `Última saída dia ${lastExpensive}`;
    const totalString = total === '0,00' ? '' : `Última transação dia ${lastTransaction}`;

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-2 w-full absolute mt-40"
        >
            <HighLightCard type="up" title="Entradas" amount={entrie} lastTransaction={entriesString} />
            <HighLightCard type="down" title="Saídas" amount={expensive} lastTransaction={expensivesString} />
            <HighLightCard type="total" title="Total" amount={total} lastTransaction={totalString} />
        </ScrollView>
    );
}
