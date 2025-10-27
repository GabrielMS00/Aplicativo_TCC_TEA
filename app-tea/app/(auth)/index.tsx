import React from 'react'; 
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MainButton } from '../../components/MainButton';
import { router, useRouter } from 'expo-router';
import { Input } from '../../components/Input';
import { useForm, Controller } from 'react-hook-form'; 
import * as yup from 'yup'; 
import { yupResolver } from '@hookform/resolvers/yup'; 
import { useAuth } from '../../context/AuthContext'; 

const loginTemportario = () => {
  router.replace('../(tabs)/Home');
}

// Esquema de validação com Yup 
const loginSchema = yup.object().shape({
  email: yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
  senha: yup.string().min(6, 'Senha deve ter no mínimo 6 caracteres').required('Senha é obrigatória'),
});

// Define o tipo dos dados do formulário baseado no schema
type FormData = yup.InferType<typeof loginSchema>;

const LoginScreen = () => {
  const router = useRouter();
  const { signIn, isLoading } = useAuth(); // Pegar a função signIn e o estado isLoading do contexto

  // Configuração do react-hook-form
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '', 
      senha: ''
    }
  });

  // Função chamada pelo handleSubmit APENAS se a validação passar
  const handleEntrar = async (data: FormData) => {
    // Chama a função signIn do AuthContext com os dados validados
    await signIn({ email: data.email, senha: data.senha });
    // O redirecionamento será feito automaticamente pelo AuthContext após o sucesso
  };

  const handleCadastrar = () => {
    // Mantém a navegação para a tela de cadastro
    router.push('/CreateAccount'); // Usar push em vez de replace permite voltar
  }

  return (
    <View className='flex-1 bg-background p-5'>

      <View className='flex-1 justify-center'>

        <Text className='text-5xl font-extrabold text-primary text-center mb-14 pb-2'>Login</Text>

          {/* Input de E-mail controlado pelo react-hook-form */}
          <View className='mb-8'>
            <Text className='text-xl font-semibold text-text mb-2'>E-mail</Text>
            <Controller
              control={control}
              name="email" // Nome do campo correspondente no schema
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="seuemail@exemplo.com" // Placeholder mais informativo
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address" // Teclado apropriado
                  autoCapitalize="none" // Desabilitar capitalização automática
                />
              )}
            />
            {/* Exibe erro de validação, se houver */}
            {errors.email && <Text className="text-attention mt-1">{errors.email.message}</Text>}
          </View>

          {/* Input de Senha controlado pelo react-hook-form */}
          <View className='mb-8'>
            <Text className='text-xl font-semibold text-text mb-2'>Senha</Text>
             <Controller
              control={control}
              name="senha"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="******" // Placeholder
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry
                />
              )}
            />
             {/* Exibe erro de validação, se houver */}
            {errors.senha && <Text className="text-attention mt-1">{errors.senha.message}</Text>}
          </View>

          <View className='mt-5'>
            <TouchableOpacity
              onPress={() => Alert.alert("Funcionalidade Esqueci Senha", "Ainda não implementado.")}
            >
              <Text className='text-base font-extrabold text-text mb-2'>Esqueci minha senha</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCadastrar} // Função mantida
            >
              <Text className='text-base font-extrabold text-text mb-2'>Cadastre-se</Text>
            </TouchableOpacity>
          </View>

      </View>

      {/* Condicional para mostrar loading ou botão */}
      {isLoading ? (
      
        <ActivityIndicator size="large" color="#87CFCF" className="mb-10"/> 
      ) : (
        // <MainButton title='Entrar' onPress={handleSubmit(handleEntrar)} />
        <MainButton title='Entrar' onPress={loginTemportario} />
      )}

    </View>
  );
};

export default LoginScreen;