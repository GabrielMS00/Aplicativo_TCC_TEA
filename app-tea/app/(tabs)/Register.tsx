import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../../components/Input';
import { SelectInput } from '../../components/SelectInput';
import { Button } from '../../components/Button';
import { createAssistidoApi } from '../../api/assistidos'; // Importar API

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
    // Mantém os useState originais
    const [nome, setNome] = useState('');
    // const [idade, setIdade] = useState(''); // Removido idade, usar data_nascimento
    const [dataNascimento, setDataNascimento] = useState(''); // Adicionado dataNascimento
    const [suporte, setSuporte] = useState<string | null>(null); // Tipo ajustado para permitir null
    const [seletividadeAlimentar, setSeletividadeAlimentar] = useState<string | null>(null); // Tipo ajustado
    const [isSubmitting, setIsSubmitting] = useState(false); // Estado de loading

    const router = useRouter();

    const handleProsseguir = async () => {
        // Validação simples (pode melhorar)
        if (!nome.trim()) {
            Alert.alert('Erro', 'O nome é obrigatório.');
            return;
        }
        if (!dataNascimento.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) {
             Alert.alert('Erro', 'A data de nascimento é obrigatória e deve estar no formato AAAA-MM-DD.');
             return;
         }

        setIsSubmitting(true);
        const result = await createAssistidoApi({
            nome: nome.trim(),
            data_nascimento: dataNascimento.trim(),
            // Envia o valor selecionado ou undefined se for null
            nivel_suporte: suporte || undefined,
            grau_seletividade: seletividadeAlimentar || undefined,
        });
        setIsSubmitting(false);

        if (result) {
            Alert.alert('Sucesso', result.message);
            // Limpa os campos após sucesso
            setNome('');
            setDataNascimento('');
            setSuporte(null);
            setSeletividadeAlimentar(null);
            // Navega para a Home
            router.replace('/(tabs)/Home');
        }
        // Erro já tratado no apiClient
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

                        {/* Data de Nascimento */}
                        <View className='mb-6'>
                            <Text className='text-xl font-semibold text-text mb-2'>Data de Nascimento</Text>
                            {/* TODO: Idealmente usar um DatePicker aqui */}
                            <Input
                                value={dataNascimento}
                                onChangeText={setDataNascimento}
                                placeholder="AAAA-MM-DD"
                                keyboardType='numeric' // Ajuda na digitação em alguns teclados
                                maxLength={10}
                            />
                        </View>

                        {/* Nível de Suporte */}
                        <View className='mb-6'>
                            <Text className='text-xl font-semibold text-text mb-2'>Nível de Suporte</Text>
                            <SelectInput
                                options={suportOptions}
                                selectedValue={suporte ?? undefined} // Passa undefined se null
                                onValueChange={(value: string) => setSuporte(value)}
                                placeholder="Selecione o nível..."
                            />
                        </View>

                        {/* Grau de Seletividade Alimentar */}
                        <View className='mb-8'>
                            <Text className='text-xl font-semibold text-text mb-2'>Grau de Seletividade</Text>
                            <SelectInput
                                options={foodSelectivityOptions}
                                selectedValue={seletividadeAlimentar ?? undefined} // Passa undefined se null
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