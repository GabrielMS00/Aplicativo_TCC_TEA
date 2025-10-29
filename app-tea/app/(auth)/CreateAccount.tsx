// app-tea/app/(auth)/CreateAccount.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, TouchableOpacity } from 'react-native'; // Add TouchableOpacity
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'; 
import { format } from 'date-fns'; 
import { registerApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { formatCPF, unformatCPF } from '../../utils/formatters'; // Importe as funções

// Esquema de validação (mantido)
const registerSchema = yup.object().shape({
  nome: yup.string().required('Nome é obrigatório'),
  cpf: yup.string().required('CPF é obrigatório').matches(/^(\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{11})$/, 'CPF inválido'),
  email: yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
  senha: yup.string().min(8, 'Senha deve ter no mínimo 8 caracteres').required('Senha é obrigatória'),
  confirmarSenha: yup.string()
    .oneOf([yup.ref('senha')], 'As senhas não conferem')
    .required('Confirmação de senha é obrigatória'),
  data_nascimento: yup.date().required('Data de nascimento obrigatória').max(new Date(), 'Data inválida'), // Use date type for validation
});

// Use Date type for data_nascimento
type FormData = Omit<yup.InferType<typeof registerSchema>, 'data_nascimento'> & {
  data_nascimento: Date;
};

const CreateAccountScreen = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { signIn } = useAuth();
    const [showDatePicker, setShowDatePicker] = useState(false); // State for date picker visibility

    const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({ // Add setValue and watch
        resolver: yupResolver(registerSchema),
        defaultValues: {
            nome: '',
            cpf: '',
            email: '',
            senha: '',
            confirmarSenha: '',
            data_nascimento: new Date(), // Initialize with a Date object
        }
    });

    const currentBirthDate = watch('data_nascimento'); // Watch the date value

    const handleCancelar = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    }

    const handleConfirmar = async (data: FormData) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        console.log('[CreateAccount] Tentando registrar com:', data);

        const formattedCpf = unformatCPF(data.cpf);
        const formattedDate = format(data.data_nascimento, 'yyyy-MM-dd');

        const response = await registerApi({
            nome: data.nome,
            cpf: formattedCpf,
            email: data.email,
            data_nascimento: formattedDate,
            senha: data.senha,
        });

        if (response && response.token && response.cuidador) {
            console.log('[CreateAccount] Registro API bem-sucedido:', response.message);
            Alert.alert('Cadastro Realizado', response.message || 'Usuário cadastrado com sucesso!');
            try {
                 console.log('[CreateAccount] Tentando login automático...');
                 await signIn({ email: data.email, senha: data.senha });
                 console.log('[CreateAccount] Login automático iniciado (AuthContext deve redirecionar).');
                 setIsSubmitting(false);
            } catch (signInError) {
                 console.error('[CreateAccount] Erro DURANTE o login automático:', signInError);
                 Alert.alert('Cadastro OK, Login Falhou', 'Seu cadastro foi realizado, mas ocorreu um erro ao entrar automaticamente. Tente fazer login manualmente.');
                 setIsSubmitting(false);
                 router.replace('/');
            }
        } else {
            console.log('[CreateAccount] Falha no registro via API.');
            setIsSubmitting(false);
        }
    };

    // Handler for DateTimePicker change event
    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios'); // Keep visible on iOS until dismissed
        if (event.type === 'set' && selectedDate) {
            setValue('data_nascimento', selectedDate, { shouldValidate: true }); // Update form value
        }
    };

    return (
        <View className='flex-1 bg-background p-5'>
            <Text className='text-5xl font-extrabold text-primary text-center pt-20'>Cadastro</Text>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    <View className='flex-1 justify-center pt-14'>
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
                            <Controller
                                control={control}
                                name="cpf"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        placeholder="000.000.000-00"
                                        onBlur={onBlur}
                                        // Formata o texto enquanto o usuário digita
                                        onChangeText={(text) => onChange(formatCPF(text))} // <--- FORMATAR AQUI
                                        value={value} // O valor no RHF já estará formatado
                                        keyboardType='numeric'
                                        maxLength={14} // Ajustar maxLength para incluir a máscara
                                    />
                                )}
                            />
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

                        {/* Data de Nascimento - Replaced Input with TouchableOpacity */}
                        <View className='mb-5'>
                             <Text className='text-xl font-semibold text-text mb-2'>Data de Nascimento</Text>
                             <TouchableOpacity onPress={() => setShowDatePicker(true)} className='bg-white rounded-lg px-4 py-4'>
                                <Text className='text-xl'>{format(currentBirthDate || new Date(), 'dd/MM/yyyy')}</Text>
                             </TouchableOpacity>
                             {/* Show DateTimePicker when showDatePicker is true */}
                             {showDatePicker && (
                                <DateTimePicker
                                    testID="dateTimePicker"
                                    value={currentBirthDate || new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onDateChange}
                                    maximumDate={new Date()} // Prevent selecting future dates
                                />
                             )}
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
            <View className='w-full flex-row justify-between pt-4'>
                 <Button title='Cancelar' onPress={handleCancelar} type='attention' disabled={isSubmitting}/>
                 {isSubmitting ? (
                     <ActivityIndicator size="large" color="#A6C98C" className="mx-5"/>
                 ) : (
                    <Button title='Confirmar' type='success' onPress={handleSubmit(handleConfirmar)} />
                 )}
            </View>
        </View >
    );
};

export default CreateAccountScreen;