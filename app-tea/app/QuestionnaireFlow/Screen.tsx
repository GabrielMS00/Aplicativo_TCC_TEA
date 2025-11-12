import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../components/Button';
import { RadioButton } from '../../components/RadioButton';
import { getModelosApi, getModeloCompletoApi, salvarRespostasApi, ModeloInfo, PerguntaQuestionario, OpcaoResposta, RespostaItem, SalvarRespostasBody } from '../../api/questionario';
import { createAssistidoApi, CreateAssistidoData } from '../../api/assistidos';
import { useAuth } from '../../context/AuthContext';

type Respostas = Record<string, string>;
const questionnaireOrder = ['Frequência Alimentar', 'Questionário BAMBI', 'STEP-CHILD'];

const QuestionnaireScreen = () => {
  const router = useRouter();
  const { signIn, completeQuestionnaireFlow } = useAuth();

  const {
    questionnaireIndex: questionnaireIndexStr = '0',
    assistidoData: assistidoDataStr = '{}',
    respostasAnteriores: respostasAnterioresStr = '{}',
    assistidoId: assistidoIdParam,
    email: emailParam,
    senha: senhaParam,
  } = useLocalSearchParams<{
    questionnaireIndex?: string,
    assistidoData?: string,
    respostasAnteriores?: string,
    assistidoId?: string,
    email?: string,
    senha?: string
  }>();

  // Modos de operação
  const isCadastroFluxoPadrao = !!(assistidoIdParam && emailParam && senhaParam);
  const isCadastroFluxoCuidador = !!(assistidoDataStr && assistidoDataStr !== '{}' && !assistidoIdParam);
  const isReTeste = !!(assistidoIdParam && !emailParam && !senhaParam);

  const questionnaireIndex = parseInt(questionnaireIndexStr, 10);
  const [modelosDisponiveis, setModelosDisponiveis] = useState<ModeloInfo[]>([]);
  const [modeloAtual, setModeloAtual] = useState<ModeloInfo | null>(null);
  const [perguntas, setPerguntas] = useState<PerguntaQuestionario[]>([]);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchModelos = async () => {
      setIsLoading(true);
      const data = await getModelosApi();
      if (data) {
        const orderedData = questionnaireOrder.map(name =>
          data.find(model => model.nome === name)
        ).filter((model): model is ModeloInfo => model !== undefined);

        if (orderedData.length !== questionnaireOrder.length) {
          console.error("Nem todos os questionários esperados foram encontrados na API:", orderedData);
          Alert.alert("Erro", "Não foi possível encontrar todos os modelos de questionário necessários.");
          if (router.canGoBack()) router.back(); else router.replace('/(tabs)/Home');
          return;
        }
        setModelosDisponiveis(orderedData);
      } else {
        Alert.alert("Erro", "Não foi possível carregar os modelos de questionário.");
        if (router.canGoBack()) router.back(); else router.replace('/(tabs)/Home');
      }
    };
    fetchModelos();
  }, []);

  useEffect(() => {
    const fetchEstruturaQuestionario = async () => {
      if (modelosDisponiveis.length > 0 && questionnaireIndex < modelosDisponiveis.length) {
        setIsLoading(true);
        const currentModel = modelosDisponiveis[questionnaireIndex];
        setModeloAtual(currentModel);
        const data = await getModeloCompletoApi(currentModel.id);
        if (data) {
          setPerguntas(data);
          setRespostas({});
        } else {
          Alert.alert("Erro", `Não foi possível carregar as perguntas para "${currentModel.nome}".`);
          if (router.canGoBack()) router.back();
        }
        setIsLoading(false);
      } else if (modelosDisponiveis.length > 0 && questionnaireIndex >= modelosDisponiveis.length) {
        console.error("Índice de questionário inválido:", questionnaireIndex);
        Alert.alert("Erro", "Índice de questionário inválido.");
        if (router.canGoBack()) router.back(); else router.replace('/(tabs)/Home');
      }
    };
    fetchEstruturaQuestionario();
  }, [questionnaireIndex, modelosDisponiveis]);

  const handleSelectOption = (perguntaId: string, opcaoId: string) => {
    setRespostas(prev => ({ ...prev, [perguntaId]: opcaoId }));
  };

  const handleNext = async () => {
    if (Object.keys(respostas).length < perguntas.length) {
      Alert.alert("Atenção", "Por favor, responda todas as perguntas antes de continuar.");
      return;
    }

    const respostasFormatadas: RespostaItem[] = Object.entries(respostas).map(([perguntaId, opcaoId]) => ({
      pergunta_id: perguntaId,
      opcao_id: opcaoId,
    }));

    const respostasAcumuladas = {
      ...JSON.parse(respostasAnterioresStr),
      [modeloAtual!.id]: respostasFormatadas
    };

    const isLastQuestionnaire = questionnaireIndex === modelosDisponiveis.length - 1;

    if (!isLastQuestionnaire) {
      router.push({
        pathname: '/QuestionnaireFlow/Screen',
        params: {
          questionnaireIndex: (questionnaireIndex + 1).toString(),
          assistidoData: assistidoDataStr,
          respostasAnteriores: JSON.stringify(respostasAcumuladas),
          assistidoId: assistidoIdParam,
          email: emailParam,
          senha: senhaParam,
        }
      });
    } else {

      setIsSubmitting(true);
      try {

        let finalAssistidoId: string;

        if (isCadastroFluxoPadrao || isReTeste) {
          finalAssistidoId = assistidoIdParam!;
          console.log("Finalizando fluxo (Padrão ou Re-Teste) para Assistido ID:", finalAssistidoId);

        } else if (isCadastroFluxoCuidador) {
          console.log("Finalizando fluxo cuidador (novo assistido)...");
          const assistidoData: CreateAssistidoData = JSON.parse(assistidoDataStr);
          const createResponse = await createAssistidoApi(assistidoData);

          if (!createResponse || !createResponse.assistido) {
            Alert.alert("Erro", "Falha ao cadastrar os dados básicos do assistido.");
            setIsSubmitting(false);
            return;
          }
          finalAssistidoId = createResponse.assistido.id;

        } else {
          Alert.alert("Erro", "Não foi possível determinar o assistido para salvar as respostas.");
          setIsSubmitting(false);
          return;
        }

        let todasRespostasSalvas = true;
        for (const modeloId in respostasAcumuladas) {
          const respostasDoModelo: RespostaItem[] = respostasAcumuladas[modeloId];
          const body: SalvarRespostasBody = {
            modelo_questionario_id: modeloId,
            respostas: respostasDoModelo
          };

          const saveResponse = await salvarRespostasApi(finalAssistidoId, body);

          if (!saveResponse) {
            todasRespostasSalvas = false;
            const modeloInfo = modelosDisponiveis.find(m => m.id === modeloId);
            Alert.alert("Erro", `Falha ao salvar respostas do questionário "${modeloInfo?.nome || modeloId}".`);
          } else {
            console.log(`Respostas para modelo ${modeloId} salvas com sucesso.`);
          }
        }

        if (todasRespostasSalvas) {
          if (isCadastroFluxoPadrao && emailParam && senhaParam) {
            Alert.alert("Cadastro Concluído!", "Seu perfil foi criado. Entrando...");
            completeQuestionnaireFlow();
            router.replace('/(tabs)/Home');


          } else if (isReTeste) {
            Alert.alert("Sucesso!", "Seus questionários foram atualizados.");
            router.replace('/(tabs)/Account/Profile');

          } else {
            // FLUXO CADASTRO CUIDADOR:
            Alert.alert("Cadastro Concluído!", "Assistido registrado com sucesso.");
            router.replace('/(tabs)/Home');
          }
        } else {
          Alert.alert("Atenção", "Houve erro ao salvar algumas respostas. Tente novamente mais tarde.");
          if (isReTeste) {
            router.replace('/(tabs)/Account/Profile');
          } else {
            router.replace('/(tabs)/Home');
          }
        }

      } catch (error) {
        console.error("Erro no processo de finalização:", error);
        Alert.alert("Erro Crítico", "Ocorreu um erro inesperado ao finalizar o cadastro.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading || !modeloAtual) {
    return (
      <View className='flex-1 justify-center items-center bg-background'>
        <ActivityIndicator size="large" color="#87CFCF" />
      </View>
    );
  }

  const totalQuestionnaires = modelosDisponiveis.length;
  const isLastQuestionnaire = questionnaireIndex === totalQuestionnaires - 1;

  return (
    <View className='flex-1 bg-background p-5'>
      <TouchableOpacity onPress={() => router.back()} className="absolute top-16 left-5 z-10 p-2">
        <Text className="text-primary text-xl">{'<'} Voltar</Text>
      </TouchableOpacity>

      <Text className='text-3xl font-bold text-text text-center mt-28 mb-4'>{modeloAtual.nome}</Text>
      <Text className='text-lg text-gray-600 text-center mb-8'>
        Passo {questionnaireIndex + 1} de {totalQuestionnaires}
      </Text>

      <ScrollView className='flex-1'>
        {perguntas.map((pergunta) => (
          <View key={pergunta.id} className="mb-4 p-4 bg-white rounded-lg shadow">
            <Text className="text-lg font-semibold text-text mb-4">{pergunta.texto_pergunta}</Text>
            {pergunta.opcoes.map((opcao) => (
              <RadioButton
                key={opcao.id}
                label={opcao.texto_opcao}
                selected={respostas[pergunta.id] === opcao.id}
                onSelect={() => handleSelectOption(pergunta.id, opcao.id)}
              />
            ))}
          </View>
        ))}

        <View className="mt-6">
          {isSubmitting ? (
            <ActivityIndicator size="large" color="#A6C98C" />
          ) : (
            <Button
              title={isLastQuestionnaire ? (isReTeste ? 'Atualizar Respostas' : 'Finalizar Cadastro') : 'Próximo Questionário'}
              type="success"
              onPress={handleNext}
              disabled={isLoading}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default QuestionnaireScreen;