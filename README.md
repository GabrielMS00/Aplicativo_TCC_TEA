# GitHub para App de Apoio à Seletividade Alimentar no TEA

Este repositório contém o código-fonte e o ambiente de desenvolvimento completo do aplicativo mobile desenvolvido como Trabalho de Conclusão de Curso (TCC) no curso de Engenharia de Software da Universidade de Brasília (UnB). O aplicativo tem como objetivo auxiliar cuidadores e profissionais no manejo da seletividade alimentar de pessoas com Transtorno do Espectro Autista (TEA), oferecendo sugestões de alimentos semelhantes com base em preferências sensoriais. Este trabalho foi desenvolvido por Gabriel Marques de Souza e Caio Mesquita Vieira, possui como orientador o professor da Universidade de Brasília Ricardo Ajax Dias Kosloski e como coorientadora a professora Dra. Marília Miranda Forte Gomes.

## 📱 Tecnologias Utilizadas

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [Expo Router](https://expo.github.io/router/docs/)
- [TypeScript](https://www.typescriptlang.org/)
- [NativeWind](https://www.nativewind.dev/)
- [Context API](https://reactjs.org/docs/context.html)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- **Node.js, Express, PostgreSQL & Docker** para o backend e ambiente.

## 🧱 Arquitetura

O projeto utiliza uma arquitetura **monolítica com front-end desacoplado**. O ambiente de backend é totalmente containerizado com Docker para garantir consistência.

```
.
├── app-tea/              # Contém todo o código do frontend (React Native/Expo)
├── backend/              # Contém todo o código do backend (Node.js/Express)
│   └── migrations/       # Contém o histórico de alterações do banco de dados
├── .env                  # Arquivo local para variáveis de ambiente (NÃO VERSIONADO)
├── .env.example          # Arquivo de exemplo para as variáveis de ambiente
├── .gitignore            # Regras para ignorar arquivos no versionamento do Git
└── docker-compose.yml    # Arquivo de orquestração dos contêineres Docker
```

## ✅ Requisitos para Rodar o Projeto

Antes de executar, certifique-se de ter os seguintes itens instalados:

- [Node.js (versão LTS)](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/go) (no seu celular)
- **Docker Desktop**: [Link para Download](https://www.docker.com/products/docker-desktop/)

---

## 🚀 Como Executar o Ambiente Completo

### 1. Clonar o Repositório

```bash
git clone [https://github.com/GabrielMS00/Aplicativo_TCC_TEA.git](https://github.com/GabrielMS00/Aplicativo_TCC_TEA.git)
cd Aplicativo_TCC_TEA
```


### 2. Configurar Variáveis de Ambiente

As credenciais do banco de dados são gerenciadas localmente para segurança.

1.  Copie o arquivo de exemplo `.env.example` (na raiz) para um novo arquivo chamado `.env`.
2.  Faça o mesmo para a configuração da ferramenta de migração: copie `backend/.npmrc.example` para `backend/.npmrc`.
3.  Abra ambos os arquivos (`.env` e `backend/.npmrc`) e defina a **mesma** senha segura para o banco de dados.

### 3. Iniciar o Backend e o Banco de Dados (Docker)

**Importante:** Garanta que o seu Docker Desktop esteja aberto e em execução.

No terminal, a partir da **pasta raiz** do projeto, execute:

```bash
docker-compose up --build
```
* Este terminal exibirá os logs do servidor. **Mantenha-o aberto.**

### 4. Construir a Estrutura do Banco de Dados (Migrations)

Com o Docker rodando, o banco foi criado, mas ainda está vazio. Vamos criar as tabelas.

**Abra um novo terminal.**

Navegue até a pasta `backend` e execute o comando para aplicar as "migrations":

```bash
# Estando na pasta /backend
npm run migrate up
```
* **Nota:** Você só precisa executar este comando na primeira vez que configura o projeto ou quando baixar novas atualizações que alterem a estrutura do banco.

### 5. Iniciar o Frontend

No mesmo segundo terminal, navegue para a pasta do frontend e inicie o servidor do Expo:

```bash
# Estando na pasta /backend, volte para a raiz e entre em app-tea
cd ../app-tea

# Instale as dependências (só na primeira vez ou quando houver pacotes novos)
npm install

# Inicie o servidor
npm start
```


### 6. Rodar o App no Celular

1.  **Encontre o seu IP local:** Em um outro terminal, use `ipconfig` (Windows) ou `ifconfig` / `ip a` (macOS/Linux).
2.  **Conecte o app à API:** Use este IP ao fazer chamadas `fetch` no seu código (ex: `fetch('http://SEU_IP_AQUI:3001/rota')`).
3.  **Execute no Dispositivo:** Use o app Expo Go para escanear o QR code que apareceu no terminal.

---

## 📦 Gerenciamento de Dependências e Banco de Dados

### Adicionando Novos Pacotes (npm)

O projeto é dividido em duas partes, cada uma com suas próprias dependências.

- **Para adicionar um pacote ao Frontend:**
  ```bash
  # Estando na pasta /app-tea
  npm install nome-do-pacote
  ```

- **Para adicionar um pacote ao Backend:**
  ```bash
  # Estando na pasta /backend
  npm install nome-do-pacote
  ```
**Importante:** Após um `git pull`, sempre execute `npm install` em ambas as pastas (`/app-tea` e `/backend`) para garantir que você tenha todos os pacotes que seus colegas adicionaram.

### Alterando o Banco de Dados (Migrations)

A estrutura do banco de dados (tabelas, colunas, etc.) é gerenciada por scripts de migração na pasta `/backend/migrations`. **Nunca altere o banco de dados diretamente.**

- **Para criar uma nova alteração (migration):**
  ```bash
  # Estando na pasta /backend
  npm run migrate:create nome_descritivo_da_alteracao
  ```
  Isso criará um novo arquivo na pasta `/backend/migrations`. Edite este arquivo para descrever sua alteração.

- **Para aplicar novas migrations (suas ou de colegas):**
  ```bash
  # Estando na pasta /backend e com o Docker rodando
  npm run migrate up
  ```

---

## ⏹️ Parando o Ambiente e Limpando o Docker

### Parada Simples

1.  Pressione `Ctrl + C` no terminal do frontend (`npm start`).
2.  Pressione `Ctrl + C` no terminal do backend (`docker-compose up`).

### Parada e Limpeza Completa

Para parar os contêineres e remover redes (útil para resolver problemas de cache):

```bash
# Execute na pasta raiz do projeto
docker-compose down
```
**Cuidado:** Para apagar **todos os dados do banco de dados** e recomeçar do zero, use a flag `-v`. **Isto é irreversível.**
```bash
docker-compose down -v
```

---

## 🧪 Testes

Execute os testes do frontend com o comando:

```bash
# Dentro da pasta /app-tea
npm run test
```


---

## 🔗 Links Importantes

- **Trello:** https://trello.com/invite/b/67e5d7403e5d2690b94a5875/ATTI4e42dc80fcf83add015a08a60cfffab02988E22F/gestao-do-projeto-tcc-tea
- **Parsifal:** https://parsif.al/CaioMesVie/seletividade-alimentar-no-contexto-de-pacientes-com-tea/
- **Drive:** https://drive.google.com/drive/folders/1DiFjCPV2-e9z48qcQ2-ZeCcL2AafNs_9?usp=sharing_eip&ts=6764b679