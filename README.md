# 💸 Gastei!

App de controle financeiro do casal. Funciona como PWA — pode instalar no celular direto pelo Chrome/Safari.

---

## 🚀 Como subir do zero

### 1. Supabase (banco de dados)

1. Acesse [supabase.com](https://supabase.com) → crie um projeto gratuito
2. No menu lateral: **SQL Editor** → cole o conteúdo de `supabase_migration.sql` → clique em **Run**
3. Vá em **Project Settings → API** e copie:
   - **Project URL** (ex: `https://xyzxyz.supabase.co`)
   - **anon public key**

### 2. Configurar o app

Abra o arquivo `app.js` e edite as linhas 11 e 12:

```js
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co'   // ← cole sua URL
const SUPABASE_ANON_KEY = 'SUA_ANON_KEY'                 // ← cole sua chave
```

### 3. GitHub

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/gastei.git
git push -u origin main
```

### 4. Vercel (hospedagem gratuita)

1. Acesse [vercel.com](https://vercel.com) → **Add New Project**
2. Importe o repositório do GitHub
3. Clique em **Deploy** — pronto!
4. Seu app ficará em `https://gastei.vercel.app` (ou domínio personalizado)

---

## 📱 Instalar no celular como app

**Android (Chrome):**  
Menu ⋮ → "Adicionar à tela inicial"

**iPhone (Safari):**  
Botão compartilhar □↑ → "Adicionar à Tela de Início"

---

## 🛠️ Personalizar

Todos os dados configuráveis estão no topo do `app.js`:

| Variável | O que faz |
|---|---|
| `RENDA` | Faturamento mensal |
| `CATS` | Categorias variáveis e limites |
| `GRUPOS` | Grupos de boletos e seus itens |

---

## 📂 Estrutura

```
gastei/
├── index.html            # App completo (HTML + CSS)
├── app.js                # Lógica + integração Supabase
├── manifest.json         # PWA (instalar no celular)
├── vercel.json           # Config de deploy
├── supabase_migration.sql # Crie as tabelas aqui
└── README.md
```
