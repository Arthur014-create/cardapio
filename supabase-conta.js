const SUPABASE_URL = "https://sjiyiddwalohetqcidho.supabase.co";
const SUPABASE_KEY = "sb_publishable_NNO9de18IgIO-8DyfBJRng_19ayZhS0";

async function supabaseRequest(caminho, opcoes = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${caminho}`;
  const resp = await fetch(url, {
    ...opcoes,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...(opcoes.headers || {})
    }
  });
  const texto = await resp.text();
  let dados = null;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch (e) {
    dados = null;
  }
  return { ok: resp.ok, status: resp.status, dados };
}

async function cadastrarUsuarioSupabase(usuario) {
  const emailLimpo = usuario.email.trim().toLowerCase();

  const jaExiste = await supabaseRequest(
    `usuarios?email=eq.${encodeURIComponent(emailLimpo)}&select=id,email`
  );
  if (jaExiste.ok && Array.isArray(jaExiste.dados) && jaExiste.dados.length > 0) {
    return { ok: false, mensagem: "Este e-mail já está cadastrado!" };
  }

  const res = await supabaseRequest("usuarios", {
    method: "POST",
    body: JSON.stringify([{
      nome: usuario.nome,
      email: emailLimpo,
      telefone: usuario.telefone,
      idade: usuario.idade || "",
      endereco: usuario.endereco,
      senha: usuario.senha,
      tipo: usuario.tipo || "cliente"
    }])
  });

  if (!res.ok) {
    return { ok: false, mensagem: "Não foi possível salvar o cadastro no banco." };
  }

  await supabaseRequest("dados_conta", {
    method: "POST",
    headers: { "Prefer": "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify([{
      email_usuario: emailLimpo,
      favoritos: [],
      sacola: [],
      pedidos: []
    }])
  });

  const criado = Array.isArray(res.dados) ? res.dados[0] : usuario;
  return { ok: true, usuario: criado };
}

async function loginUsuarioSupabase(entrada, senha) {
  const termo = entrada.trim().toLowerCase();
  const res = await supabaseRequest(
    `usuarios?or=(email.eq.${encodeURIComponent(termo)},nome.ilike.${encodeURIComponent(termo)})&select=*`
  );

  if (!res.ok || !Array.isArray(res.dados) || res.dados.length === 0) {
    return { ok: false, mensagem: "Usuário ou e-mail não encontrado." };
  }

  const user = res.dados.find(u => u.senha === senha);
  if (!user) {
    return { ok: false, mensagem: "Senha incorreta!" };
  }

  await sincronizarDadosConta(user.email);
  return { ok: true, usuario: user };
}

async function gerarCodigoRecuperacaoSupabase(email) {
  const emailLimpo = email.trim().toLowerCase();
  const busca = await supabaseRequest(
    `usuarios?email=eq.${encodeURIComponent(emailLimpo)}&select=id,email,nome`
  );

  if (!busca.ok || !Array.isArray(busca.dados) || busca.dados.length === 0) {
    return { ok: false, mensagem: "E-mail não encontrado no banco." };
  }

  const codigo = String(Math.floor(100000 + Math.random() * 900000));
  const upd = await supabaseRequest(
    `usuarios?email=eq.${encodeURIComponent(emailLimpo)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ codigo_recuperacao: codigo })
    }
  );

  if (!upd.ok) {
    return { ok: false, mensagem: "Erro ao gerar código de recuperação." };
  }

  return { ok: true, codigo };
}

async function redefinirSenhaSupabase(email, codigo, novaSenha) {
  const emailLimpo = email.trim().toLowerCase();
  const busca = await supabaseRequest(
    `usuarios?email=eq.${encodeURIComponent(emailLimpo)}&select=id,codigo_recuperacao`
  );

  const user = busca.ok && Array.isArray(busca.dados) ? busca.dados[0] : null;
  if (!user || user.codigo_recuperacao !== codigo.trim()) {
    return { ok: false, mensagem: "Código inválido!" };
  }

  const upd = await supabaseRequest(
    `usuarios?email=eq.${encodeURIComponent(emailLimpo)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        senha: novaSenha,
        codigo_recuperacao: null
      })
    }
  );

  if (!upd.ok) {
    return { ok: false, mensagem: "Erro ao atualizar a senha." };
  }

  return { ok: true, mensagem: "Senha redefinida com sucesso!" };
}

async function sincronizarDadosConta(email) {
  if (!email || email === "convidado") return;
  const emailLimpo = email.trim().toLowerCase();
  const res = await supabaseRequest(
    `dados_conta?email_usuario=eq.${encodeURIComponent(emailLimpo)}&select=*`
  );

  if (res.ok && Array.isArray(res.dados) && res.dados.length > 0) {
    const conta = res.dados[0];
    if (Array.isArray(conta.favoritos)) {
      localStorage.setItem(`favoritos_${emailLimpo}`, JSON.stringify(conta.favoritos));
    }
    if (Array.isArray(conta.sacola)) {
      localStorage.setItem(`sacola_${emailLimpo}`, JSON.stringify(conta.sacola));
    }
    if (Array.isArray(conta.pedidos)) {
      localStorage.setItem(`historico_pedidos_${emailLimpo}`, JSON.stringify(conta.pedidos));
    }
  }
}

async function salvarTudoDaContaSupabase() {
  const ativo = JSON.parse(localStorage.getItem("usuario_ativo") || "null");
  if (!ativo || !ativo.email || ativo.email === "convidado") return;

  const emailLimpo = ativo.email.trim().toLowerCase();
  const favoritos = JSON.parse(localStorage.getItem(`favoritos_${emailLimpo}`) || "[]");
  const sacola = JSON.parse(localStorage.getItem(`sacola_${emailLimpo}`) || "[]");
  const pedidos = JSON.parse(localStorage.getItem(`historico_pedidos_${emailLimpo}`) || "[]");

  await supabaseRequest("dados_conta", {
    method: "POST",
    headers: { "Prefer": "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify([{
      email_usuario: emailLimpo,
      favoritos,
      sacola,
      pedidos,
      atualizado_em: new Date().toISOString()
    }])
  });
}

window.addEventListener("storage", () => {
  salvarTudoDaContaSupabase();
});