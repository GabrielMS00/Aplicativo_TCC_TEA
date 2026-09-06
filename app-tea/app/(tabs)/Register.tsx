import React, { useState, useEffect } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Input } from '../../components/Input';
import { SelectInput } from '../../components/SelectInput';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

const suportOptions = [
    { label: 'Nível 1 (Suporte Leve)', value: 'Nível 1' },
    { label: 'Nível 2 (Suporte Moderado)', value: 'Nível 2' },
    { label: 'Nível 3 (Suporte Substancial)', value: 'Nível 3' },
];

const foodSelectivityOptions = [
    { label: 'Leve', value: 'leve' },
    { label: 'Moderada', value: 'moderada' },
    { label: 'Alta', value: 'alto' },
    { label: 'Não sei informar', value: 'nao_sei' },
];

const Screen = () => {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user && user.tipo_usuario === 'padrao') {
            Alert.alert("Acesso Negado", "Esta função é exclusiva para cuidadores.");
            router.replace('/(tabs)/Home');
        }
    }, [user, router]);

    const [nome, setNome] = useState('');
    // Novo estado usando string em vez de Date
    const [dataNascimentoStr, setDataNascimentoStr] = useState('');
    const [suporte, setSuporte] = useState<string | null>(null);
    const [seletividadeAlimentar, setSeletividadeAlimentar] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Função que aplica a máscara DD/MM/AAAA em tempo real
    const handleDateChange = (text: string) => {
        let v = text.replace(/\D/g, ''); // Remove tudo que não for número
        
        if (v.length > 8) v = v.slice(0, 8); // Limita a 8 dígitos
        
        if (v.length > 4) {
            v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
        } else if (v.length > 2) {
            v = `${v.slice(0, 2)}/${v.slice(2)}`;
        }
        
        setDataNascimentoStr(v);
    };

    const handleIniciarQuestionarios = () => {
        if (!nome.trim()) {
            Alert.alert('Erro', 'O nome é obrigatório.');
            return;
        }

        // Validação da Data de Nascimento
        if (dataNascimentoStr.length !== 10) {
            Alert.alert('Erro', 'Preencha a data de nascimento completa (DD/MM/AAAA).');
            return;
        }

        const [day, month, year] = dataNascimentoStr.split('/');
        const dateObj = new Date(`${year}-${month}-${day}T12:00:00`); 

        if (isNaN(dateObj.getTime()) || Number(day) > 31 || Number(month) > 12 || Number(day) === 0 || Number(month) === 0) {
            Alert.alert('Erro', 'Data de nascimento inválida.');
            return;
        }

        if (dateObj > new Date()) {
            Alert.alert('Erro', 'A data de nascimento não pode ser futura.');
            return;
        }

        const assistidoData = {
            nome: nome.trim(),
            data_nascimento: `${year}-${month}-${day}`, // Formato YYYY-MM-DD para o banco
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

    // Renderiza um loading enquanto verifica o tipo de usuário
    if (!user || user.tipo_usuario === 'padrao') {
        return (
            <View className='flex-1 justify-center items-center bg-background'>
                <ActivityIndicator size="large" color="#87CFCF" />
            </View>
        );
    }

    return (
        <SafeAreaView className='flex-1 bg-background' edges={['top', 'bottom']}>
          <View className='flex-1 p-5'>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                    <View className='flex-1 justify-center'>
                        <Text className='text-4xl lg:text-5xl font-extrabold text-text text-center mt-6 mb-10'>
                            Cadastro de Assistido
                        </Text>

                        <View className='mb-6'>
                            <Text className='text-xl font-semibold text-text mb-2'>Nome Completo</Text>
                            <Input value={nome} onChangeText={setNome} placeholder="Nome do assistido" />
                        </View>

                        {/* Novo Input de Data com Máscara */}
                        <View className='mb-6'>
                            <Text className='text-xl font-semibold text-text mb-2'>Data de Nascimento</Text>
                            <Input 
                                value={dataNascimentoStr} 
                                onChangeText={handleDateChange} 
                                placeholder="DD/MM/AAAA" 
                                keyboardType="numeric" 
                                maxLength={10}
                            />
                        </View>

                        <View className='mb-6'>
                            <Text className='text-xl font-semibold text-text mb-2'>Nível de Suporte</Text>
                            <SelectInput
                                options={suportOptions}
                                selectedValue={suporte ?? undefined}
                                onValueChange={(value: string) => setSuporte(value)}
                                placeholder="Selecione o nível..."
                            />
                        </View>

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
        </SafeAreaView>
    );
};

export default Screen;
