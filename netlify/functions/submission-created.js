/**
 * Netlify Forms trigger function — modo CAPTAÇÃO DE LEADS.
 *
 * Integração financeira (Asaas) desconectada temporariamente.
 * O submit do form salva o lead no Netlify Forms e esta função
 * apenas loga os dados para acompanhamento.
 *
 * Para reativar o fluxo de pagamento, restaurar a lógica Asaas
 * e adicionar ASAAS_API_KEY nas env vars do site.
 */

exports.handler = async (event) => {
  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch (e) {
    console.error("Payload inválido:", e);
    return { statusCode: 400, body: "bad_payload" };
  }

  const submission = body.payload || body;
  const data = submission.data || submission;
  const submissionId = submission.id || submission.number || `sub-${Date.now()}`;

  const nome    = data.nome || "";
  const email   = data.email || "";
  const oab     = data.oab || "";
  const cidade  = data.cidade || "";
  const preco   = data.preco_interesse || "";
  const funcs   = data.funcionalidades_desejadas || "";
  const origem  = data.origem || "";

  console.log(`[LEAD ${submissionId}] ${nome} · ${email} · OAB ${oab} · ${cidade}`);
  console.log(`[LEAD ${submissionId}] Preço interesse: ${preco}`);
  console.log(`[LEAD ${submissionId}] Funcionalidades: ${funcs}`);
  console.log(`[LEAD ${submissionId}] Origem: ${origem}`);

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, lead: submissionId }),
  };
};
