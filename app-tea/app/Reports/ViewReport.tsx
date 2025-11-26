import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getRelatorioGeralApi, RelatorioGeral } from '../../api/relatorio';
import { format } from 'date-fns';
import * as Print from 'expo-print'; // Importar
import * as Sharing from 'expo-sharing'; // Importar
import { generateReportHtml } from '../../utils/generateReportHtml'; // Importar helper

const ViewReportScreen = () => {
  const { assistidoId } = useLocalSearchParams<{ assistidoId: string }>();
  const router = useRouter();
  const [relatorio, setRelatorio] = useState<RelatorioGeral | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    const fetchRelatorio = async () => {
      if (assistidoId) {
        const data = await getRelatorioGeralApi(assistidoId);
        setRelatorio(data);
      }
      setIsLoading(false);
    };
    fetchRelatorio();
  }, [assistidoId]);

  const handleDownloadPdf = async () => {
    if (!relatorio) return;

    try {
      setIsGeneratingPdf(true);

      // 1. Gera o HTML com os dados atuais
      const html = generateReportHtml(relatorio);

      // 2. Cria o arquivo PDF
      const { uri } = await Print.printToFileAsync({ html });
      console.log('PDF gerado em:', uri);

      // 3. Compartilha o arquivo (Salvar/Enviar)
      // O Sharing é necessário no iOS para salvar em Arquivos, e no Android para abrir/enviar
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        Alert.alert("Sucesso", "PDF gerado, mas o compartilhamento não está disponível neste dispositivo.");
      }

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      Alert.alert("Erro", "Não foi possível gerar o PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#87CFCF" />
      </View>
    );
  }

  if (!relatorio) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Text className="text-text text-lg">Não foi possível carregar o relatório.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-bold">Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header com Botão de PDF */}
      <View className="pt-12 pb-4 px-5 bg-primary flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-white text-2xl font-bold">{'<'}</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Relatório Geral</Text>
        </View>

        <TouchableOpacity onPress={handleDownloadPdf} disabled={isGeneratingPdf}>
          {isGeneratingPdf ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-white font-bold border border-white rounded px-3 py-1 text-sm">
              PDF ⬇
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Visualização na Tela (Mantida igual) */}

        {/* 1. Dados Pessoais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados Pessoais</Text>
          <Text style={styles.label}>Nome: <Text style={styles.value}>{relatorio.dadosPessoais.nome}</Text></Text>
          <Text style={styles.label}>Nascimento: <Text style={styles.value}>{format(new Date(relatorio.dadosPessoais.dataNascimento), 'dd/MM/yyyy')}</Text></Text>
          <Text style={styles.label}>Suporte: <Text style={styles.value}>{relatorio.dadosPessoais.nivelSuporte || 'N/I'}</Text></Text>
          <Text style={styles.label}>Seletividade: <Text style={styles.value}>{relatorio.dadosPessoais.grauSeletividade || 'N/I'}</Text></Text>
        </View>

        {/* 2. Questionários */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Respostas dos Questionários</Text>
          {relatorio.questionarios.length === 0 ? (
            <Text className="text-gray-500 italic">Nenhum questionário respondido.</Text>
          ) : (
            relatorio.questionarios.map((q, index) => (
              <View key={index} className="mb-3 border-b border-gray-200 pb-2">
                <Text className="text-xs text-primary font-bold uppercase mb-1">{q.questionario}</Text>
                <Text className="text-base text-text font-semibold">{q.texto_pergunta}</Text>
                <Text className="text-base text-secondary mt-1">R: {q.texto_opcao}</Text>
              </View>
            ))
          )}
        </View>

        {/* 3. Histórico de Trocas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de Trocas</Text>
          {relatorio.historicoTrocas.length === 0 ? (
            <Text className="text-gray-500 italic">Nenhuma troca registrada.</Text>
          ) : (
            relatorio.historicoTrocas.map((troca, tIndex) => (
              <View key={tIndex} className="mb-4 bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                <View className="flex-row justify-between mb-2 border-b border-gray-100 pb-1">
                  <Text className="font-bold text-primary">{troca.refeicao}</Text>
                  <Text className="text-gray-500 text-xs">{format(new Date(troca.data), 'dd/MM/yyyy HH:mm')}</Text>
                </View>
                {troca.itens.map((item, iIndex) => (
                  <View key={iIndex} className="pl-2 mb-2">
                    <Text className="text-base text-text">• {item.alimento}</Text>
                    <Text className={`text-sm font-bold ${item.status === 'aceito' ? 'text-secondary' : item.status === 'recusado' ? 'text-attention' : 'text-gray-500'}`}>
                      Status: {item.status.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#87CFCF',
    paddingLeft: 10
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4
  },
  value: {
    fontWeight: 'bold',
    color: '#2C3E50'
  }
});

export default ViewReportScreen;