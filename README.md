# ⚡ TrendFit — PWA de Monitoramento & Condicionamento Physical

> Aplicação Web Progressiva (**PWA**) de baixo atrito focada em acompanhamento de condicionamento físico na academia e monitoramento inteligente de peso corporal por **Média Móvel Exponencial (EMA-7)**.

![Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Vite-0D9488?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-Offline--First-F97316?style=for-the-badge)
![Storage](https://img.shields.io/badge/Storage-IndexedDB%20%2B%20JSON-10B981?style=for-the-badge)

---

## 🌟 Diferenciais do Produto

* **📉 Média Móvel Exponencial (EMA-7)**: Elimina o estresse e ruído de oscilações diárias de retenção hídrica e inflamação muscular, exibindo a **tendência real** da composição corporal.
* **🏋️ Modo Execução com Baixo Atrito**:
  * Cronômetro de descanso em tela cheia com alta visibilidade (leitura garantida a 2 metros de distância).
  * Alerta sonoro sintetizado (Web Audio API) ao término do tempo de descanso.
  * Registro de séries por toque único com régua de **RPE** (`Leve`, `Ideal / Moderado`, `Limite / Falha`).
* **📚 Biblioteca de Exercícios (CRUD)**: Gerencie e personalize seus exercícios com categorias (*Força*, *Cardio*, *Peso Corporal*), descansos padrão e notas de treino.
* **📱 Interface Adaptativa (Mobile & Tablet)**:
  * **iPhone (Portrait)**: Navegação fixa por 3 abas na parte inferior (`Hoje / Treino`, `Tendência / Peso`, `Dados / Sync`) com botões otimizados de 48px para o toque durante o exercício.
  * **Tablet (Landscape / Desk)**: Layout responsivo em 2 colunas (40% entrada rápida e cronômetro ativo / 60% gráfico de tendência expandido e estatísticas).
* **🔒 100% Local-First & Privacidade**:
  * Funciona completamente offline no subsolo da academia via Service Worker (*Stale-While-Revalidate*).
  * Sem necessidade de login ou cadastro em servidores de terceiros.
  * Sincronização via backup manual `.json` ou sincronização automática anônima via **GitHub REST API** com *Personal Access Token*.

---

## 🎨 Paleta de Cores & Identidade Visual

Ambiente moderno e limpo (*light mode*), priorizando alto contraste e clareza visual durante a execução de exercícios:

| Elemento | Token / Cor | Propósito |
| :--- | :--- | :--- |
| **Background Principal** | `#F8FAFC` (Slate 50) | Fundo leve, suave para leitura. |
| **Superfícies / Cards** | `#FFFFFF` (White) | Contraste limpo com bordas sutis (`#E2E8F0`). |
| **Cor Primária (Ação)** | `#0D9488` (Teal 600) | Clareza mental, foco e progresso ativo. |
| **Cor Secundária (Energia)** | `#F97316` (Orange 500) | Acentos de alta intensidade, timers e call-to-actions. |
| **Sucesso / Tendência Positiva** | `#10B981` (Emerald 500) | Indicadores de consistência e metas cumpridas. |
| **Linha do Peso Diário** | `#94A3B8` (Slate 400, pontilhada) | Mostra a volatilidade do dia sem alarme. |
| **Linha da Tendência (EMA-7)** | `#0D9488` (Teal 600, contínua 3px) | Foco visual principal do progresso real. |

---

## 🛠️ Tecnologias Utilizadas

- **Core**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Estilização**: Tailwind CSS v3 + CSS Variables
- **Visualização de Dados**: Recharts
- **Ícones**: Lucide React
- **Armazenamento**: IndexedDB (Native Web API Wrapper)
- **PWA & Cache**: Web App Manifest + Service Worker (Stale-While-Revalidate)
- **Sintetizador Sonoro**: Web Audio API

---

## 📊 Matemática da Média Móvel (EMA-7)

$$\text{EMA}_{\text{hoje}} = \left(\text{Peso}_{\text{hoje}} \times \left(\frac{2}{7 + 1}\right)\right) + \left(\text{EMA}_{\text{ontem}} \times \left(1 - \frac{2}{7 + 1}\right)\right)$$

Para a primeira medição registrada, $\text{EMA}_1 = \text{Peso}_1$.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- **npm** (versão 9 ou superior)

### 1. Clonar o repositório e instalar dependências
```bash
git clone https://github.com/seu-usuario/trendfit.git
cd trendfit
npm install
```

### 2. Iniciar servidor de desenvolvimento
```bash
npm run dev
```
Abra o navegador em `http://localhost:3000`.

### 3. Compilação e Verificação TypeScript para Produção
```bash
npm run build
```
O projeto passará pela verificação de tipos do compilador TypeScript (`tsc`) e gerará os arquivos minificados na pasta `dist/`.

---

## 📱 Instalação como PWA no Celular/Tablet

### No iPhone (Safari)
1. Acesse o aplicativo no Safari.
2. Toque no botão **Compartilhar** (ícone com quadrado e seta).
3. Selecione **"Adicionar à Tela de Início"**.

### No Tablet Samsung / Android (Chrome)
1. Acesse o aplicativo no Google Chrome.
2. Toque nos **três pontos** no canto superior direito.
3. Selecione **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.

---

## 📄 Licença

Este projeto é desenvolvido para uso pessoal sob a licença MIT. Sinta-se à vontade para contribuir ou adaptar para seu próprio uso!
