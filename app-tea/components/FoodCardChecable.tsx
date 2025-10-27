// import { Text, View } from "react-native";
// import Checkbox from 'expo-checkbox';

// type Props = {
//     food: string;
//     isChecked: boolean;
//     onValueChange: (newValue: boolean) => void;
// }

// export const FoodCardChecable = ({ food, isChecked, onValueChange }: Props) => {
//     return (
//         <View
//             className={`
//                 w-full px-6 py-3 mb-5 rounded-md h-16 border border-gray-500
//                 flex-row items-center justify-between 
//             `}
//         >
//             <Text className="font-bold text-2xl pb-1">{food}</Text>

//             <Checkbox
//                 className="w-6 h-6 rounded"
//                 value={isChecked}
//                 onValueChange={onValueChange}
//                 color={isChecked ? '#4A90E2' : undefined}
//             />
//         </View>
//     );
// }

// gabrielms00/aplicativo_tcc_tea/Aplicativo_TCC_TEA-develop/app-tea/components/FoodCardChecable.tsx

import { Text, View } from "react-native";
import Checkbox from 'expo-checkbox'; // Importar o Checkbox

// 1. Definir o tipo das props
interface Props {
    foodName: string; // Renomeado para clareza, pode manter 'food' se preferir
    isChecked: boolean;
    onValueChange: (newValue: boolean) => void;
}

export const FoodCardChecable = ({ foodName, isChecked, onValueChange }: Props) => {
    return (
        <View
            // 2. Ajustar layout para linha e centralizar itens
            className={`
                w-full px-6 py-3 mb-5 rounded-md h-16 border border-gray-500
                flex-row items-center justify-between
            `}
        >
            {/* Texto do alimento */}
            <Text className="font-bold text-2xl pb-1">{foodName}</Text>

            {/* 3. Adicionar o Checkbox */}
            <Checkbox
                className="w-6 h-6 rounded" // Estilos Tailwind (opcional)
                value={isChecked}
                onValueChange={onValueChange} // Chama a função do pai
                color={isChecked ? '#4A90E2' : undefined} // Cor quando marcado (opcional)
            />
        </View>
    );
}