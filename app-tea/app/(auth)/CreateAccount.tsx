// app-tea/app/(auth)/CreateAccount.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
// Garanta que está importando a versão correta de registerApi (que usa apiClient)
import { registerApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

// Esquema de validação (mantido)
const registerSchema = yup.object().shape({
  nome: yup.string().required('Nome é obrigatório'),
  cpf: yup.string().required('CPF é obrigatório').matches(/^(\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{11})$/, 'CPF inválido'),
  email: yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
  senha: yup.string().min(8, 'Senha deve ter no mínimo 8 caracteres').required('Senha é obrigatória'),
  confirmarSenha: yup.string()
    .oneOf([yup.ref('senha')], 'As senhas não conferem')
    .required('Confirmação de senha é obrigatória'),
  data_nascimento: yup.string().required('Data de nascimento obrigatória').matches(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD'),
});

type FormData = yup.InferType<typeof registerSchema>;

const CreateAccountScreen = () => {
    // Estado local para controlar o loading do botão
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Obtém a função signIn do contexto de autenticação
    const { signIn } = useAuth();

    // Configuração do react-hook-form
    const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: yupResolver(registerSchema),
        defaultValues: { // Valores iniciais
            nome: '',
            cpf: '',
            email: '',
            senha: '',
            confirmarSenha: '',
            data_nascimento: '', // Iniciar vazio para forçar preenchimento
        }
    });

    // Função para voltar à tela anterior
    const handleCancelar = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/'); // Fallback
        }
    }

    // Função executada ao submeter o formulário (após validação)
    const handleConfirmar = async (data: FormData) => {
        // Evita submissões múltiplas
        if (isSubmitting) return;

        setIsSubmitting(true); // Ativa o loading
        console.log('[CreateAccount] Tentando registrar com:', data);

        // Formata CPF removendo máscara
        const formattedCpf = data.cpf.replace(/[^\d]/g, '');
        const formattedDate = data.data_nascimento; // Assume formato YYYY-MM-DD

        // Chama a API de registro
        const response = await registerApi({
            nome: data.nome,
            cpf: formattedCpf,
            email: data.email,
            data_nascimento: formattedDate,
            senha: data.senha,
        });

        // Verifica se o registro foi BEM SUCEDIDO na API
        if (response && response.token && response.cuidador) {
            console.log('[CreateAccount] Registro API bem-sucedido:', response.message);
            Alert.alert('Cadastro Realizado', response.message || 'Usuário cadastrado com sucesso!');

            // Tenta fazer login automático com os dados recém-cadastrados
            try {
                 console.log('[CreateAccount] Tentando login automático...');
                 // Chama a função signIn do AuthContext
                 await signIn({ email: data.email, senha: data.senha });
                 console.log('[CreateAccount] Login automático iniciado (AuthContext deve redirecionar).');
                 // Não precisa mais chamar router.replace aqui, o AuthContext cuida disso
                 // Apenas garante que o loading para APÓS o signIn tentar (mesmo que falhe internamente)
                 setIsSubmitting(false); // <= IMPORTANTE: Resetar aqui após a tentativa

            } catch (signInError) {
                 // Captura erros que possam ocorrer DENTRO da função signIn do AuthContext
                 console.error('[CreateAccount] Erro DURANTE o login automático:', signInError);
                 Alert.alert('Cadastro OK, Login Falhou', 'Seu cadastro foi realizado, mas ocorreu um erro ao entrar automaticamente. Tente fazer login manualmente.');
                 setIsSubmitting(false); // <= IMPORTANTE: Resetar aqui em caso de erro no signIn
                 router.replace('/'); // Envia para o login manual
            }
        } else {
            // Se response for null ou inválido, registerApi já mostrou um Alert de erro
            console.log('[CreateAccount] Falha no registro via API.');
            setIsSubmitting(false); // <= IMPORTANTE: Resetar aqui se o registerApi falhar
        }
    };

    // JSX da Tela
    return (
        <View className='flex-1 bg-background p-5'>

            <Text className='text-5xl font-extrabold text-primary text-center pt-20'>Cadastro</Text>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    <View className='flex-1 justify-center pt-14'>
                        {/* --- Inputs controlados pelo react-hook-form --- */}

                        {/* Nome */}
                        <View className='mb-5'>
                            <Text className='text-xl font-semibold text-text mb-2'>Nome Completo</Text>
                            <Controller control={control} name="nome" render={({ field: { onChange, onBlur, value } }) => (
                                <Input placeholder="Seu nome completo" onBlur={onBlur} onChangeText={onChange} value={value} />
                            )}/>
                            {errors.nome && <Text className="text-attention mt-1">{errors.nome.message}</Text>}
                        </View>

                         {/* CPF */}
                         <View className='mb-5'>
                            <Text className='text-xl font-semibold text-text mb-2'>CPF</Text>
                            <Controller control={control} name="cpf" render={({ field: { onChange, onBlur, value } }) => (
                                <Input placeholder="000.000.000-00" onBlur={onBlur} onChangeText={onChange} value={value} keyboardType='numeric' maxLength={14} />
                            )}/>
                            {errors.cpf && <Text className="text-attention mt-1">{errors.cpf.message}</Text>}
                        </View>

                        {/* E-mail */}
                        <View className='mb-5'>
                            <Text className='text-xl font-semibold text-text mb-2'>E-mail</Text>
                            <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
                                <Input placeholder="seuemail@exemplo.com" onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="email-address" autoCapitalize="none" />
                            )}/>
                            {errors.email && <Text className="text-attention mt-1">{errors.email.message}</Text>}
                        </View>

                        {/* Data de Nascimento */}
                        <View className='mb-5'>
                             <Text className='text-xl font-semibold text-text mb-2'>Data de Nascimento</Text>
                             <Controller control={control} name="data_nascimento" render={({ field: { onChange, onBlur, value } }) => (
                                 <Input placeholder="AAAA-MM-DD" onBlur={onBlur} onChangeText={onChange} value={value} maxLength={10} keyboardType="numeric"/>
                             )}/>
                             {errors.data_nascimento && <Text className="text-attention mt-1">{errors.data_nascimento.message}</Text>}
                        </View>

                        {/* Senha */}
                        <View className='mb-5'>
                            <Text className='text-xl font-semibold text-text mb-2'>Senha</Text>
                            <Controller control={control} name="senha" render={({ field: { onChange, onBlur, value } }) => (
                                <Input placeholder="Mínimo 8 caracteres" onBlur={onBlur} onChangeText={onChange} value={value} secureTextEntry />
                            )}/>
                            {errors.senha && <Text className="text-attention mt-1">{errors.senha.message}</Text>}
                        </View>

                        {/* Confirmar Senha */}
                        <View>
                            <Text className='text-xl font-semibold text-text mb-2'>Confirmar Senha</Text>
                             <Controller control={control} name="confirmarSenha" render={({ field: { onChange, onBlur, value } }) => (
                                <Input placeholder="Repita a senha" onBlur={onBlur} onChangeText={onChange} value={value} secureTextEntry />
                             )}/>
                            {errors.confirmarSenha && <Text className="text-attention mt-1">{errors.confirmarSenha.message}</Text>}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

             {/* Botões - Condicional para loading */}
            <View className='w-full flex-row justify-between pt-4'>
                 <Button title='Cancelar' onPress={handleCancelar} type='attention' disabled={isSubmitting}/>
                 {isSubmitting ? (
                     <ActivityIndicator size="large" color="#A6C98C" className="mx-5"/> // Cor de sucesso para loading de confirmação
                 ) : (
                    <Button title='Confirmar' type='success' onPress={handleSubmit(handleConfirmar)} />
                 )}
            </View>
        </View >
    );
};

export default CreateAccountScreen;