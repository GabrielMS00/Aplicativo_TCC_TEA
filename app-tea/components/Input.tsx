import { TextInput, TextInputProps } from "react-native";

type Props = TextInputProps;

export const Input = ({ ...rest }: Props) => {
    return (
        <TextInput
            className='bg-white rounded-lg px-4 py-4 text-base'
            {...rest}
        />

    );
}
