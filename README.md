# App de Apoio à Seletividade Alimentar no TEA (TCC)

Este repositório contém o código-fonte e o ambiente de desenvolvimento completo do aplicativo mobile desenvolvido como Trabalho de Conclusão de Curso (TCC) no curso de Engenharia de Software da Universidade de Brasília (UnB). O aplicativo tem como objetivo auxiliar cuidadores e profissionais no manejo da seletividade alimentar de pessoas com Transtorno do Espectro Autista (TEA), oferecendo sugestões de alimentos semelhantes com base em preferências sensoriais. Este trabalho foi desenvolvido por Gabriel Marques de Souza e Caio Mesquita Vieira, possui como orientador o professor da Universidade de Brasília Ricardo Ajax Dias Kosloski e como coorientadora a professora Dra. Marília Miranda Forte Gomes.

## 🧱 Arquitetura e Estrutura do Projeto

O projeto utiliza uma arquitetura full-stack com um ambiente de desenvolvimento containerizado para garantir consistência e facilidade de configuração.

```
.
├── app-tea/              # Contém todo o código do frontend (React Native/Expo)
├── backend/              # Contém todo o código do backend (Node.js/Express)
├── .env                  # Arquivo local para variáveis de ambiente (NÃO VERSIONADO)
├── .env.example          # Arquivo de exemplo para as variáveis de ambiente
├── .gitignore            # Regras para ignorar arquivos no versionamento do Git
└── docker-compose.yml    # Arquivo de orquestração dos contêineres Docker
```

## 📱 Tecnologias, Frameworks e Bibliotecas

Aqui está um detalhamento das principais ferramentas utilizadas no projeto:

### **Frontend (`app-tea`)**
* **React Native**: Framework principal que nos permite construir o aplicativo para Android e iOS usando JavaScript e React.
* **Expo**: Plataforma e conjunto de ferramentas construído sobre o React Native para simplificar o desenvolvimento, build e deploy do aplicativo.
* **Expo Router**: Biblioteca para criar a navegação entre as telas do aplicativo baseada em arquivos.
* **TypeScript**: Superset do JavaScript que adiciona tipagem estática, ajudando a prevenir bugs e a melhorar a organização do código.
* **NativeWind**: Permite usar as classes de utilitário do Tailwind CSS diretamente nos componentes React Native para uma estilização rápida e consistente.
* **AsyncStorage**: Solução de armazenamento local (no dispositivo do usuário) para guardar dados de forma persistente.

### **Backend (`backend`)**
* **Node.js**: Ambiente de execução que permite rodar JavaScript no servidor.
* **Express.js**: Framework minimalista para Node.js, usado para construir nossa API, definir rotas e gerenciar requisições HTTP.
* **PostgreSQL (Postgres)**: Sistema de banco de dados relacional de código aberto para armazenar todos os dados da nossa aplicação.

### **Ambiente & DevOps**
* **Docker & Docker Compose**: Ferramentas para criar e gerenciar os contêineres do backend e do banco de dados, garantindo um ambiente de desenvolvimento consistente.

## ✅ Pré-requisitos

Antes de executar, certifique-se de ter os seguintes itens instalados:

1.  **Node.js (versão LTS):** [Link para Download](https://nodejs.org/)
2.  **Docker Desktop:** [Link para Download](https://www.docker.com/products/docker-desktop/)
3.  **Git:** [Link para Download](https://git-scm.com/)

---

## 🚀 Como Executar o Ambiente Completo

### 1. Clonar o Repositório

```bash
git clone [https://github.com/GabrielMS00/Aplicativo_TCC_TEA.git](https://github.com/GabrielMS00/Aplicativo_TCC_TEA.git)
cd Aplicativo_TCC_TEA
```


### 2. Configurar Variáveis de Ambiente (Autenticação do Banco)

As credenciais do banco de dados são gerenciadas localmente para segurança.

1.  Copie o arquivo de exemplo `.env.example` para um novo arquivo chamado `.env`.
    ```bash
    # No Windows (PowerShell)
    copy .env.example .env

    # No macOS/Linux
    cp .env.example .env
    ```
2.  Abra o arquivo `.env` que você acabou de criar e defina uma senha segura para a variável `POSTGRES_PASSWORD`.

### 3. Iniciar o Backend e o Banco de Dados

Esta etapa utiliza o Docker para construir e iniciar os contêineres da API e do banco de dados.

**Importante:** Garanta que o seu Docker Desktop esteja aberto e em execução.

No terminal, a partir da **pasta raiz** do projeto, execute:

```bash
docker-compose up --build
```
* O comando `--build` é necessário na primeira vez para construir a imagem do backend.
* Este terminal exibirá os logs do servidor. **Mantenha-o aberto.**

### 4. Iniciar o Frontend

**Abra um novo terminal.**

Navegue até a pasta `app-tea` e execute os seguintes comandos:

```bash
# Entra na pasta do frontend
cd app-tea

# Instala todas as dependências do app (só precisa na primeira vez)
npm install

# Inicia o servidor de desenvolvimento do Expo
npx expo start
```


### 5. Rodar o App no Celular

1.  **Encontre o seu IP local:** Em um outro terminal, use `ipconfig` (Windows) ou `ifconfig` / `ip a` (macOS/Linux).
2.  **Conecte o app à API:** Use este IP ao fazer chamadas `fetch` no seu código (ex: `fetch('http://SEU_IP_AQUI:3001/rota')`).
3.  **Execute no Dispositivo:** Baixe o app **Expo Go** no seu celular, conecte-o na mesma rede Wi-Fi e escaneie o QR Code que apareceu no terminal.

---

## ⏹️ Parando o Ambiente e Limpando o Docker

É importante desligar os contêineres quando você terminar de trabalhar para liberar recursos do seu computador.

### Parada Simples

1.  No terminal onde o frontend (`npx expo start`) está rodando, pressione `Ctrl + C`.
2.  No terminal onde o backend (`docker-compose up`) está rodando, pressione `Ctrl + C`. Os contêineres serão parados.

### Parada e Limpeza Completa

Se você quiser parar os contêineres e remover as redes e volumes anônimos criados pelo Docker Compose (útil para resolver problemas de cache ou para uma reinicialização limpa), use o comando:

```bash
# Execute na pasta raiz do projeto
docker-compose down
```
**Importante:** O comando `docker-compose down` **não apaga** os dados do seu banco de dados, pois usamos um volume nomeado (`pgdata`) para isso. Para apagar também os dados do banco (CUIDADO: ISSO É IRREVERSÍVEL), use:
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


## 🔗 Links Importantes

* **Trello:** https://trello.com/invite/b/67e5d7403e5d2690b94a5875/ATTI4e42dc80fcf83add015a08a60cfffab02988E22F/gestao-do-projeto-tcc-tea
* **Parsifal:** https://parsif.al/CaioMesVie/seletividade-alimentar-no-contexto-de-pacientes-com-tea/
* **Drive:** https://drive.google.com/drive/folders/1DiFjCPV2-e9z48qcQ2-ZeCcL2AafNs_9?usp=sharing_eip&ts=6764b679