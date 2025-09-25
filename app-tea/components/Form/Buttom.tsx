import { Text, TouchableOpacity, TouchableOpacityProps } from "react-native";

type Props = TouchableOpacityProps & {
    title: string;
}

export const Buttom = ({ title, ...rest }: Props) => {
    return (

        <TouchableOpacity
            className="w-full p-5 bg-secondary rounded-md items-center"
            {...rest}
        >
            <Text className="text-xl font-medium text-shape">
                {title}
            </Text>
        </TouchableOpacity>

    );
}
