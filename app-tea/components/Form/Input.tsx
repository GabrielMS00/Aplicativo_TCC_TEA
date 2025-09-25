import { TextInput, TextInputProps } from "react-native";

type Props = TextInputProps;

export const Input = ({ ...rest }: Props) => {
    return (
        <TextInput
            {...rest}
        />

    );
}
