import { Text, TouchableOpacity } from "react-native";
import { TouchableOpacityProps } from "react-native";
import { Feather } from "@expo/vector-icons";

const icons = {
    up: 'arrow-up-circle',
    down: 'arrow-down-circle'
}

const color = {
    up: '#12A454',
    down: '#E83F5B'
}

type Props = TouchableOpacityProps & {
    title: string;
    type: 'up' | 'down';
    isActive: boolean;
}

export const TransactionTypeButtom = ({ title, type, isActive, ...rest }: Props) => {

    let active;
    if (type === 'up' && isActive) active = 'bg-success_light border-transparent';
    if (type === 'down' && isActive) active = 'bg-attention_light border-transparent';

    return (
        <TouchableOpacity
            {...rest}
            className={`w-48 flex-row items-center border-1.5 border-text rounded-md py-4 px-7 justify-center ${active}`}
        >
            <Feather
                name={icons[type] as any}
                size={28}
                color={color[type]}
            />
            <Text className="text-base font-medium ml-3">{title}</Text>
        </TouchableOpacity>
    );
}
