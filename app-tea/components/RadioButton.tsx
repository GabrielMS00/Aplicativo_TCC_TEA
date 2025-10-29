
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

interface RadioButtonProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export const RadioButton: React.FC<RadioButtonProps> = ({ label, selected, onSelect }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onSelect}>
      <View style={[styles.radioCircle, selected && styles.selectedRb]}>
        {selected && <View style={styles.selectedInnerCircle} />}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15, // Espaçamento entre opções
    paddingVertical: 8,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#87CFCF', // Cor primária
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedRb: {
    borderColor: '#87CFCF', // Cor primária
  },
  selectedInnerCircle: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#87CFCF', // Cor primária
  },
  label: {
    fontSize: 16,
    color: '#2C3E50', // Cor do texto
  },
});