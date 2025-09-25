import { Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { SvgProps } from 'react-native-svg';

type Props = TouchableOpacityProps & {
    title: string;
    svg: React.FC<SvgProps>;
}

export const SiginSocialButton = ({ title, svg: Svg, ...rest }: Props) => {
    return (
        <TouchableOpacity
            className='h-20 bg-shape rounded-md mb-4 items-center flex-row'
            activeOpacity={0.8}
            {...rest}
        >
            <View className='h-full justify-center items-center p-4 border-r border-gray-300'>
                <Svg />
            </View>

            <Text className='flex-1 text-center font-semibold text-lg'>{title}</Text>
        </TouchableOpacity>
    );
}
