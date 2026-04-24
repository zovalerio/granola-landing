# Granola — Landing Page

Página promocional do sistema Granola (CRM jurídico), pronta para deploy no Netlify e posterior conexão do domínio `granola.app.br`.

---

## 📦 Conteúdo do pacote

```
granola-landing/
├── index.html                              → landing completa (CSS + JS inline)
├── netlify.toml                            → build config + headers de segurança
├── _redirects                              → regras de redirecionamento
├── netlify/functions/submission-created.js → cria cobrança Asaas automática no submit
├── assets/
│   └── favicon.svg                         → ícone Granola
└── README.md                               → este arquivo
```

## 💳 Integração Asaas (automática)

Toda vez que alguém submete o form, a função `netlify/functions/submission-created.js`:
1. Lê os dados do cadastro
2. Cria o cliente na Asaas (`POST /v3/customers`)
3. Cria uma cobrança `billingType=UNDEFINED` (cliente escolhe PIX/boleto/cartão na mesma tela)
4. Asaas envia e-mail + SMS com o link de pagamento direto pro cliente

### Variáveis de ambiente a configurar no Netlify

Em **Site settings → Environment variables → Add a variable**:

| Chave | Valor |
|-------|-------|
| `ASAAS_API_KEY` | sua chave Asaas (`$aact_prod_...` ou `$aact_hmlg_...`) |
| `ASAAS_ENV` | `production` (produção) ou `sandbox` (testes) |

Onde obter a chave: painel Asaas → **Integrações → Gerar Nova Chave de API**.
Começa em sandbox (api-sandbox.asaas.com), testa com CPF `24971563792` (CPF de teste oficial), vira produção só depois.

### Logs da função

Netlify → **Functions** → `submission-created` → **Logs**. Cada execução mostra o ID da submission, ID do cliente Asaas e a `invoiceUrl` gerada.

Tudo self-contained. Sem dependências de build — só fontes do Google Fonts via CDN.

---

## 🚀 Deploy no Netlify (método mais rápido — 2 minutos)

### Passo 1 — Subir a pasta

1. Acesse **<https://app.netlify.com/drop>**
2. Faça login (ou crie conta grátis com GitHub/Google)
3. **Arraste a pasta `granola-landing/` inteira** para a área indicada
4. Aguarde o upload (~15 segundos)
5. Netlify gerará uma URL temporária tipo `https://nome-aleatorio-123.netlify.app`

✅ Pronto. A landing já está no ar.

### Passo 2 — Renomear o projeto (opcional, mas recomendado)

1. No dashboard, clique em **Site settings** → **Change site name**
2. Coloque algo tipo `granola-crm` → fica `granola-crm.netlify.app`

---

## 🌐 Conectar o domínio `granola.app.br`

### Passo 1 — Adicionar o domínio no Netlify

1. No dashboard do site → **Domain management** → **Add a domain**
2. Digite `granola.app.br` e confirme
3. Netlify mostrará os servidores DNS ou registros A/CNAME necessários

### Passo 2 — Configurar DNS (Registro.br)

Acesse <https://registro.br> → painel → DNS do domínio e aponte:

**Opção A — Usar DNS do Netlify (mais simples):**
- Trocar os 4 servidores DNS para os que o Netlify fornecer (`dns1.p01.nsone.net`, etc.)
- Propagação: 1–24h

**Opção B — Manter DNS externo:**
- Registro A: `@` → `75.2.60.5` (IP do Netlify load balancer)
- Registro CNAME: `www` → `apex-loadbalancer.netlify.com`
- Propagação: 10 min – 2h

### Passo 3 — HTTPS automático

Netlify emite certificado Let's Encrypt automaticamente após a propagação do DNS. Nada a fazer.

---

## 📧 Formulário de cadastro

O formulário da seção "Garantir minha licença" usa **Netlify Forms** (grátis, 100 submissões/mês no plano free) + a função serverless acima.

### Onde ver os envios

1. Dashboard Netlify → seu site → **Forms**
2. Formulário chamado **`granola-cadastro`**
3. Cada envio traz: nome, OAB, CPF, e-mail, WhatsApp, plano, forma de pagamento, origem, observações

### Notificações por e-mail (IMPORTANTE — configurar logo após primeiro deploy)

1. Em **Forms** → **Settings & usage** → **Form notifications** → **Add notification** → **Email**
2. Adicione seu e-mail para receber alerta a cada novo cadastro
3. Paralelo a isso, o cliente recebe automaticamente o e-mail+SMS da Asaas com o link de pagamento (via função serverless)

---

## ✏️ O que ajustar antes de divulgar

Campos que coloquei como **placeholder** e precisam ser revisados:

| Item | Onde | Valor atual (placeholder) |
|------|------|---------------------------|
| WhatsApp do nav/footer | `href="https://wa.me/55..."` | `5515999999999` |
| E-mail de suporte | FAQ e footer | `suporte@granola.app.br` |
| Valores dos planos | Seção "Planos" | R$ 1.197 / 2.497 / 4.997 |
| Textos dos depoimentos | Seção "Depoimentos" | Vozes ilustrativas |
| Endereço no footer | Footer | "Sorocaba · SP" |

Para editar: abra o `index.html` em qualquer editor, faça Ctrl+F pelo valor que quer trocar.

---

## 🧪 Testar localmente antes de subir

Se quiser ver rodando na sua máquina antes:

```bash
cd granola-landing
python3 -m http.server 8080
```

Abra <http://localhost:8080> no navegador. Obs: o **formulário só funciona depois do deploy no Netlify** — localmente ele dá erro no submit.

---

## 🔄 Atualizações futuras

**Opção 1 — Drag & drop novamente:**
Faça as alterações no `index.html` e arraste a pasta de novo em <https://app.netlify.com/drop> (atualiza o mesmo site).

**Opção 2 — Deploy contínuo via Git:**
1. Crie um repo no GitHub com essa pasta
2. Netlify → **Site settings** → **Build & deploy** → **Link repository**
3. Daqui em diante, cada `git push` faz deploy automático

---

## 📊 Analytics (opcional)

Para tracking de visitas:
- **Netlify Analytics** (pago, $9/mês, sem JavaScript, sem cookies)
- **Plausible/Umami** (grátis/barato, cookieless, LGPD-friendly)
- **Google Analytics 4** (grátis, mas exige banner de cookies)

Basta colar o script antes do `</head>` no `index.html`.

---

**Do grão ao sistema.** 🌾
