# Anime — Frontend Mobile (React Native + Expo)

Aplicativo mobile desenvolvido em **React Native** com **Expo** para catálogo de animes e arcos lendários com **CRUD completo**, consumindo a API RESTful do backend (`Node.js + Express + Mongoose`).

---

## ✨ Funcionalidades (CRUD Completo)

- **Cadastrar Anime (`POST /animes`):** Modal de cadastro com título, arco lendário, protagonista, antagonista, gênero, total de episódios, nota (0 a 10), status (`Assistindo`, `Concluído`, `Planejo Assistir`), sinopse e URL do pôster com pré-visualização ao vivo.
- **Listar & Exibir Obra (`GET /animes` e `GET /animes/:id`):**
  - Destaque principal com arte de fundo do arco de **Jujutsu Kaisen (Incidente de Shibuya)**.
  - Cards verticais com pôster, nota, status colorido, protagonista, arco e botão **Exibir** para abrir a ficha completa da obra.
  - Abas acessíveis a qualquer momento (**Todos**, **Assistindo**, **Concluídos**, **Na Fila** e **Favoritos**), mesmo quando alguma categoria estiver vazia.
  - Barra de busca por título, arco, protagonista ou vilão e pull-to-refresh.
- **Editar Anime (`PUT /animes/:id`) & Favoritar (`PATCH /animes/:id/favorito`):** Botão **Editar** em cada card ou dentro da ficha da obra, além de alternância rápida de favorito.
- **Excluir Anime (`DELETE /animes/:id`):** Botão de exclusão com modal de confirmação seguro.
- **Popular Catálogo (`POST /animes/seed`):** Carrega 18 animes clássicos com seus pôsteres e arcos em 1 toque.

---

## 🛠️ Pré-requisitos

1. **[Node.js](https://nodejs.org/)** (v18+)
2. **Expo Go** instalado no celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) | [iOS](https://apps.apple.com/app/expo-go/id982107779)) ou navegador web
3. **Backend rodando:** siga as instruções no [Repositório do Backend](https://github.com/Kauaax7/anime-backend)

---

## 🚀 Como Rodar o Projeto

### 1. Clonar o repositório
```bash
git clone https://github.com/Kauaax7/anime-frontend.git
cd anime-frontend
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar a URL da API (`src/config.js`)
Abra `src/config.js` e ajuste `API_URL`:

```javascript
export const API_URL = 'http://SEU_IP_AQUI:3000';
```

- **Celular físico (Expo Go):** use o IPv4 do computador na mesma rede Wi-Fi (ex: `http://192.168.1.15:3000`). No Windows, execute `ipconfig` para ver o IPv4.
- **Emulador Android:** use `http://10.0.2.2:3000`.
- **Navegador Web:** use `http://localhost:3000`.

### 4. Iniciar o aplicativo
Com o backend ativo em execução, rode:
```bash
npx expo start
```

Escaneie o QR Code com o app **Expo Go** ou pressione `w` no terminal para abrir no navegador web.

---

## 📁 Estrutura de Arquivos

```text
anime-frontend/
├── assets/                  # Ícones, splash e favicon do app
├── src/
│   └── config.js            # Endereço IP da API Backend
├── App.js                   # Interface principal (Vermelho & Preto), CRUD e Modais
├── app.json                 # Configurações Expo
├── index.js                 # Ponto de entrada do app
├── package.json             # Dependências e scripts
└── README.md                # Documentação do frontend
```

---

## 🌐 Repositório do Backend

A API Node.js + Express + Mongoose correspondente está em:  
👉 [Repositório Backend - Anime](https://github.com/Kauaax7/anime-backend)
