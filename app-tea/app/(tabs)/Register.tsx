import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router'; // Importa o hook de navegação
import { Input } from '../../components/Input';
import { SelectInput } from '../../components/SelectInput';
import { Button } from '../../components/Button';
import { createAssistidoApi } from '../../api/assistidos'; // Importa a função da API
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

// Opções para os SelectInputs (mantidas)
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
    // Estados do formulário (mantidos)
    const [nome, setNome] = useState('');
    const [dataNascimento, setDataNascimento] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [suporte, setSuporte] = useState<string | null>(null);
    const [seletividadeAlimentar, setSeletividadeAlimentar] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter(); // Hook para navegação

    // Função chamada ao pressionar o botão "Cadastrar Assistido"
    const handleProsseguir = async () => {
        // Validação básica (mantida)
        if (!nome.trim()) {
            Alert.alert('Erro', 'O nome é obrigatório.');
            return;
        }

        setIsSubmitting(true); // Ativa o loading
        const formattedDate = format(dataNascimento, 'yyyy-MM-dd'); // Formata a data para a API

        // Chama a API para criar o assistido
        const result = await createAssistidoApi({
            nome: nome.trim(),
            data_nascimento: formattedDate,
            nivel_suporte: suporte || undefined,
            grau_seletividade: seletividadeAlimentar || undefined,
        });
        // Não desativa o loading ainda se for navegar

        // Verifica se a criação foi bem-sucedida e se a API retornou o ID e nome
        if (result && result.assistido?.id && result.assistido?.nome) { // Checa se 'assistido' e seus campos existem
            Alert.alert('Sucesso', result.message); // Exibe mensagem de sucesso
            const newAssistidoId = result.assistido.id;
            const newAssistidoNome = result.assistido.nome;

            // Limpa os campos do formulário
            setNome('');
            setDataNascimento(new Date());
            setSuporte(null);
            setSeletividadeAlimentar(null);

            // ***** ALTERAÇÃO PRINCIPAL: Navega para a lista de questionários *****
            router.replace({
                pathname: '/questionnaires/QuestionnaireList', // Caminho da tela de lista
                params: { assistidoId: newAssistidoId, assistidoNome: newAssistidoNome } // Passa ID e nome como parâmetros
            });
            // ********************************************************************

            setIsSubmitting(false); // Desativa o loading APÓS tentar navegar
        } else {
            // Se a API falhou ou não retornou os dados esperados
            setIsSubmitting(false); // Desativa o loading
             if (!result) {
                 // Se apiClient retornou null, ele já mostrou o Alert de erro
             } else {
                 // Se retornou algo, mas sem 'assistido.id' ou 'assistido.nome'
                 console.error("API createAssistido retornou sucesso, mas faltou 'assistido.id' ou 'assistido.nome'", result);
                  Alert.alert("Erro Inesperado", "Cadastro realizado, mas houve um problema ao obter os dados do assistido para continuar.");
                  // Volta para a Home como fallback neste caso de erro inesperado
                  router.replace('/(tabs)/Home');
             }
        }
    };

    // Função para lidar com a mudança de data no DatePicker (mantida)
    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (event.type === 'set' && selectedDate) {
            setDataNascimento(selectedDate);
        } else {
             if (Platform.OS === 'android') {
                 setShowDatePicker(false);
             }
        }
    };

    // JSX da tela (mantido, sem alterações visuais aqui)
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