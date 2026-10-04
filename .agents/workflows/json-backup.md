---
description: 
---

# Workflow: Exportar Banco de Dados para JSON
**Descrição**: Extrai os dados locais e prepara o backup para versionamento.
**Instruções para o Agente ao chamar /json-backup**:
1. Instrua a aplicação a ler todos os registros atuais contidos no IndexedDB.
2. Converta esses registros para o formato de esquema JSON especificado para o projeto (timestamp, weight, moving_average).
3. Salve o arquivo gerado como `trendfit-data.json` na pasta local estipulada para backups.
4. Após gerar, pergunte se o usuário deseja efetuar o push deste JSON isolado para o repositório anônimo como backup, preservando o histórico de pesagem no GitHub.