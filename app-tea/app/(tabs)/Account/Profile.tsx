import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react'; // Importar React e useEffect
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { getPerfilApi, updatePerfilApi } from '../../../api/cuidador'; // Importar API

const Screen = () => {
    const { user } = useAuth(); // Pega o usuário do contexto para nome inicial
    const router = useRouter();

    // Mantém os useState originais
    const [nome, setNome] = useState(user?.nome || ''); // Inicializa com nome do contexto
    const [email, setEmail] = useState(user?.email || ''); // Inicializa com email do contexto
    const [cpf, setCpf] = useState(''); // API precisa retornar
    const [dataNascimento, setDataNascimento] = useState(''); // API precisa retornar

    const [isLoading, setIsLoading] = useState(true); // Loading para buscar dados
    const [isSubmitting, setIsSubmitting] = useState(false); // Loading para salvar

    // Busca dados do perfil ao carregar
    useEffect(() => {
        const fetchPerfil = async () => {
            setIsLoading(true);
            const perfilData = await getPerfilApi();
            if (perfilData) {
                setNome(perfilData.nome);
                setEmail(perfilData.email);
                // Assume que a API retorna cpf e data_nascimento
                // TODO: Adicionar esses campos ao retorno da API /cuidador/perfil no backend
                setCpf(perfilData.cpf || ''); // Adicionar cpf ao tipo CuidadorInfo
                setDataNascimento(perfilData.data_nascimento || ''); // Adicionar data_nascimento
            } else {
                 // Se falhar, mantém os dados do contexto (se existirem)
                 setNome(user?.nome || '');
                 setEmail(user?.email || '');
            }
            setIsLoading(false);
        };
        fetchPerfil();
    }, []); // Roda apenas uma vez ao montar


    const handleChangePassword = () => {
        router.push('/Account/ChangePassword'); // Mantido
    }

    const handleSalvar = async () => {
        // Validação simples (pode melhorar)
        if (!nome.trim() || !email.trim() || !cpf.trim() || !dataNascimento.trim()) {
            Alert.alert('Erro', 'Todos os campos são obrigatórios.');
            return;
        }
         if (!/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) {
             Alert.alert('Erro', 'Data de nascimento inválida (use AAAA-MM-DD).');
             return;
         }
         // Adicione validação de email e CPF se necessário

        setIsSubmitting(true);
        const formattedCpf = cpf.replace(/[^\d]/g, ''); // Remove máscara se houver
        const result = await updatePerfilApi({
            nome: nome.trim(),
            email: email.trim(),
            cpf: formattedCpf,
            data_nascimento: dataNascimento.trim(),
        });
        setIsSubmitting(false);

        if (result) {
            Alert.alert('Sucesso', result.message);
            // Opcional: Atualizar 'user' no AuthContext se o nome/email mudou
        }
        // Erro já tratado no apiClient
    };


    return (
        <View className='flex-1 bg-background'>
            {/* Header (mantido, usando 'nome' do estado local) */}
            <View className="w-full bg-primary h-60 justify-center items-center flex-row">
                 <View className="w-full px-6 flex-row justify-between items-center">
                    <View className="flex-row items-center ">
                        <View className="ml-4">
                            <Text className="text-text text-2xl">Olá,</Text>
                            <Text className="text-text text-4xl font-bold">{nome || 'Usuário'}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View className='justify-center items-center p-7'>
                <Text className='text-3xl font-bold text-text'>Edição de dados</Text>
            </View>

            {isLoading ? (
                 <ActivityIndicator size="large" color="#87CFCF" className="mt-10"/>
             ) : (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView className='p-5'>
                        <View className='pt-6'>
                            {/* Inputs mantidos, usando os estados locais */}
                            <View className='mb-8'>
                                <Text className='text-xl font-semibold text-text mb-2'>Nome</Text>
                                <Input value={nome} onChangeText={setNome} />
                            </View>

                            <View className='mb-8'>
                                <Text className='text-xl font-semibold text-text mb-2'>E-mail</Text>
                                <Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize='none' />
                            </View>

                            <View className='mb-8'>
                                <Text className='text-xl font-semibold text-text mb-2'>CPF</Text>
                                {/* TODO: Adicionar máscara */}
                                <Input value={cpf} onChangeText={setCpf} keyboardType='numeric' maxLength={14} />
                            </View>

                             <View className='mb-8'>
                                <Text className='text-xl font-semibold text-text mb-2'>Data de Nascimento</Text>
                                {/* TODO: Usar DatePicker */}
                                <Input value={dataNascimento} onChangeText={setDataNascimento} placeholder="AAAA-MM-DD" keyboardType='numeric' maxLength={10} />
                            </View>

                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
             )}

            {/* Botões */}
            <View className='flex-row justify-around items-center w-full p-4'>
                 {isSubmitting ? (
                    <ActivityIndicator size="small" color="#A6C98C" />
                 ) : (
                    <>
                        <Button title='Alterar Senha' onPress={handleChangePassword} />
                        {/* Botão Salvar original, chama handleSalvar */}
                        <Button title='Salvar' type='success' onPress={handleSalvar} />
                    </>
                 )}
            </View>
        </View>
    );
};

export default Screen;