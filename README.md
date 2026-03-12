# Aplicativo de Apoio à Seletividade Alimentar no TEA

Este repositório contém o código-fonte do aplicativo mobile desenvolvido como Trabalho de Conclusão de Curso (TCC) em Engenharia de Software na Universidade de Brasília (UnB).

O objetivo da solução é auxiliar cuidadores e profissionais no manejo da seletividade alimentar de pessoas com Transtorno do Espectro Autista (TEA), utilizando um algoritmo de similaridade sensorial para sugerir substituições alimentares graduais e assertivas.

**Autores:** Gabriel Marques de Souza e Caio Mesquita Vieira.

**Orientador:** Prof. Ricardo Ajax Dias Kosloski.

**Coorientadora:** Profa. Dra. Marília Miranda Forte Gomes.

---

## 📱 Funcionalidades Principais

* **Gestão de Perfis:** Cadastro de múltiplos assistidos (crianças/pacientes) por cuidador.
* **Anamnese Alimentar:** Questionários de frequência (QFA) para mapear o repertório alimentar inicial ("Alimentos Seguros").
* **Motor de Sugestões:** Algoritmo que analisa textura, sabor, cor e temperatura para sugerir novos alimentos similares aos que o assistido já aceita.
* **Feedback e Aprendizado:** O sistema aprende com as recusas e aceites, ajustando as próximas sugestões.
* **Relatórios:** Histórico de trocas e evolução alimentar.

---

## 🛠 Tecnologias Utilizadas

**Mobile (Frontend):**
* [React Native](https://reactnative.dev/) com [Expo](https://expo.dev/)
* [Expo Router](https://expo.github.io/router/docs/) (Navegação baseada em arquivos)
* [TypeScript](https://www.typescriptlang.org/)
* [NativeWind](https://www.nativewind.dev/) (Estilização via Tailwind CSS)
* Context API & AsyncStorage

**Servidor (Backend & Infra):**
* Node.js & Express
* PostgreSQL (Banco de Dados)
* Docker & Docker Compose
* `node-pg-migrate` (Gerenciamento de Migrations)

---

## ✅ Pré-requisitos

* [Node.js (LTS)](https://nodejs.org/)
* [Git](https://git-scm.com/)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Deve estar rodando)
* App **Expo Go** instalado no celular (Android/iOS)

---

## 🚀 Guia de Instalação e Execução

### 1. Clonar o Repositório
```bash
git clone [https://github.com/GabrielMS00/Aplicativo_TCC_TEA.git](https://github.com/GabrielMS00/Aplicativo_TCC_TEA.git)

cd Aplicativo_TCC_TEA
```

### 2. Configurar Variáveis de Ambiente
O projeto precisa de configurações sensíveis no Backend (banco de dados) e no Frontend (endereço da API).

```bash
No Backend:

Vá para a pasta backend/.

Copie .env.example para .env.

(Opcional) Copie .npmrc.example para .npmrc.

Defina a senha do banco em DB_PASSWORD

No Frontend:

Vá para a pasta app-tea/.

Crie um arquivo .env baseado no exemplo.

Defina o IP da sua máquina local:

Ini, TOML

EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3001/api
(Dica: No Windows use ipconfig, no Mac/Linux use ifconfig para achar seu IP de rede local, ex: 192.168.0.15)
```


### 3. Subir o Backend (Docker)
Na raiz do projeto, execute:

```Bash

docker-compose up --build
# Aguarde até ver a mensagem de que o banco de dados está pronto.
```

### 4. Configurar o Banco de Dados (Migrations & Seeds)
Com o Docker rodando, abra um novo terminal para criar as tabelas e popular os dados iniciais (alimentos, questionários, etc).

``` Bash

cd backend

# 1. Cria as tabelas no banco
npm run migrate

# 2. Popula o banco com os alimentos e questionários (Essencial para o app funcionar)
npm run db:seed:all
```

### 5. Executar o Aplicativo (Mobile)
Em outro terminal (ou após terminar o passo anterior):

```Bash

cd app-tea

# Instala dependências
npm install

# Inicia o Metro Bundler
npm start

# Limpa o cache do expo
npx expo start --clear

```

Use o Expo Go no seu celular para escanear o QR Code exibido no terminal. Certifique-se de que o celular e o computador estejam na mesma rede Wi-Fi.

```bash
📦 Estrutura do Projeto
.
├── app-tea/                # Frontend (React Native)
│   ├── app/                # Telas e Rotas (Expo Router)
│   ├── components/         # Componentes Reutilizáveis
│   ├── context/            # Estados Globais (Auth, etc)
│   └── api/                # Integração com Backend
├── backend/                # API e Banco de Dados
│   ├── src/
│   │   ├── api/            # Controllers, Models, Routes
│   │   ├── config/         # Configuração do DB
│   │   └── services/       # Regras de Negócio (Algoritmo de Sugestão)
│   ├── migrations/         # Scripts de versionamento do SQL
│   └── scripts/            # Seeds para popular o banco
└── docker-compose.yml      # Orquestração dos containers
```

### 🧪 Comandos Úteis

Rodar Testes:

``` Bash

cd app-tea || cd backend
npm run test

```

Limpar o Banco de Dados e Docker (Reset Total):

```Bash
docker-compose down -v
# Cuidado: Isso apaga todos os dados salvos!
```