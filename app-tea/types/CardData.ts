export type CardData = {
    name: string;
    idade: string;
    suporte: number;
    onPressOptions: (card: CardData) => void;
}