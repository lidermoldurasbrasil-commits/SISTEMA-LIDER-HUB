# 🏭 SISTEMA LIDER HUB - Gestão de Manufatura de Molduras

## ✅ STATUS: SISTEMA INSTALADO E FUNCIONANDO

**Data de Instalação:** 25/11/2025

---

## 📋 RESUMO DO SISTEMA

Sistema completo de gestão para manufatura de molduras com integração de marketplaces.

### 🎯 Funcionalidades Principais:

1. **Gestão de Produtos**
   - Cadastro de molduras, vidros, MDF, insumos
   - Controle de estoque
   - Precificação automática

2. **Pedidos de Manufatura**
   - Orçamentos automáticos com cálculo de custos
   - Gestão de clientes
   - Workflow de aprovação

3. **Produção**
   - Ordens de produção
   - Timeline de atividades
   - Checklist de qualidade
   - Aprovação em cascata (Gerência + Financeiro)

4. **Financeiro**
   - Contas bancárias
   - Contas a pagar e receber
   - Categorias e grupos
   - Fluxo de caixa

5. **Marketplace Integration**
   - Mercado Livre (OAuth2 + PKCE)
   - Shopee (estrutura pronta)
   - Sincronização automática de pedidos
   - Central unificada

6. **Marketing**
   - Gestão de tarefas
   - Calendário de atividades
   - Dashboard de métricas

7. **Multi-Loja**
   - Fábrica + 5 lojas
   - Controle de acesso por loja
   - Permissões granulares

---

## 🔐 CREDENCIAIS DE ACESSO

### Usuários Criados:

| Username | Senha | Nome | Role | Setor |
|----------|-------|------|------|-------|
| `diretor` | `123` | Diretor | director | - |
| `espelho` | `123` | Mateus | production | Espelho |
| `molduras-vidro` | `123` | Ronaldo | production | Molduras com Vidro |
| `molduras` | `123` | Luiz | production | Molduras |
| `impressao` | `123` | Camila | production | Impressão |
| `expedicao` | `123` | Thalita | production | Expedição |
| `embalagem` | `123` | Ludmila | production | Embalagem |

⚠️ **IMPORTANTE:** Altere as senhas após o primeiro acesso em produção!

---

## 🏗️ ARQUITETURA

### Backend (FastAPI)
- **Porta:** 8001
- **Tecnologia:** Python 3.11 + FastAPI + Motor (MongoDB async)
- **Autenticação:** JWT com bcrypt
- **Localização:** `/app/backend/`

### Frontend (React)
- **Porta:** 3000
- **Tecnologia:** React 19 + Tailwind CSS + Radix UI
- **Roteamento:** React Router v7
- **Localização:** `/app/frontend/`

### Banco de Dados
- **MongoDB:** localhost:27017
- **Database:** lider_hub_db
- **Collections principais:**
  - `users` - Usuários do sistema
  - `projetos_marketplace` - Projetos Shopee/Mercado Livre
  - `pedidos_marketplace` - Pedidos importados
  - `produtos_gestao` - Catálogo de produtos
  - `clientes` - Cadastro de clientes
  - `pedidos_manufatura` - Pedidos de produção
  - `ordens_producao` - Ordens da fábrica
  - `contas_bancarias` - Contas financeiras
  - `contas_receber` / `contas_pagar` - Financeiro

---

## 🚀 COMO USAR

### Acessar o Sistema:
1. Acesse: https://lider-sistema.preview.emergentagent.com
2. Faça login com um dos usuários acima

### Comandos Úteis:

```bash
# Verificar status dos serviços
sudo supervisorctl status

# Reiniciar backend
sudo supervisorctl restart backend

# Reiniciar frontend
sudo supervisorctl restart frontend

# Reiniciar tudo
sudo supervisorctl restart all

# Ver logs do backend
tail -f /var/log/supervisor/backend.err.log

# Ver logs do frontend
tail -f /var/log/supervisor/frontend.out.log
```

---

## 📁 ESTRUTURA DE ARQUIVOS

```
/app/
├── backend/
│   ├── server.py (API principal - 5700+ linhas)
│   ├── marketplace_integrator.py (Integrações ML/Shopee)
│   ├── criar_usuarios_setores.py (Script de setup)
│   ├── criar_projetos_fixos.py (Setup marketplaces)
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.js (Roteamento principal)
│   │   ├── pages/ (Páginas do sistema)
│   │   │   ├── gestao/ (Sistema novo)
│   │   │   │   ├── Produtos.js
│   │   │   │   ├── Pedidos.js
│   │   │   │   ├── Producao.js
│   │   │   │   ├── Financeiro.js
│   │   │   │   ├── MarketplacesCentral.js
│   │   │   │   └── ...
│   │   │   └── ... (Sistema antigo)
│   │   ├── components/
│   │   │   ├── gestao/ (Componentes novos)
│   │   │   └── ui/ (Radix UI)
│   │   └── ...
│   ├── package.json
│   └── .env
├── tests/ (Scripts de teste)
└── *.md (Documentação)
```

---

## 🔧 VARIÁVEIS DE AMBIENTE

### Backend (.env):
```bash
MONGO_URL="mongodb://localhost:27017"
DB_NAME="lider_hub_db"
CORS_ORIGINS="*"
JWT_SECRET="lider-hub-secret-key-2025-change-in-production"
EMERGENT_LLM_KEY=""

# Marketplace Credentials (quando configurar)
ML_CLIENT_ID=""
ML_CLIENT_SECRET=""
ML_REDIRECT_URI=""
SHOPEE_PARTNER_ID=""
SHOPEE_PARTNER_KEY=""
SHOPEE_SHOP_ID=""
```

### Frontend (.env):
```bash
REACT_APP_BACKEND_URL=https://lider-sistema.preview.emergentagent.com
WDS_SOCKET_PORT=443
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
```

---

## 📊 PROJETOS MARKETPLACE

2 projetos fixos criados:

1. **Mercado Livre** (mercadolivre)
   - ID: mercadolivre-projeto
   - Horários: Flex 14:00, Agência 17:00

2. **Shopee - Diamonds** (shopee)
   - ID: shopee-projeto
   - Horários: Flex 16:00, Coleta 18:00

---

## 🔐 INTEGRAÇÕES MARKETPLACE

### Mercado Livre (pronto para configurar):
1. Criar app em: https://developers.mercadolibre.com.br/
2. Obter App ID e Secret Key
3. Configurar no `.env` do backend
4. Acessar endpoint de autorização no sistema
5. Sincronização automática funcionará

### Shopee (estrutura pronta):
1. Registrar em Shopee Open Platform
2. Obter Partner ID e Key
3. Configurar no `.env`
4. Implementar autorização

**Documentação completa:** Ver `MARKETPLACE_INTEGRATOR_DOCS.md`

---

## ✅ TESTES REALIZADOS

- ✅ Backend iniciado com sucesso (porta 8001)
- ✅ Frontend compilado e rodando (porta 3000)
- ✅ MongoDB conectado
- ✅ 7 usuários criados no banco
- ✅ 2 projetos marketplace criados
- ✅ Login testado (diretor e molduras)
- ✅ API respondendo corretamente
- ✅ JWT funcionando

---

## 📚 DOCUMENTAÇÃO ADICIONAL

Consulte os arquivos MD na raiz do projeto:

- `CREDENCIAIS_LOGIN.md` - Lista completa de usuários
- `CHECKLIST_DEPLOY.md` - Guia de publicação
- `MARKETPLACE_INTEGRATOR_DOCS.md` - Integração de marketplaces
- `SETUP_INTEGRADOR.md` - Setup de integrações
- `REGRAS_AUTOMACAO_SETOR.md` - Regras de negócio
- `test_result.md` - Histórico de testes

---

## 🎯 PRÓXIMOS PASSOS

1. **Testar Interface:**
   - Fazer login com diferentes usuários
   - Navegar pelas funcionalidades
   - Verificar permissões

2. **Configurar Integrações:**
   - Obter credenciais do Mercado Livre
   - Obter credenciais do Shopee
   - Configurar .env e testar

3. **Produção:**
   - Alterar senhas dos usuários
   - Configurar JWT_SECRET próprio
   - Fazer backup do banco de dados

4. **Personalizar:**
   - Adicionar mais usuários conforme necessário
   - Configurar categorias financeiras
   - Cadastrar produtos iniciais

---

## 🐛 TROUBLESHOOTING

### Backend não inicia:
```bash
tail -n 50 /var/log/supervisor/backend.err.log
cd /app/backend && python3 server.py
```

### Frontend com erros:
```bash
tail -n 50 /var/log/supervisor/frontend.err.log
cd /app/frontend && yarn start
```

### MongoDB não conecta:
```bash
sudo supervisorctl status mongodb
sudo supervisorctl restart mongodb
```

### Resetar senha de usuário:
```python
# Conectar ao MongoDB e executar
python3 -c "
import asyncio, bcrypt, uuid
from motor.motor_asyncio import AsyncIOMotorClient

async def reset():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['lider_hub_db']
    nova_senha = 'nova123'
    hash_senha = bcrypt.hashpw(nova_senha.encode(), bcrypt.gensalt()).decode()
    await db.users.update_one(
        {'username': 'diretor'}, 
        {'$set': {'password_hash': hash_senha}}
    )
    print('Senha alterada!')
    client.close()

asyncio.run(reset())
"
```

---

## 📞 SUPORTE

Para dúvidas sobre funcionalidades específicas, consulte:
- Código fonte em `/app/backend/server.py`
- Componentes React em `/app/frontend/src/`
- Documentação técnica nos arquivos `.md`

---

**Sistema:** LIDER HUB v1.0  
**Instalação:** 25/11/2025  
**Status:** ✅ OPERACIONAL
