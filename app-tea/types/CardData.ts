export type CardData = {
    id: string; 
    name: string;
    idade: string;
    suporte: string; 
    onPressOptions: (assistidoId: string, assistidoName: string) => void;
}