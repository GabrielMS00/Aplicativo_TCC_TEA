import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MainButton } from '../../components/MainButton';
import { useRouter } from 'expo-router';
import { Input } from '../../components/Input';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../context/AuthContext';

// Esquema de validação
const loginSchema = yup.object().shape({
  email: yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
  senha: yup.string().min(6, 'Senha deve ter no mínimo 6 caracteres').required('Senha é obrigatória'),
});

// Define o tipo dos dados do formulário baseado no schema
type FormData = yup.InferType<typeof loginSchema>;

const LoginScreen = () => {
  const router = useRouter();
  const { signIn, isLoading } = useAuth();

  // Configuração do react-hook-form
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      senha: ''
    }
  });

  const handleEntrar = async (data: FormData) => {
    await signIn({ email: data.email, senha: data.senha });
  };

  const handleCadastrar = () => {
    router.push('/CreateAccount');
  }

  const handleEsqueciSenha = () => {
    // Caminho para a nova tela de recuperação
    router.push('/ForgotPassword');
  }

  return (
    <View className='flex-1 bg-background p-5'>

      <View className='flex-1 justify-center'>

        <Text className='text-5xl font-extrabold text-primary text-center mb-14 pb-2'>
          Login
        </Text>

        <View className='mb-8'>
          <Text className='text-xl font-semibold text-text mb-2'>
            E-mail
          </Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="seuemail@exemplo.com"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          {errors.email && (
            <Text className="text-attention mt-1">
              {errors.email.message}
            </Text>
          )}
        </View>

        <View className='mb-8'>
          <Text className='text-xl font-semibold text-text mb-2'>
            Senha
          </Text>
          <Controller
            control={control}
            name="senha"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="******"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
              />
            )}
          />
          {errors.senha && (
            <Text className="text-attention mt-1">
              {errors.senha.message}
            </Text>
          )}
        </View>

        <View className='mt-5'>
          <TouchableOpacity onPress={handleEsqueciSenha}>
            <Text className='text-base font-extrabold text-text mb-2'>
              Esqueci minha senha
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCadastrar}>
            <Text className='text-base font-extrabold text-text mb-2'>
              Cadastre-se
            </Text>
          </TouchableOpacity>
        </View>

      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#87CFCF" className="mb-10" />
      ) : (
        <MainButton title='Entrar' onPress={handleSubmit(handleEntrar)} />
      )}

    </View>
  );
};

export default LoginScreen;