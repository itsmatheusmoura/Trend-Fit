---
trigger: always_on
---

# Boas Práticas de Componentização (React + TypeScript)
1. **Single Responsibility (Responsabilidade Única)**: Cada componente da interface deve fazer apenas uma coisa. Mantenha os arquivos enxutos (preferencialmente abaixo de 150 linhas).
2. **Tipagem Estrita com TypeScript**: Todos os componentes, propriedades (`Props`) e modelos de dados DEVEM ter interfaces/tipos bem definidos em `src/types/index.ts`. Evite o uso de `any`.
3. **Separação de Lógica**: A lógica matemática (como o cálculo da Média Móvel) e a comunicação com o IndexedDB DEVEM ser extraídas da UI para Custom Hooks (ex: `useMovingAverage`, `useDatabase`).
4. **Design Limpo e Moderno**: Utilize classes semânticas do Tailwind CSS. A paleta deve ser majoritariamente clara, usando cores vibrantes apenas em botões de ação (CTAs) e dados de progresso para motivação.
5. **Sem Prop Drilling**: Se um dado for global no PWA (ex: configurações do usuário, estado do cache offline), prefira o uso de Hooks/Context API.