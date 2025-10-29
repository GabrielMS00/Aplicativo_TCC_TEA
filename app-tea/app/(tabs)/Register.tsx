import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native'; // Add TouchableOpacity
import { useRouter } from 'expo-router';
import { Input } from '../../components/Input';
import { SelectInput } from '../../components/SelectInput';
import { Button } from '../../components/Button';
import { createAssistidoApi } from '../../api/assistidos';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'; // Import DateTimePicker
import { format } from 'date-fns'; // Import date-fns

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
    const [nome, setNome] = useState('');
    const [dataNascimento, setDataNascimento] = useState<Date>(new Date()); // Use Date type
    const [showDatePicker, setShowDatePicker] = useState(false); // State for date picker visibility
    const [suporte, setSuporte] = useState<string | null>(null);
    const [seletividadeAlimentar, setSeletividadeAlimentar] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();

    const handleProsseguir = async () => {
        if (!nome.trim()) {
            Alert.alert('Erro', 'O nome é obrigatório.');
            return;
        }
        // Basic date validation can be added here if needed

        setIsSubmitting(true);
        // Format the date to YYYY-MM-DD string for the API
        const formattedDate = format(dataNascimento, 'yyyy-MM-dd');

        const result = await createAssistidoApi({
            nome: nome.trim(),
            data_nascimento: formattedDate,
            nivel_suporte: suporte || undefined,
            grau_seletividade: seletividadeAlimentar || undefined,
        });
        setIsSubmitting(false);

        if (result) {
            Alert.alert('Sucesso', result.message);
            setNome('');
            setDataNascimento(new Date()); // Reset date
            setSuporte(null);
            setSeletividadeAlimentar(null);
            router.replace('/(tabs)/Home');
        }
    };

    // Handler for DateTimePicker change event
    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (event.type === 'set' && selectedDate) {
            setDataNascimento(selectedDate); // Update state directly
        }
    };

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
                            <Input value={nome} onChangeText={setNome} placeholder="Nome do assistido"/>
                        </View>

                        {/* Data de Nascimento - Replaced Input */}
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
                                    maximumDate={new Date()} // Prevent selecting future dates
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

            {/* Botão de Cadastro */}
            {isSubmitting ? (
                <ActivityIndicator size="large" color="#A6C98C" className="my-5 mb-10" />
            ) : (
                <Button title='Cadastrar Assistido' type='success' onPress={handleProsseguir} />
            )}
        </View>
    );
};

export default Screen;