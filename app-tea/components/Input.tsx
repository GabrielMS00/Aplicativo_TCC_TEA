import { TextInput, TextInputProps } from "react-native";

type Props = TextInputProps;

export const Input = ({ placeholderTextColor = '#9CA3AF', ...rest }: Props) => {
    return (
        <TextInput
            // text-text garante texto escuro (#2C3E50) sobre o fundo branco,
            // mesmo com o celular em modo escuro (senão o texto herda branco do sistema).
            className='bg-white rounded-lg px-4 py-4 text-xl text-text'
            placeholderTextColor={placeholderTextColor}
            keyboardAppearance='light'
            {...rest}
        />

    );
}
