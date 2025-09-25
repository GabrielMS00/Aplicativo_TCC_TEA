import { Text, TextInputProps, View } from "react-native";
import { Input } from './Input';
import { Control, Controller } from "react-hook-form";
import { FormData } from "../../types/FormData";

type Props = TextInputProps & {
    control: Control<FormData>;
    name: 'name' | 'amount';
    error: string;
}

export const InputForm = ({ control, name, error, ...rest }: Props) => {
    return (
        <View className="w-full">
            <Controller
                control={control}
                name={name}
                render={({ field: { onChange, value } }) => (
                    <Input
                        onChangeText={onChange}
                        value={value}
                        {...rest}
                    />
                )}
            />

            {error &&
                <Text className="text-attention text-sm font-medium mb-2">
                    {error}
                </Text>
            }
        </View>
    );
}
