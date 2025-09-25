import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';

const LoginScreen = () => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Login</Text>

        {/* Usuario Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Usuário</Text>
          <TextInput
            style={styles.input}
            value={usuario}
            onChangeText={setUsuario}
            placeholder=""
          />
        </View>

        {/* Senha Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            placeholder=""
          />
        </View>

        {/* Links */}
        <View style={styles.linksContainer}>
          <TouchableOpacity>
            <Text style={styles.link}>Esqueci minha senha</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.link}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Login Button */}
      <TouchableOpacity style={styles.loginButton}>
        <Text style={styles.loginButtonText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#5DADE2',
    textAlign: 'center',
    marginBottom: 60,
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#BDC3C7',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
  },
  linksContainer: {
    marginTop: 20,
  },
  link: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 8,
  },
  loginButton: {
    backgroundColor: '#A8E6CF',
    borderRadius: 12,
    paddingVertical: 18,
    marginBottom: 40,
  },
  loginButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27AE60',
    textAlign: 'center',
  },
});

export default LoginScreen;
