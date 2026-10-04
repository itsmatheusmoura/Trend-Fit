---
description: 
---

# Workflow: Salvar Progresso (GitHub Sync)
**Descrição**: Automatiza os commits atômicos do seu progresso.
**Instruções para o Agente ao chamar /git-checkpoint**:
1. Execute `git status` no terminal do IDE para verificar os arquivos modificados.
2. Analise as alterações e crie mensagens de commit utilizando o padrão "Conventional Commits" (ex: `feat: adiciona componente de grafico do peso`, `fix: responsividade no tablet`).
3. Adicione os arquivos corretos (`git add .`) e realize o commit (`git commit -m "..."`).
4. Execute o push seguro para a sua branch atual (`git push`).
5. Ao final, apresente um resumo executivo limpo no chat sobre o que foi versionado e o status do repositório.