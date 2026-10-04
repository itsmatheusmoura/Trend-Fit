---
trigger: always_on
---

# Segurança, Privacidade e Sanitização de Dados
1. **Proteção de Segredos**: Se houver necessidade futura de chaves de API, elas DEVEM ficar em um arquivo `.env`. O agente deve verificar ativamente se o `.env` está configurado corretamente no `.gitignore` antes de qualquer manipulação de arquivos.
2. **Validação Rigorosa**: O input do usuário (data e peso) deve ser tipado e sanitizado antes da inserção no IndexedDB para impedir a gravação de dados corrompidos ou maliciosos que quebrem os gráficos.
3. **Privacidade Garantida**: Como o repo no GitHub é anônimo, os dados reais não podem ser mesclados no código-fonte padrão. Evite hardcodar estados de testes (mock data) com informações identificáveis.