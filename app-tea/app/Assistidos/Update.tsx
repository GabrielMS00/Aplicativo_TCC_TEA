import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { getAssistidoByIdApi, updateAssistidoApi } from '../../api/assistidos';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { SelectInput } from '../../components/SelectInput';
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
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [nome, setNome] = useState('');
  const [dataNascimentoStr, setDataNascimentoStr] = useState('');
  const [suporte, setSuporte] = useState<string>('');
  const [seletividade, setSeletividade] = useState<string>('');

  // Converte a data que vem do banco para o padrão "DD/MM/AAAA"
  const formatDbDateToStr = (dbDate: string) => {
    if (!dbDate) return '';
    const dateObj = parseDateToLocal(dbDate);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Função para aplicar a máscara na digitação
  const handleDateChange = (text: string) => {
    let v = text.replace(/\D/g, '');
    if (v.length > 8) v = v.slice(0, 8);
    if (v.length > 4) {
      v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
    } else if (v.length > 2) {
      v = `${v.slice(0, 2)}/${v.slice(2)}`;
    }
    setDataNascimentoStr(v);
  };

  useEffect(() => {
    const fetchAssistido = async () => {
      if (!id) return;
      const data = await getAssistidoByIdApi(id as string);
      if (data) {
        setNome(data.nome);
        setDataNascimentoStr(formatDbDateToStr(data.data_nascimento));
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

    setIsSubmitting(true);
    const formattedDate = `${year}-${month}-${day}`; // Prepara para o banco

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

  if (isLoading) {
    return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#87CFCF" /></View>;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} className="bg-background">
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <Text className="text-2xl font-bold text-text mb-6 text-center">Editar Assistido</Text>

        <View className="mb-4">
          <Text className="text-lg font-semibold text-text mb-2">Nome</Text>
          <Input value={nome} onChangeText={setNome} placeholder="Nome do assistido" />
        </View>

        <View className="mb-4">
          <Text className="text-lg font-semibold text-text mb-2">Data de Nascimento</Text>
          <Input
            value={dataNascimentoStr}
            onChangeText={handleDateChange}
            placeholder="DD/MM/AAAA"
            keyboardType="numeric"
            maxLength={10}
          />
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
