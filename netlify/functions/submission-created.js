/**
 * Netlify Forms trigger function.
 * Dispara automaticamente a cada novo submit do form `granola-cadastro`.
 *
 * O que faz:
 *  1. Extrai os dados do cadastro.
 *  2. Cria (ou reusa) um cliente na Asaas via POST /v3/customers.
 *  3. Cria uma cobrança com billingType=UNDEFINED (PIX + boleto + cartão na mesma tela).
 *  4. Asaas envia o link de pagamento por e-mail + SMS ao cliente automaticamente.
 *  5. Loga o resultado (visível em Netlify → Functions → Logs).
 *
 * Variáveis de ambiente necessárias (configurar em Netlify → Site settings → Environment variables):
 *   ASAAS_API_KEY   — chave da API Asaas (começa com $aact_prod_... ou $aact_hmlg_...)
 *   ASAAS_ENV       — "production" ou "sandbox" (default: sandbox)
 */

const ASAAS_BASE = {
  production: "https://api.asaas.com/v3",
  sandbox:    "https://api-sandbox.asaas.com/v3",
};

const PLANOS = {
  "Solo · R$ 897":      { nome: "Solo",   valor: 897.00  },
  "Equipe · R$ 1.249":  { nome: "Equipe", valor: 1249.00 },
};

const onlyDigits = (s) => String(s || "").replace(/\D/g, "");

function parsePlano(plano) {
  if (PLANOS[plano]) return PLANOS[plano];
  if (String(plano).toLowerCase().includes("solo"))   return PLANOS["Solo · R$ 897"];
  if (String(plano).toLowerCase().includes("equipe")) return PLANOS["Equipe · R$ 1.249"];
  return PLANOS["Equipe · R$ 1.249"];
}

function formatarVencimento(diasAFrente = 3) {
  const d = new Date();
  d.setDate(d.getDate() + diasAFrente);
  return d.toISOString().split("T")[0];
}

async function asaasFetch(path, apiKey, baseUrl, options = {}) {
  const resp = await fetch(`${baseUrl}${path}`, {
    method: options.method || "GET",
    headers: {
      "access_token": apiKey,
      "Content-Type": "application/json",
      "User-Agent":   "Granola-Landing-Netlify/1.0",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { ok: resp.ok, status: resp.status, data: json };
}

exports.handler = async (event) => {
  const apiKey = process.env.ASAAS_API_KEY;
  const env    = (process.env.ASAAS_ENV || "sandbox").toLowerCase();
  const baseUrl = ASAAS_BASE[env] || ASAAS_BASE.sandbox;

  if (!apiKey) {
    console.error("ASAAS_API_KEY não configurada — abortando.");
    return { statusCode: 200, body: JSON.stringify({ skipped: "no_api_key" }) };
  }

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch (e) { console.error("Payload inválido:", e); return { statusCode: 400, body: "bad_payload" }; }

  const payload = body.payload || {};
  const data    = payload.data || payload;
  const submissionId = payload.id || payload.number || `sub-${Date.now()}`;

  const nome        = data.nome || "";
  const oab         = data.oab || "";
  const cpf         = onlyDigits(data.cpf);
  const cnpj        = onlyDigits(data.cnpj);
  const cpfCnpj     = cnpj || cpf;
  const email       = data.email || "";
  const whatsapp    = onlyDigits(data.whatsapp);
  const escritorio  = data.escritorio || "";
  const cidade      = data.cidade || "";
  const plano       = parsePlano(data.plano);

  if (!nome || !email || !cpfCnpj) {
    console.error("Campos mínimos ausentes:", { nome, email, cpfCnpj });
    return { statusCode: 200, body: JSON.stringify({ skipped: "missing_fields" }) };
  }

  console.log(`[${submissionId}] Criando cobrança Asaas (${env}) — ${nome} · ${plano.nome} · R$ ${plano.valor}`);

  const customerBody = {
    name: nome,
    cpfCnpj: cpfCnpj,
    email: email,
    mobilePhone: whatsapp || undefined,
    company: escritorio || undefined,
    addressNumber: undefined,
    externalReference: `netlify-${submissionId}`,
    observations: `Cadastro Granola via landing · Plano ${plano.nome} · OAB ${oab} · ${cidade}`,
  };

  const customerResp = await asaasFetch("/customers", apiKey, baseUrl, {
    method: "POST",
    body: customerBody,
  });

  if (!customerResp.ok || !customerResp.data.id) {
    console.error(`[${submissionId}] Falha ao criar customer:`, customerResp.status, customerResp.data);
    return { statusCode: 200, body: JSON.stringify({ error: "customer_failed", details: customerResp.data }) };
  }

  const customerId = customerResp.data.id;
  console.log(`[${submissionId}] Customer criado: ${customerId}`);

  const paymentBody = {
    customer: customerId,
    billingType: "UNDEFINED",
    value: plano.valor,
    dueDate: formatarVencimento(3),
    description: `Granola ${plano.nome} — licença vitalícia · OAB ${oab}`,
    externalReference: `netlify-${submissionId}`,
    postalService: false,
  };

  const paymentResp = await asaasFetch("/payments", apiKey, baseUrl, {
    method: "POST",
    body: paymentBody,
  });

  if (!paymentResp.ok || !paymentResp.data.id) {
    console.error(`[${submissionId}] Falha ao criar payment:`, paymentResp.status, paymentResp.data);
    return { statusCode: 200, body: JSON.stringify({ error: "payment_failed", details: paymentResp.data }) };
  }

  const { id: paymentId, invoiceUrl, bankSlipUrl } = paymentResp.data;
  console.log(`[${submissionId}] Cobrança criada: ${paymentId} · ${invoiceUrl}`);

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      submissionId,
      customerId,
      paymentId,
      invoiceUrl,
      bankSlipUrl,
    }),
  };
};
