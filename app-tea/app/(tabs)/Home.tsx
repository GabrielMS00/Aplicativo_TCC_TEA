import { View, Text, Modal, Alert, TouchableOpacity, } from 'react-native';
import { WatchedCard } from '../../components/WatchedCard';
import { useState } from 'react';
import { CardData } from '../../types/CardData';
import { router } from 'expo-router';

const Screen = () => {

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);

  const handleOpenModal = (cardData: CardData) => {
    setSelectedCard(cardData);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedCard(null);
  };

  return (
    <View className='flex-1 bg-background'>

      <View className="w-full bg-primary h-60 justify-center items-center flex-row">
        <View className="w-full px-6 flex-row justify-between items-center">
          <View className="flex-row items-center ">
            <View className="ml-4">
              <Text className="text-text text-2xl">Olá,</Text>
              <Text className="text-text text-4xl font-bold">Gabriel</Text>
              <TouchableOpacity onPress={() => router.replace('/')}>
                <Text className="text-attention text-2xl font-bold pt-5">SAIR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View className='flex-1 p-5 justify-center items-center'>
        {/* <Text className='text-text text-xl'>Ainda não há assitidos cadastrado!</Text> */}

        <WatchedCard idade='10' name='Caio Mesquita' suporte={2} onPressOptions={handleOpenModal} />
        <WatchedCard idade='12' name='Thiago Silva' suporte={1} onPressOptions={handleOpenModal} />
        <WatchedCard idade='8' name='Laís Souza' suporte={3} onPressOptions={handleOpenModal} />
      </View>

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="w-4/5 bg-modal rounded-xl p-5 items-center shadow-lg h-64">

            {selectedCard && (
              <>
                <TouchableOpacity>
                  <Text className="text-2xl color-secondary font-bold mb-4">Hitórico de trocas</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text className="text-2xl color-secondary font-bold mb-4">Atualizar dados</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text className="text-2xl color-attention font-bold mb-4">Apagar usuário</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              className="bg-blue-500 rounded-lg px-8 py-2 mt-8"
              onPress={handleCloseModal}
            >
              <Text className="text-white font-bold text-base">Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default Screen;
