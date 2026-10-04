# Projeto TrendFit - Contexto PWA
- **Stack Tecnológico**: React + Vite + TailwindCSS + IndexedDB.
- **Objetivo**: Criar um PWA de condicionamento físico com acompanhamento de peso via média móvel.
- **Ambiente-Alvo**: O app rodará primariamente em um Tablet Android (layout horizontal) e em um iPhone (layout vertical) via web browser (PWA).
- **Banco de Dados**: 100% Client-side (IndexedDB), focado em performance offline e com suporte à exportação JSON.

# TrendFit — Especificações Funcionais e Técnicas

Aplicação Web Progressiva (PWA) de baixo atrito focada em condicionamento físico na academia e monitoramento inteligente de peso corporal por média móvel, com arquitetura local-first e persistência exportável em JSON.

---

## 1. Visão Geral do Produto

* **Público-alvo:** Usuário individual buscando ganho de condicionamento e controle de peso corporal com baixo atrito de digitação durante o treino.
* **Plataformas de destino:** 
  * Mobile (iPhone via Safari > "Adicionar à Tela de Início").
  * Tablet (Samsung Galaxy Tab via Chrome > "Instalar aplicativo").
* **Arquitetura de dados:** **Local-First**. Todo o estado vive primariamente no dispositivo (`localStorage`/`IndexedDB`). A sincronização externa ocorre via exportação/importação de snapshots JSON versionáveis (podendo integrar via GitHub REST API ou download manual de arquivo).

---

## 2. Paleta de Cores e Identidade Visual (Clean & Bright)

Ambiente claro (*light mode* moderno), visual energizante e limpo, evitando fundos escuros pesados:

| Elemento | Token / Hex | Propósito |
| :--- | :--- | :--- |
| **Background Principal** | `#F8FAFC` (Slate 50) | Fundo leve, suave para leitura. |
| **Superfícies / Cards** | `#FFFFFF` (White) | Contraste limpo com bordas sutis (`#E2E8F0`). |
| **Cor Primária (Ação)** | `#0D9488` (Teal 600) | Clareza mental, foco, progresso ativo. |
| **Cor Secundária (Energia)** | `#F97316` (Orange 500) | Acentos de alta intensidade, timers e call-to-actions. |
| **Sucesso / Tendência Positiva** | `#10B981` (Emerald 500) | Indicadores de consistência e metas cumpridas. |
| **Linha do Peso Diário** | `#94A3B8` (Slate 400, pontilhada) | Mostra a volatilidade do dia sem alarme. |
| **Linha da Tendência (EMA)** | `#0D9488` (Teal 600, contínua 3px) | Foco visual principal do progresso real. |

---

## 3. Módulos Funcionais

### 3.1. Módulo de Peso Corporal & Gráficos

* **Entrada Rápida:**
  * Teclado numérico direto com valor pré-preenchido do último peso registrado (ajuste rápido por botões `+0.1kg`, `-0.1kg` ou digitação direta).
  * Data e hora automáticas (com opção de retroagir se esqueceu de registrar).
  * Campo opcional de tag/contexto: `Jejum`, `Pós-treino`, `Normal`.
* **Cálculo da Média Móvel:**
  * Uso de **Média Móvel Exponencial (EMA de 7 dias)** ou **Média Móvel Simples (SMA-7)** para amortecer oscilações de retenção de líquido e inflamação muscular:
    $$\text{EMA}_{\text{hoje}} = \left(\text{Peso}_{\text{hoje}} \times \left(\frac{2}{N + 1}\right)\right) + \left(\text{EMA}_{\text{ontem}} \times \left(1 - \frac{2}{N + 1}\right)\right)$$
    *(com $N = 7$ dias).*
* **Gráfico Interativo:**
  * Exibe duas curvas sobrepostas:
    1. Pontos discretos/linha pontilhada cinza: medições diárias brutas.
    2. Curva suavizada colorida: tendência real (EMA-7).
  * Marcadores verticais no rodapé do gráfico nos dias em que houve treino concluído, facilitando correlação visual.
  * Seletor de período: 14 dias, 30 dias, 90 dias e Geral.

### 3.2. Módulo de Condicionamento & Treino

* **Modo Execução (Baixo Atrito):**
  * Cronômetro de descanso em tela cheia com alta legibilidade (visível a 2 metros de distância com o celular ou tablet apoiado).
  * Presets rápidos de intervalo: 30s, 45s, 60s, 90s, 120s.
  * Registro de séries por toque único de RPE (Percepção Subjetiva de Esforço):
    * `Leve` (Verde)
    * `Ideal / Moderado` (Azul/Teal)
    * `Limite / Falha` (Laranja)
* **Blocos de Treino Flexíveis:**
  * Suporte a treinos intervalados (HIIT), circuito de máquinas/halteres ou cardio contínuo (esteira, bike, remo).

### 3.3. Exportação, Importação e Integração GitHub (JSON Sync)

* **Export Manual:** Botão "Baixar Backup (.json)" com timestamp `trendfit-backup-YYYY-MM-DD.json`.
* **Import Manual:** Botão "Restaurar Backup" com substituição ou mesclagem inteligente por chave única (`id` baseado em UUID ou timestamp ISO).
* **Sync Anônimo GitHub (Opcional nativo via Token):**
  * O app pode armazenar no `localStorage` um **GitHub Personal Access Token (fine-grained)** com permissão apenas de leitura/escrita em um único repositório privado ou Gist.
  * **Fluxo:** 
    1. `GET /repos/{owner}/{repo}/contents/data.json` para carregar estado mais recente.
    2. `PUT /repos/{owner}/{repo}/contents/data.json` ao finalizar o treino ou registrar o peso diário, criando um commit automático.

---

## 4. Schema de Dados (JSON de Exportação)

Estrutura formal do arquivo versionável:

```json
{
  "$schema": "https://trendfit.app/schema/v1.json",
  "version": 1,
  "lastUpdated": "2026-10-04T12:00:00Z",
  "profile": {
    "targetWeightKg": 75.0,
    "unit": "kg"
  },
  "weightLogs": [
    {
      "id": "w_1728043200",
      "timestamp": "2026-10-04T07:15:00Z",
      "weightKg": 82.4,
      "tag": "fasted",
      "ema7": 82.85,
      "notes": "Pesagem matinal pós-sono regular"
    }
  ],
  "workouts": [
    {
      "id": "wk_1728046800",
      "date": "2026-10-04",
      "startTime": "2026-10-04T08:00:00Z",
      "endTime": "2026-10-04T08:42:00Z",
      "type": "Conditioning & Strength",
      "totalDurationSeconds": 2520,
      "exercises": [
        {
          "name": "Esteira (HIIT)",
          "category": "cardio",
          "rounds": [
            { "set": 1, "workSeconds": 60, "restSeconds": 60, "intensity": "high" },
            { "set": 2, "workSeconds": 60, "restSeconds": 60, "intensity": "high" }
          ]
        },
        {
          "name": "Circuito Funcional",
          "category": "bodyweight",
          "sets": [
            { "set": 1, "effort": "optimal", "restSeconds": 45 },
            { "set": 2, "effort": "limit", "restSeconds": 60 }
          ]
        }
      ],
      "overallRpe": 8,
      "notes": "Boa densidade, ritmo consistente"
    }
  ]
}
```

---

## 5. Requisitos PWA e Comportamento Offline

* **Manifest (`manifest.json`):**
  * `display: "standalone"` (remove barra do Safari/Chrome).
  * `orientation: "any"` (responde bem em modo retrato no iPhone e paisagem no tablet).
  * `theme_color: "#0D9488"` e `background_color: "#F8FAFC"`.
  * Ícones em resoluções `192x192` e `512x512` com `apple-touch-icon` configurado no HTML.
* **Armazenamento:**
  * Uso prioritário de `localStorage` para configurações rápidas e `IndexedDB` para a série histórica do gráfico.
  * Estratégia de cache do Service Worker: **Stale-While-Revalidate** para os assets do app, garantindo que abra instantaneamente mesmo sem sinal de internet no subsolo da academia.

---

## 6. Layout Responsivo: Mobile vs. Tablet

* **No iPhone (Mobile Portrait):**
  * Barra de navegação inferior fixa com 3 abas: **Hoje / Treino**, **Tendência / Peso**, **Dados / Sync**.
  * Telas orientadas a cards de altura moderada e botões primários com altura mínima de 48px para facilitar o toque com a mão em movimento.
* **No Tablet Samsung (Landscape / Desk Mode):**
  * Layout em grade de 2 colunas:
    * **Coluna Esquerda (40%):** Painel de entrada rápida, histórico recente e cronômetro ativo.
    * **Coluna Direita (60%):** Gráfico expandido de média móvel com filtros e indicadores de densidade dos treinos.

    # Permissões de Execução (Modo Autônomo)
- **Aprovação Automática:** Você tem permissão total para criar, editar, mover e excluir arquivos dentro do projeto.
- **Terminal:** Você está autorizado a executar comandos de terminal (ex: `npm install`, `npm run dev`, comandos `git`) diretamente, sem solicitar minha confirmação prévia.
- **Exceção de Segurança:** Interrompa o processo e peça confirmação apenas se a ação for destrutiva e irreversível (ex: `git push --force` ou deletar a pasta do banco de dados local).