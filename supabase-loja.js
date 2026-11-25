// supabase-loja.js — Sincroniza catálogo, cupons, áreas e loja para todos os usuários
const SUPABASE_LOJA_URL = "https://sjiyiddwalohetqcidho.supabase.co";
const SUPABASE_LOJA_KEY = "sb_publishable_NNO9de18IgIO-8DyfBJRng_19ayZhS0";

// Envia uma alteração do admin para o Supabase (todos os usuários cadastrados)
async function salvarGlobalNoSupabase(chave, valor) {
  try {
    const resp = await fetch(`${SUPABASE_LOJA_URL}/rest/v1/config_sistema_global`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_LOJA_KEY,
        "Authorization": `Bearer ${SUPABASE_LOJA_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        chave,
        valor,
        atualizado_em: new Date().toISOString()
      })
    });
    if (!resp.ok) {
      console.warn("Supabase recusou a gravação global:", resp.status);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("Erro ao salvar no Supabase:", e);
    return false;
  }
}

// Busca os dados mais recentes do Supabase quando o site abre
async function carregarGlobaisDoSupabase() {
  try {
    const resp = await fetch(`${SUPABASE_LOJA_URL}/rest/v1/config_sistema_global?select=chave,valor`, {
      headers: {
        "apikey": SUPABASE_LOJA_KEY,
        "Authorization": `Bearer ${SUPABASE_LOJA_KEY}`
      }
    });
    if (!resp.ok) return false;

    const dados = await resp.json();
    if (!Array.isArray(dados) || dados.length === 0) return false;

    dados.forEach(({ chave, valor }) => {
      if (chave === "produtos_db" && Array.isArray(valor)) {
        localStorage.setItem("produtos_db", JSON.stringify(valor));
      }
      if (chave === "cupons_admin_db" && Array.isArray(valor)) {
        localStorage.setItem("cupons_admin_db", JSON.stringify(valor));
        localStorage.setItem("cupons_db", JSON.stringify(valor));
      }
      if (chave === "areas_entrega_db" && Array.isArray(valor)) {
        localStorage.setItem("areas_entrega_db", JSON.stringify(valor));
        localStorage.setItem("bairros_entrega", JSON.stringify(valor));
      }
      if (chave === "loja_info" && valor && typeof valor === "object") {
        if (valor.nome) {
          localStorage.setItem("nomeEstabelecimento", valor.nome);
          localStorage.setItem("lojaNome", valor.nome);
        }
        if (valor.horario) {
          localStorage.setItem("horario_funcionamento", valor.horario);
        }
      }
    });

    return true;
  } catch (e) {
    console.warn("Erro ao carregar do Supabase:", e);
    return false;
  }
}