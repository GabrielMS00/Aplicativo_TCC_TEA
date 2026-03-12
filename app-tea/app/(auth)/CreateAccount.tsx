import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { registerApi, RegisterData } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { formatCPF, unformatCPF } from '../../utils/formatters';
import { RadioButton } from '../../components/RadioButton';
import { SelectInput } from '../../components/SelectInput';

// Opções para os selects
const suportOptions = [
    { label: 'Nível 1 (Suporte Leve)', value: 'Nível 1' },
    { label: 'Nível 2 (Suporte Moderado)', value: 'Nível 2' },
    { label: 'Nível 3 (Suporte Substancial)', value: 'Nível 3' },
];

const selectivityOptions = [
    { label: 'Leve', value: 'leve' },
    { label: 'Moderada', value: 'moderada' },
    { label: 'Alta', value: 'alta' },
    { label: 'Não sei informar', value: 'nao_sei' },
];

// Esquema de validação
const registerSchema = yup.object().shape({
    nome: yup.string().required('Nome é obrigatório'),
    cpf: yup.string().required('CPF é obrigatório').matches(/^(\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{11})$/, 'CPF inválido'),
    email: yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
    senha: yup.string().min(8, 'Senha deve ter no mínimo 8 caracteres').required('Senha é obrigatória'),
    confirmarSenha: yup.string()
        .oneOf([yup.ref('senha')], 'As senhas não conferem')
        .required('Confirmação de senha é obrigatória'),
    data_nascimento: yup.date().required('Data de nascimento obrigatória').max(new Date(), 'Data inválida'),
    tipo_usuario: yup.string().oneOf(['cuidador', 'padrao'], 'Selecione o tipo de conta').required('Selecione o tipo de conta'),
    palavra_seguranca: yup.string().required('Crie uma palavra de segurança').min(3, 'Mínimo 3 letras'),

    // Campos condicionais
    nivel_suporte: yup.string().when('tipo_usuario', {
        is: 'padrao',
        then: (schema) => schema.required('Selecione o nível de suporte'),
        otherwise: (schema) => schema.notRequired(), // Use notRequired em vez de optional para clareza do Yup
    }),
    grau_seletividade: yup.string().when('tipo_usuario', {
        is: 'padrao',
        then: (schema) => schema.required('Selecione o grau de seletividade'),
        otherwise: (schema) => schema.notRequired(),
    }),
});

interface FormData {
    nome: string;
    cpf: string;
    email: string;
    senha: string;
    confirmarSenha: string;
    data_nascimento: Date;
    tipo_usuario: 'cuidador' | 'padrao';
    palavra_seguranca: string;
    nivel_suporte?: string;
    grau_seletividade?: string;
}

const CreateAccountScreen = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { handleRegistration } = useAuth();
    const [showDatePicker, setShowDatePicker] = useState(false);

    const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
        resolver: yupResolver(registerSchema) as any,
        defaultValues: {
            nome: '',
            cpf: '',
            email: '',
            senha: '',
            confirmarSenha: '',
            data_nascimento: new Date(),
            tipo_usuario: undefined,
            palavra_seguranca: '',
            nivel_suporte: undefined,
            grau_seletividade: undefined,
        }
    });

    const currentBirthDate = watch('data_nascimento');
    const userType = watch('tipo_usuario');

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

        const formattedCpf = unformatCPF(data.cpf);
        const formattedDate = format(data.data_nascimento, 'yyyy-MM-dd');

        const apiData: RegisterData = {
            nome: data.nome,
            cpf: formattedCpf,
            email: data.email,
            data_nascimento: formattedDate,
            senha: data.senha,
            tipo_usuario: data.tipo_usuario,
            palavra_seguranca: data.palavra_seguranca,
            nivel_suporte: data.tipo_usuario === 'padrao' ? data.nivel_suporte : undefined,
            grau_seletividade: data.tipo_usuario === 'padrao' ? data.grau_seletividade : undefined,
        };

        const response = await registerApi(apiData);

        if (response && response.token && response.cuidador) {
            try {
                // Salva a sessão no contexto
                await handleRegistration(response);

                if (response.cuidador.tipo_usuario === 'padrao') {
                    Alert.alert(
                        'Cadastro Realizado',
                        'Para finalizar seu perfil, por favor responda aos questionários a seguir.',
                        [
                            {
                                text: 'OK, Vamos lá',
                                onPress: () => {
                                    // Redirecionamento de segurança (caso o AuthContext não tenha agido ainda)
                                    router.replace({
                                        pathname: '/QuestionnaireFlow/Screen',
                                        params: {
                                            assistidoId: response.assistidoIdPadrao,
                                        }
                                    });
                                }
                            }
                        ]
                    );
                } else {
                    Alert.alert('Cadastro Realizado', 'Login efetuado com sucesso!');
                    router.replace('/(tabs)/Home');
                }
            } catch (authError) {
                Alert.alert('Erro', 'Ocorreu um erro ao salvar sua sessão. Tente fazer login manualmente.');
                router.replace('/');
            }
        }
        setIsSubmitting(false);
    };

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (event.type === 'set' && selectedDate) {
            setValue('data_nascimento', selectedDate, { shouldValidate: true });
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
                    <View className='flex-1 justify-center pt-10'>

                        {/* TIPO DE CONTA */}
                        <View className='mb-5 p-4 bg-white rounded-lg shadow'>
                            <Text className='text-xl font-semibold text-text mb-4'>Tipo de Conta</Text>
                            <RadioButton
                                label="É para meu uso pessoal"
                                selected={userType === 'padrao'}
                                onSelect={() => setValue('tipo_usuario', 'padrao', { shouldValidate: true })}
                            />
                            <RadioButton
                                label="Sou um cuidador (para outra pessoa)"
                                selected={userType === 'cuidador'}
                                onSelect={() => setValue('tipo_usuario', 'cuidador', { shouldValidate: true })}
                            />
                            {errors.tipo_usuario && <Text className="text-attention mt-1">{errors.tipo_usuario.message}</Text>}
                        </View>

                        {/* Campos extras para usuários padrão */}
                        {userType === 'padrao' && (
                            <View className='mb-5 p-4 bg-white rounded-lg shadow border-l-4 border-secondary'>
                                <Text className='text-lg font-bold text-secondary mb-4'>Dados Extras</Text>

                                <View className='mb-4'>
                                    <Text className='text-base font-semibold text-text mb-2'>Nível de Suporte</Text>
                                    <Controller
                                        control={control}
                                        name="nivel_suporte"
                                        render={({ field: { onChange, value } }) => (
                                            <SelectInput
                                                options={suportOptions}
                                                selectedValue={value}
                                                onValueChange={onChange}
                                                placeholder="Selecione o nível..."
                                            />
                                        )}
                                    />
                                    {errors.nivel_suporte && <Text className="text-attention mt-1">{errors.nivel_suporte.message}</Text>}
                                </View>

                                <View>
                                    <Text className='text-base font-semibold text-text mb-2'>Grau de Seletividade</Text>
                                    <Controller
                                        control={control}
                                        name="grau_seletividade"
                                        render={({ field: { onChange, value } }) => (
                                            <SelectInput
                                                options={selectivityOptions}
                                                selectedValue={value}
                                                onValueChange={onChange}
                                                placeholder="Selecione o grau..."
                                            />
                                        )}
                                    />
                                    {errors.grau_seletividade && <Text className="text-attention mt-1">{errors.grau_seletividade.message}</Text>}
                                </View>
                            </View>
                        )}

                        {/* Campos comuns */}
                        <View className='mb-5'>
                            <Text className='text-xl font-semibold text-text mb-2'>Nome Completo</Text>
                            <Controller control={control} name="nome" render={({ field: { onChange, onBlur, value } }) => (
                                <Input placeholder="Seu nome completo" onBlur={onBlur} onChangeText={onChange} value={value} />
                            )} />
                            {errors.nome && <Text className="text-attention mt-1">{errors.nome.message}</Text>}
                        </View>

                        <View className='mb-5'>
                            <Text className='text-xl font-semibold text-text mb-2'>CPF</Text>
                            <Controller control={control} name="cpf" render={({ field: { onChange, onBlur, value } }) => (
                                <Input placeholder="000.000.000-00" onBlur={onBlur} onChangeText={(text) => onChange(formatCPF(text))} value={value} keyboardType='numeric' maxLength={14} />
                            )} />
                            {errors.cpf && <Text className="text-attention mt-1">{errors.cpf.message}</Text>}
                        </View>

                        <View className='mb-5'>
                            <Text className='text-xl font-semibold text-text mb-2'>E-mail</Text>
                            <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
                                <Input placeholder="seuemail@exemplo.com" onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="email-address" autoCapitalize="none" />
                            )} />
                            {errors.email && <Text className="text-attention mt-1">{errors.email.message}</Text>}
                        </View>

                        <View className='mb-5'>
                            <Text className='text-xl font-semibold text-text mb-2'>Data de Nascimento</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(true)} className='bg-white rounded-lg px-4 py-4'>
                                <Text className='text-xl'>{format(currentBirthDate || new Date(), 'dd/MM/yyyy')}</Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker testID="dateTimePicker" value={currentBirthDate || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onDateChange} maximumDate={new Date()} />
                            )}
                            {errors.data_nascimento && <Text className="text-attention mt-1">{errors.data_nascimento.message}</Text>}
                        </View>

                        <View className='mb-5'>
                            <Text className='text-xl font-semibold text-text mb-2'>Senha</Text>
                            <Controller control={control} name="senha" render={({ field: { onChange, onBlur, value } }) => (
                                <Input placeholder="Mínimo 8 caracteres" onBlur={onBlur} onChangeText={onChange} value={value} secureTextEntry />
                            )} />
                            {errors.senha && <Text className="text-attention mt-1">{errors.senha.message}</Text>}
                        </View>

                        <View className='mb-5'>
                            <Text className='text-xl font-semibold text-text mb-2'>Confirmar Senha</Text>
                            <Controller control={control} name="confirmarSenha" render={({ field: { onChange, onBlur, value } }) => (
                                <Input placeholder="Repita a senha" onBlur={onBlur} onChangeText={onChange} value={value} secureTextEntry />
                            )} />
                            {errors.confirmarSenha && <Text className="text-attention mt-1">{errors.confirmarSenha.message}</Text>}
                        </View>

                        <View className='mb-5'>
                            <Text className='text-xl font-semibold text-text mb-2'>Palavra de Segurança</Text>
                            <Text className='text-sm text-gray-500 mb-2'>Para recuperar senha caso esqueça.</Text>
                            <Controller control={control} name="palavra_seguranca" render={({ field: { onChange, onBlur, value } }) => (
                                <Input placeholder="Ex: nomedocachorro" onBlur={onBlur} onChangeText={onChange} value={value} />
                            )} />
                            {errors.palavra_seguranca && <Text className="text-attention mt-1">{errors.palavra_seguranca.message}</Text>}
                        </View>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <View className='w-full flex-row justify-between pt-4'>
                <Button title='Cancelar' onPress={handleCancelar} type='attention' disabled={isSubmitting} />
                {isSubmitting ? (
                    <ActivityIndicator size="large" color="#A6C98C" className="mx-5" />
                ) : (
                    <Button title='Confirmar' type='success' onPress={handleSubmit(handleConfirmar)} />
                )}
            </View>
        </View >
    );
};

export default CreateAccountScreen;