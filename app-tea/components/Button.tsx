import { Text, TouchableOpacity, TouchableOpacityProps } from "react-native";

type Props = TouchableOpacityProps & {
    title: string;
    type?: string;
}

export const Button = ({ title, type, ...rest }: Props) => {
    return (

        <TouchableOpacity
            className="rounded-md items-center mb-10 mx-auto"
            {...rest}
        >
            <Text className={`text-2xl font-bold ${type === 'success' ? 'text-success' : 'text-attention' } text-center`}>
                {title}
            </Text>
        </TouchableOpacity>

    );
}
