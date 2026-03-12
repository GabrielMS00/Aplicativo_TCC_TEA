import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HelpScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-12 pb-8">
      {/* Cabeçalho */}
      <View className="flex-row items-center mb-8">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 bg-gray-100 rounded-full">
          <Ionicons name="arrow-back" size={24} color="#4B5563" />
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-gray-800">Como Funciona?</Text>
      </View>

      {/* Seção 1 */}
      <View className="mb-8 bg-blue-50 p-5 rounded-2xl">
        <View className="flex-row items-center mb-3">
          <Ionicons name="heart" size={24} color="#3B82F6" className="mr-2" />
          <Text className="text-xl font-bold text-blue-600 ml-2">O Nosso Objetivo</Text>
        </View>
        <Text className="text-gray-700 text-base leading-relaxed text-justify">
          O App TEA foi criado para ser o seu maior aliado na seletividade alimentar. O nosso papel não é forçar a criança a comer, mas sim ajudar a expandir o cardápio dela de forma gentil, respeitosa e no tempo dela.
        </Text>
      </View>

      {/* Seção 2 */}
      <View className="mb-8 bg-green-50 p-5 rounded-2xl">
        <View className="flex-row items-center mb-3">
          <Ionicons name="document-text" size={24} color="#10B981" className="mr-2" />
          <Text className="text-xl font-bold text-green-600 ml-2">Por que os Questionários?</Text>
        </View>
        <Text className="text-gray-700 text-base leading-relaxed text-justify">
          Crianças no espectro costumam ter um processamento sensorial único. Algumas podem ter aversão a texturas cremosas, enquanto outras evitam alimentos vermelhos.
          {'\n\n'}
          Os questionários mapeiam exatamente o perfil da criança: as cores, texturas, temperaturas e sabores que ela tolera ou rejeita. Sem isso, o aplicativo seria "cego" e poderia sugerir um alimento que causaria uma crise (meltdown).
        </Text>
      </View>

      {/* Seção 3 */}
      <View className="mb-8 bg-purple-50 p-5 rounded-2xl">
        <View className="flex-row items-center mb-3">
          <Ionicons name="color-wand" size={24} color="#8B5CF6" className="mr-2" />
          <Text className="text-xl font-bold text-purple-600 ml-2">A "Mágica" das Sugestões</Text>
        </View>
        <Text className="text-gray-700 text-base leading-relaxed text-justify">
          Quando pede uma sugestão de refeição, o nosso algoritmo não escolhe um alimento ao acaso! Ele usa a técnica de <Text className="font-bold">Encadeamento Alimentar</Text>.
          {'\n\n'}
          Ele analisa a lista de "Alimentos Seguros" que a criança já come e procura pontes. Se a criança ama Maçã (crocante e doce), o sistema procura alimentos com alta pontuação de similaridade (como a Pera) para sugerir, indo um pequeno passo de cada vez.
        </Text>
      </View>

      {/* Seção 4 */}
      <View className="mb-12 bg-orange-50 p-5 rounded-2xl">
        <View className="flex-row items-center mb-3">
          <Ionicons name="sync" size={24} color="#F97316" className="mr-2" />
          <Text className="text-xl font-bold text-orange-600 ml-2">O Seu Feedback Ensina</Text>
        </View>
        <Text className="text-gray-700 text-base leading-relaxed text-justify">
          Sempre que regista que a criança "Aceitou" ou "Recusou" uma sugestão, o aplicativo fica mais inteligente. Alimentos recusados vão para uma "geladeira" virtual temporária para não incomodar a criança nos próximos dias, enquanto os aceitos viram novas pontes para futuras descobertas!
        </Text>
      </View>
    </ScrollView>
  );
}