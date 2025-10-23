import { Text, TouchableOpacity, TouchableOpacityProps } from "react-native";

type Props = TouchableOpacityProps & {
    title: string;
}

export const MainButton = ({ title, ...rest }: Props) => {
    return (

        <TouchableOpacity
            className="rounded-md items-center mb-10 mx-auto"
            {...rest}
        >
            <Text className='text-5xl font-bold text-success text-center'>
                {title}
            </Text>
        </TouchableOpacity>

    );
}
