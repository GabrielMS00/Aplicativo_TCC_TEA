import React, { useState, useEffect } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../../components/Input';
import { SelectInput } from '../../components/SelectInput';
import { Button } from '../../components/Button';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const suportOptions = [
    { label: 'Nível 1', value: '1' },
    { label: 'Nível 2', value: '2' },
    { label: 'Nível 3', value: '3' },
];
const foodSelectivityOptions = [
    { label: 'Leve', value: 'leve' },
    { label: 'Moderado', value: 'moderado' },
    { label: 'Alto', value: 'alto' },
];

const Screen = () => {
    const { user } = useAuth();
    const router = useRouter();


    useEffect(() => {
        // Se o usuário carregou e é 'padrao'
        if (user && user.tipo_usuario === 'padrao') {
            Alert.alert("Acesso Negado", "Esta função é exclusiva para cuidadores.");
            router.replace('/(tabs)/Home'); // Redireciona para a home
        }
    }, [user, router]);


    const [nome, setNome] = useState('');
    const [dataNascimento, setDataNascimento] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [suporte, setSuporte] = useState<string | null>(null);
    const [seletividadeAlimentar, setSeletividadeAlimentar] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleIniciarQuestionarios = () => {
        if (!nome.trim()) {
            Alert.alert('Erro', 'O nome é obrigatório.');
            return;
        }
        if (dataNascimento > new Date()) {
            Alert.alert('Erro', 'A data de nascimento não pode ser futura.');
            return;
        }

        const assistidoData = {
            nome: nome.trim(),
            data_nascimento: format(dataNascimento, 'yyyy-MM-dd'),
            nivel_suporte: suporte,
            grau_seletividade: seletividadeAlimentar,
        };

        // Navega para a primeira tela do questionário, passando os dados
        router.push({
            pathname: '/QuestionnaireFlow/Screen',
            params: {
                questionnaireIndex: 0,
                assistidoData: JSON.stringify(assistidoData),
                respostasAnteriores: JSON.stringify({})
            }
        });
    };

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || dataNascimento;
        setShowDatePicker(Platform.OS === 'ios');
        if (currentDate <= new Date()) {
            setDataNascimento(currentDate);
        } else {
            Alert.alert("Data Inválida", "A data de nascimento não pode ser futura.");
        }
    };

    // Renderiza um loading enquanto verifica o tipo de usuário
    if (!user || user.tipo_usuario === 'padrao') {
        return (
            <View className='flex-1 justify-center items-center bg-background'>
                <ActivityIndicator size="large" color="#87CFCF" />
            </View>
        );
    }

    // Este return só será alcançado se user.tipo_usuario === 'cuidador'
    return (
        <View className='flex-1 bg-background p-5'>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View className='flex-1 justify-center'>
                        <Text className='text-4xl lg:text-5xl font-extrabold text-text text-center mt-16 mb-10'>
                            Cadastro de Assistido
                        </Text>

                        {/* Nome */}
                        <View className='mb-6'>
                            <Text className='text-xl font-semibold text-text mb-2'>Nome Completo</Text>
                            <Input value={nome} onChangeText={setNome} placeholder="Nome do assistido" />
                        </View>

                        {/* Data de Nascimento */}
                        <View className='mb-6'>
                            <Text className='text-xl font-semibold text-text mb-2'>Data de Nascimento</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(true)} className='bg-white rounded-lg px-4 py-4'>
                                <Text className='text-xl'>{format(dataNascimento, 'dd/MM/yyyy')}</Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    testID="dateTimePicker"
                                    value={dataNascimento}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onDateChange}
                                    maximumDate={new Date()}
                                />
                            )}
                        </View>

                        {/* Nível de Suporte */}
                        <View className='mb-6'>
                            <Text className='text-xl font-semibold text-text mb-2'>Nível de Suporte</Text>
                            <SelectInput
                                options={suportOptions}
                                selectedValue={suporte ?? undefined}
                                onValueChange={(value: string) => setSuporte(value)}
                                placeholder="Selecione o nível..."
                            />
                        </View>

                        {/* Grau de Seletividade Alimentar */}
                        <View className='mb-8'>
                            <Text className='text-xl font-semibold text-text mb-2'>Grau de Seletividade</Text>
                            <SelectInput
                                options={foodSelectivityOptions}
                                selectedValue={seletividadeAlimentar ?? undefined}
                                onValueChange={(value: string) => setSeletividadeAlimentar(value)}
                                placeholder="Selecione o grau..."
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {isSubmitting ? (
                <ActivityIndicator size="large" color="#A6C98C" className="my-5 mb-10" />
            ) : (
                <Button title='Iniciar Questionários' type='success' onPress={handleIniciarQuestionarios} />
            )}
        </View>
    );
};

export default Screen;