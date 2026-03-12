import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Pressable
} from 'react-native';

type Option = {
  label: string;
  value: string;
};

type Props = {
  options: Option[];
  selectedValue?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
};

export const SelectInput = ({ options, selectedValue, onValueChange, placeholder = "Selecione uma opção..." }: Props) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedLabel = options.find(option => option.value === selectedValue)?.label || placeholder;

  const handleSelect = (option: Option) => {
    onValueChange(option.value);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        className='bg-white rounded-lg px-4 py-4 flex-row justify-between items-center'
        onPress={() => setModalVisible(true)}
      >
        <Text style={selectedValue ? styles.selectedText : styles.placeholderText}>
          {selectedLabel}
        </Text>
        <Text>▼</Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.optionsContainer}>
              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={styles.optionText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  selectedText: {
    color: '#000',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    maxHeight: '50%',
  },
  optionsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
  },
  optionItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
});