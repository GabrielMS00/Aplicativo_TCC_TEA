import { Transaction } from "../types/transaction";

export const transactions: Transaction[] = [
    {
        data: {
            id: 1,
            type: "positive",
            title: "Desenvolvimento de APP",
            amount: "12.550,00",
            category: { name: 'Vendas', icon: 'dollar-sign' },
            date: "22/05/2025"
        }
    },
    {
        data: {
            id: 2,
            type: "negative",
            title: "Aluguel do apartamento",
            amount: "1.360,00",
            category: { name: 'Casa', icon: 'home' },
            date: "15/05/2025"
        }
    },
    {
        data: {
            id: 3,
            type: "negative",
            title: "Gasolina",
            amount: "250,00",
            category: { name: 'Carro', icon: 'settings' },
            date: "12/05/2025"
        }
    },
    {
        data: {
            id: 4,
            type: "negative",
            title: "Gran Bier",
            amount: "230,00",
            category: { name: 'Alimentação', icon: 'coffee' },
            date: "10/05/2025"
        }
    }
];