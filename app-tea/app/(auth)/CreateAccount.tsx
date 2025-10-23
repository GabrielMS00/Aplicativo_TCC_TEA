// app-tea/app/(auth)/CreateAccount.tsx
import React, { useState } from 'react'; // Mantemos useState para isLoading local
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form'; // Importar react-hook-form
import * as yup from 'yup'; // Importar yup
import { yupResolver } from '@hookform/resolvers/yup'; // Importar resolver
import { registerApi } from '../../api/auth'; // Importar a função da API que criamos
import { useAuth } from '../../context/AuthContext'; // Importar useAuth para login automático pós-cadastro

// Esquema de validação com Yup, baseado nos seus inputs existentes + data_nascimento (obrigatório no backend)
const registerSchema = yup.object().shape({
  nome: yup.string().required('Nome é obrigatório'),
  // Ajuste a validação do CPF se precisar ser mais específica (ex: remover máscara antes de validar)
  cpf: yup.string().required('CPF é obrigatório').matches(/^(\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{11})$/, 'CPF inválido'),
  email: yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
  senha: yup.string().min(8, 'Senha deve ter no mínimo 8 caracteres').required('Senha é obrigatória'),
  confirmarSenha: yup.string()
    .oneOf([yup.ref('senha')], 'As senhas não conferem') // Valida se é igual ao campo 'senha'
    .required('Confirmação de senha é obrigatória'),
  // TO-DO: Adicionar input real para data de nascimento e ajustar validação
  data_nascimento: yup.string().required('Data de nascimento obrigatória (use YYYY-MM-DD)'), // Campo necessário para a API
});

// Define o tipo dos dados do formulário baseado no schema
type FormData = yup.InferType<typeof registerSchema>;

// Renomeado o componente para evitar conflito com LoginScreen
const CreateAccountScreen = () => {
    // Usaremos um estado local para loading nesta tela
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Pegamos o signIn do AuthContext caso o backend retorne o token no registro
    const { signIn } = useAuth();

    // Configuração do react-hook-form
    const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: yupResolver(registerSchema),
        defaultValues: {
            nome: '',
            cpf: '',
            email: '',
            senha: '',
            confirmarSenha: '',
            data_nascimento: '1990-01-01', // Valor placeholder inicial - AJUSTAR DEPOIS
        }
    });

    const handleCancelar = () => {
        // Volta para a tela anterior (Login)
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/'); // Fallback caso não possa voltar
        }
    }

    // Função chamada pelo handleSubmit APENAS se a validação passar
    const handleConfirmar = async (data: FormData) => {
        setIsSubmitting(true);
        // Formatar CPF para enviar sem máscara (se necessário)
        const formattedCpf = data.cpf.replace(/[^\d]/g, '');

        // TO-DO: Implementar seleção e formatação correta da data de nascimento
        // const formattedDate = format(data.data_nascimento, 'yyyy-MM-dd'); // Exemplo com date-fns
        // Por agora, usamos o placeholder:
        const formattedDate = data.data_nascimento; // Assumindo que o placeholder já está YYYY-MM-DD

        const response = await registerApi({
            nome: data.nome,
            cpf: formattedCpf,
            email: data.email,
            data_nascimento: formattedDate, // Usar data formatada/placeholder
            senha: data.senha,
        });

        setIsSubmitting(false);

        if (response) {
            // Cadastro bem-sucedido
            Alert.alert('Cadastro Realizado', response.message);
            // Tenta logar automaticamente se o backend retornou token
             if (response.token && response.cuidador) {
                 await signIn({ email: data.email, senha: data.senha }); // Tenta logar com os dados recém-cadastrados
                 // O AuthContext cuidará do redirecionamento para a Home
             } else {
                 router.replace('/'); // Se não logou, volta para a tela de login
             }
        }
        // Se response for null, o registerApi já mostrou o Alert de erro
    };

    return (
        // Mantém sua estrutura e estilos className
        <View className='flex-1 bg-background p-5'>

            <Text className='text-5xl font-extrabold text-primary text-center pt-20'>Cadastro</Text>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }} // Style inline mantido
            >
                {/* ScrollView mantido */}
                <ScrollView showsVerticalScrollIndicator={false}>

                    <View className='flex-1 justify-center pt-14'>

                        {/* Input Nome com Controller */}
                        <View className='mb-5'>
                            <Text className='text-xl font-semibold text-text mb-2'>Nome Completo</Text>
                            <Controller
                                control={control}
                                name="nome"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        placeholder="Seu nome completo" // Placeholder adicionado
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                    />
                                )}
                            />
                            {/* Exibe erro de validação */}
                            {errors.nome && <Text className="text-attention mt-1">{errors.nome.message}</Text>}
                        </View>

                        {/* Input CPF com Controller */}
                        <View className='mb-5'>
                            <Text className='text-xl font-semibold text-text mb-2'>CPF</Text>
                            <Controller
                                control={control}
                                name="cpf"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        placeholder="000.000.000-00" // Placeholder adicionado
                                        onBlur={onBlur}
                                        onChangeText={onChange} // TO-DO: Adicionar máscara de CPF aqui se desejar
                                        value={value}
                                        keyboardType='numeric'
                                        maxLength={14} // Com máscara. Ajuste se não usar máscara.
                                    />
                                )}
                            />
                            {errors.cpf && <Text className="text-attention mt-1">{errors.cpf.message}</Text>}
                        </View>

                        {/* Input E-mail com Controller */}
                        <View className='mb-5'>
                            <Text className='text-xl font-semibold text-text mb-2'>E-mail</Text>
                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        placeholder="seuemail@exemplo.com" // Placeholder adicionado
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                )}
                            />
                            {errors.email && <Text className="text-attention mt-1">{errors.email.message}</Text>}
                        </View>

                        {/* TO-DO: Input real para Data de Nascimento */}
                        <View className='mb-5'>
                             <Text className='text-xl font-semibold text-text mb-2'>Data de Nascimento (AAAA-MM-DD)</Text>
                             <Controller
                                control={control}
                                name="data_nascimento"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    // Input temporário - SUBSTITUIR por um DatePicker
                                     <Input placeholder="AAAA-MM-DD" onBlur={onBlur} onChangeText={onChange} value={value} maxLength={10}/>
                                )} />
                             {errors.data_nascimento && <Text className="text-attention mt-1">{errors.data_nascimento.message}</Text>}
                        </View>


                        {/* Input Senha com Controller */}
                        <View className='mb-5'>
                            <Text className='text-xl font-semibold text-text mb-2'>Senha</Text>
                            <Controller
                                control={control}
                                name="senha"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        placeholder="Mínimo 8 caracteres" // Placeholder adicionado
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                        secureTextEntry
                                    />
                                )}
                            />
                            {errors.senha && <Text className="text-attention mt-1">{errors.senha.message}</Text>}
                        </View>

                        {/* Input Confirmar Senha com Controller */}
                        <View>
                            <Text className='text-xl font-semibold text-text mb-2'>Confirmar Senha</Text>
                             <Controller
                                control={control}
                                name="confirmarSenha"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        placeholder="Repita a senha" // Placeholder adicionado
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                        secureTextEntry
                                    />
                                )}
                            />
                            {errors.confirmarSenha && <Text className="text-attention mt-1">{errors.confirmarSenha.message}</Text>}
                        </View>

                    </View>

                </ScrollView>

            </KeyboardAvoidingView>

             {/* Botões - Mostra ActivityIndicator durante o envio */}
            {isSubmitting ? (
                 <ActivityIndicator size="large" color="#87CFCF" className="my-5"/> // Ajuste a margem se necessário
            ) : (
                <View className='w-full flex-row justify-between'>
                    {/* Botão Cancelar mantido */}
                    <Button title='Cancelar' onPress={handleCancelar} type='attention' />
                     {/* Botão Confirmar agora usa handleSubmit */}
                    <Button title='Confirmar' type='success' onPress={handleSubmit(handleConfirmar)} />
                </View>
             )}

        </View >
    );
};


export default CreateAccountScreen;