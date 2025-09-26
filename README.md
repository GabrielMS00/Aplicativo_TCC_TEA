# GitHub para App de Apoio à Seletividade Alimentar no TEA

Este repositório contém o código-fonte do aplicativo mobile desenvolvido como Trabalho de Conclusão de Curso (TCC) no curso de Engenharia de Software da Universidade de Brasília (UnB). O aplicativo tem como objetivo auxiliar cuidadores e profissionais no manejo da seletividade alimentar de pessoas com Transtorno do Espectro Autista (TEA), oferecendo sugestões de alimentos semelhantes com base em preferências sensoriais. Este trabalho foi desenvolvido por Gabriel Marques de Souza e Caio Mesquita Vieira, possui como orientador o professor da Universidade de Brasília Ricardo Ajax Dias Kosloski e como coorientadora a professora Dra. Marília Miranda Forte Gomes.

## 📱 Tecnologias Utilizadas

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [Expo Router](https://expo.github.io/router/docs/)
- [TypeScript](https://www.typescriptlang.org/)
- [NativeWind](https://www.nativewind.dev/)
- [Context API](https://reactjs.org/docs/context.html)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [Jest](https://jestjs.io/) + [React Native Testing Library](https://testing-library.com/docs/react-native-testing-library/intro)

## 🧱 Arquitetura

O projeto utiliza uma **arquitetura componentizada**, com separação clara entre os componentes visuais, lógica de negócio e acesso a dados. Essa abordagem facilita a escalabilidade, testabilidade e manutenção da aplicação.

## ✅ Requisitos para rodar o projeto

Antes de executar este projeto, certifique-se de ter os seguintes itens instalados:

- [Node.js (versão LTS)](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/go) - Este aplicativo deve ser baixado no seu celular, ele será responsável por ser o cliente da aplicação e, consequentemente, executará a aplicação diretamente no seu dispositivo móvel.

## 🚀 Como Executar

- Faça a clonagem deste repositório na sua máquina utilizando o sequinte comando dentro de uma pasta criada e dedicada ao projeto:
  
  ```
  git clone https://github.com/GabrielMS00/Aplicativo_TCC_TEA.git
  ```
  
- entre na pasta do repositório que foi clonado:

  ```
  cd app-tea
  ```
- Instale as dependências necessárias:

  ```
  npm install
  ```
  
- Inicie o servidor de desenvolvimento, utilize o modo Tunnel caso seu celular não esteja na mesma rede que o seu computador:

  ```
  npm start
  # Ou
  npx expo start --tunnel
  ```
  
- Use o app Expo Go no celular para escanear o QR code e testar o aplicativo.

## 🧪 Testes

Execute os testes unitários e de interface com o comando:

```
npm run test
```

---

## 🔗 Links importantes: 

### Trello
* https://trello.com/invite/b/67e5d7403e5d2690b94a5875/ATTI4e42dc80fcf83add015a08a60cfffab02988E22F/gestao-do-projeto-tcc-tea

### Parsifal
* https://parsif.al/CaioMesVie/seletividade-alimentar-no-contexto-de-pacientes-com-tea/

### Drive
* https://drive.google.com/drive/folders/1DiFjCPV2-e9z48qcQ2-ZeCcL2AafNs_9?usp=sharing_eip&ts=6764b679
