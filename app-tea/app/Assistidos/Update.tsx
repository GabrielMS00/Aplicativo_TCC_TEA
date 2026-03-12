import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ActivityIndicator, ScrollView, Platform, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getAssistidoByIdApi, updateAssistidoApi } from '../../api/assistidos';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { SelectInput } from '../../components/SelectInput';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { parseDateToLocal } from '../../utils/formatters';

const suportOptions = [
  { label: 'Não definido', value: '' },
  { label: 'Nível 1', value: 'Nível 1' },
  { label: 'Nível 2', value: 'Nível 2' },
  { label: 'Nível 3', value: 'Nível 3' },
];

const foodSelectivityOptions = [
  { label: 'Leve', value: 'Leve' },
  { label: 'Moderado', value: 'Moderado' },
  { label: 'Alto', value: 'Alto' },
  { label: 'Não sei informar', value: 'Não sei informar' },
];

export default function UpdateAssistidoScreen() {
  const { id } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState(new Date());
  const [suporte, setSuporte] = useState<string>('');
  const [seletividade, setSeletividade] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const fetchAssistido = async () => {
      if (!id) return;
      const data = await getAssistidoByIdApi(id as string);
      if (data) {
        setNome(data.nome);
        setDataNascimento(parseDateToLocal(data.data_nascimento));
        setSuporte(data.nivel_suporte || '');
        setSeletividade(data.grau_seletividade || '');
      } else {
        Alert.alert("Erro", "Assistido não encontrado.");
        router.back();
      }
      setIsLoading(false);
    };
    fetchAssistido();
  }, [id]);

  const handleUpdate = async () => {
    if (!nome.trim()) {
      Alert.alert("Erro", "O nome é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    const formattedDate = format(dataNascimento, 'yyyy-MM-dd');

    const result = await updateAssistidoApi(id as string, {
      nome,
      data_nascimento: formattedDate,
      nivel_suporte: suporte,
      grau_seletividade: seletividade
    });

    setIsSubmitting(false);

    if (result) {
      Alert.alert("Sucesso", "Dados atualizados!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDataNascimento(selectedDate);
  };

  if (isLoading) {
    return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#87CFCF" /></View>;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView className="flex-1 bg-background p-5">
        <Text className="text-2xl font-bold text-text mb-6 text-center">Editar Assistido</Text>

        <View className="mb-4">
          <Text className="text-lg font-semibold text-text mb-2">Nome</Text>
          <Input value={nome} onChangeText={setNome} placeholder="Nome do assistido" />
        </View>

        <View className="mb-4">
          <Text className="text-lg font-semibold text-text mb-2">Data de Nascimento</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} className="bg-white rounded-lg p-4 border border-gray-200">
            <Text className="text-lg">{format(dataNascimento, 'dd/MM/yyyy')}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dataNascimento}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        <View className="mb-4">
          <Text className="text-lg font-semibold text-text mb-2">Nível de Suporte</Text>
          <SelectInput
            options={suportOptions}
            selectedValue={suporte}
            onValueChange={setSuporte}
            placeholder="Selecione..."
          />
        </View>

        <View className="mb-8">
          <Text className="text-lg font-semibold text-text mb-2">Grau de Seletividade</Text>
          <SelectInput
            options={foodSelectivityOptions}
            selectedValue={seletividade}
            onValueChange={setSeletividade}
            placeholder="Selecione..."
          />
        </View>

        {isSubmitting ? (
          <ActivityIndicator size="large" color="#87CFCF" />
        ) : (
          <View className="gap-3 mb-10">
            <Button title="Salvar Alterações" type="success" onPress={handleUpdate} />
            <Button title="Cancelar" type="default" onPress={() => router.back()} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}