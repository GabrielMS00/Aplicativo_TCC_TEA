export type Transaction = {
    id: number;
    type: 'up' | 'down';
    name: string;
    amount: string;
    category: string
    date: string;
};
