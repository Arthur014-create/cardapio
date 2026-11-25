const SUPABASE_URL = "https://sjiyiddwalohetqcidho.supabase.co";
const SUPABASE_KEY = "sb_publishable_NNO9de18IgIO-8DyfBJRng_19ayZhS0";

let __salvandoContaEmAndamento = false;
let __salvarContaNovamentePendente = false;

/* ---------- Utilitários de localStorage (nunca lançam erro) ---------- */
function lerJsonLocal(chave, padrao) {
  try {
    const bruto = localStorage.getItem(chave);
    if (bruto === null || bruto === undefined || bruto === "") return padrao;
    const valor = JSON.parse(bruto);
    return valor === null || valor === undefined ? padrao : valor;
  } catch (e) {
    return padrao;
  }
}

function gravarJsonLocal(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
    return true;
  } catch (e) {
    return false;
  }
}

function normalizarEmailConta(email) {
  return String(email || "").trim().toLowerCase();
}

/* ---------- Chaves padronizadas (mesmo e-mail normalizado em todo o site) ---------- */
function obterChaveSacolaConta(email) {
  const e = normalizarEmailConta(email);
  return e && e !== "convidado" ? `carrinho_usuario_${e}` : "carrinho_usuario_convidado";
}

function obterChaveEnderecosConta(email) {
  const e = normalizarEmailConta(email);
  return e && e !== "convidado" ? `enderecos_usuario_${e}` : "enderecos_usuario_convidado";
}

function obterChaveFavoritosConta(email) {
  const e = normalizarEmailConta(email);
  return e && e !== "convidado" ? `favoritos_${e}` : "favoritos_convidado";
}

function obterChavePedidosConta(email) {
  const e = normalizarEmailConta(email);
  return e && e !== "convidado" ? `historico_pedidos_${e}` : "historico_pedidos_convidado";
}

function obterEmailSessaoConta() {
  const ativo = lerJsonLocal("usuario_ativo", null);
  if (!ativo || ativo.visitante === true) return "convidado";
  const e = normalizarEmailConta(ativo.email);
  return e || "convidado";
}

// Traz para a chave oficial (carrinho_usuario_<email>) sacolas salvas com nomes antigos
function migrarSacolaLegada(email) {
  try {
    const e = normalizarEmailConta(email) || "convidado";
    const chaveOficial = obterChaveSacolaConta(e);
    const atual = lerJsonLocal(chaveOficial, []);
    const legadas = [`sacola_${e}`, `carrinho_${e}`];
    legadas.forEach(chaveLegada => {
      const lista = lerJsonLocal(chaveLegada, null);
      if (Array.isArray(lista) && lista.length > 0 && (!Array.isArray(atual) || atual.length === 0)) {
        gravarJsonLocal(chaveOficial, lista);
      }
      if (lista !== null) {
        try { localStorage.removeItem(chaveLegada); } catch (err) {}
      }
    });
  } catch (err) {}
}

/* ---------- Requisição única ao Supabase ---------- */
async function supabaseRequest(caminho, opcoes = {}) {
  let controlador = null;
  let temporizador = null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/${caminho}`;
    controlador = typeof AbortController !== "undefined" ? new AbortController() : null;
    if (controlador) {
      temporizador = setTimeout(() => controlador.abort(), 15000);
    }
    const resp = await fetch(url, {
      ...opcoes,
      ...(controlador ? { signal: controlador.signal } : {}),
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
    if (!resp.ok) {
      return {
        ok: false,
        rede: false,
        status: resp.status,
        dados,
        mensagem: (dados && (dados.message || dados.error || dados.hint)) || `Erro na requisição (${resp.status}).`
      };
    }
    return { ok: true, rede: false, status: resp.status, dados, mensagem: "" };
  } catch (err) {
    return {
      ok: false,
      rede: true,
      status: 0,
      dados: null,
      mensagem: "Sem conexão com o servidor ou falha de rede."
    };
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }
}

/* ---------- Endereço: mantém lista, perfil e sessão sempre iguais ---------- */
function gravarEnderecoLocalConta(email, enderecoTexto) {
  try {
    const emailLimpo = normalizarEmailConta(email);
    const enderecoLimpo = String(enderecoTexto || "").trim();
    if (!emailLimpo || emailLimpo === "convidado" || !enderecoLimpo) return;

    const chaveEnderecos = obterChaveEnderecosConta(emailLimpo);
    let lista = lerJsonLocal(chaveEnderecos, []);
    if (!Array.isArray(lista)) lista = [];

    lista = lista.map(item => ({ ...item, principal: false }));
    const idx = lista.findIndex(item =>
      String(item.enderecoCompleto || item.rua || "").trim().toLowerCase() === enderecoLimpo.toLowerCase()
    );

    if (idx >= 0) {
      lista[idx] = {
        ...lista[idx],
        rua: lista[idx].rua || enderecoLimpo,
        enderecoCompleto: enderecoLimpo,
        principal: true
      };
    } else {
      lista.unshift({
        id: Date.now(),
        rua: enderecoLimpo,
        numero: "",
        bairro: "",
        enderecoCompleto: enderecoLimpo,
        principal: true
      });
    }

    gravarJsonLocal(chaveEnderecos, lista);
    localStorage.setItem("enderecoLoja", enderecoLimpo);

    const ativoAtual = lerJsonLocal("usuario_ativo", {});
    if (ativoAtual.email && normalizarEmailConta(ativoAtual.email) === emailLimpo && ativoAtual.visitante !== true) {
      gravarJsonLocal("usuario_ativo", {
        ...ativoAtual,
        email: emailLimpo,
        endereco: enderecoLimpo
      });
    }

    const perfilAtual = lerJsonLocal("perfil_usuario", {});
    if (perfilAtual.email && normalizarEmailConta(perfilAtual.email) === emailLimpo && perfilAtual.visitante !== true) {
      gravarJsonLocal("perfil_usuario", {
        ...perfilAtual,
        email: emailLimpo,
        endereco: enderecoLimpo
      });
    }
  } catch (err) {
    console.warn("Erro ao gravar endereço local:", err);
  }
}

/* ---------- Cadastro ---------- */
function erroDeColunaSenha(res) {
  const msg = String((res && res.mensagem) || "");
  const bruto = res && res.dados ? JSON.stringify(res.dados) : "";
  return /senha/i.test(msg) || /PGRST204|42703/.test(bruto);
}

function erroDeDuplicidade(res) {
  const msg = String((res && res.mensagem) || "");
  return (res && res.status === 409) || /duplicate|already exists|unique/i.test(msg);
}

async function cadastrarUsuarioSupabase(usuario) {
  try {
    const dadosEntrada = usuario || {};
    const emailLimpo = normalizarEmailConta(dadosEntrada.email);
    const senhaLimpa = String(dadosEntrada.senha || "");
    if (!emailLimpo || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailLimpo)) {
      return { ok: false, mensagem: "E-mail inválido." };
    }
    if (!senhaLimpa) {
      return { ok: false, mensagem: "Senha obrigatória." };
    }

    const jaExiste = await supabaseRequest(
      `usuarios?email=eq.${encodeURIComponent(emailLimpo)}&select=*`
    );
    if (!jaExiste.ok) {
      return {
        ok: false,
        rede: jaExiste.rede,
        mensagem: jaExiste.rede
          ? "Sem conexão com o servidor. Verifique sua internet e tente novamente."
          : (jaExiste.mensagem || "Não foi possível verificar o e-mail no servidor.")
      };
    }
    if (Array.isArray(jaExiste.dados) && jaExiste.dados.length > 0) {
      return { ok: false, jaCadastrado: true, mensagem: "Este e-mail já está cadastrado!" };
    }

    const payloadBase = {
      nome: String(dadosEntrada.nome || "").trim(),
      email: emailLimpo,
      telefone: String(dadosEntrada.telefone || "").trim(),
      idade: String(dadosEntrada.idade || "").trim(),
      endereco: String(dadosEntrada.endereco || "").trim(),
      tipo: dadosEntrada.tipo || "cliente"
    };

    let res = await supabaseRequest("usuarios", {
      method: "POST",
      body: JSON.stringify([{ ...payloadBase, senha: senhaLimpa }])
    });

    // Só tenta o nome alternativo da coluna quando o erro for realmente de coluna inexistente
    if (!res.ok && !res.rede && !erroDeDuplicidade(res) && erroDeColunaSenha(res)) {
      const resHash = await supabaseRequest("usuarios", {
        method: "POST",
        body: JSON.stringify([{ ...payloadBase, senha_hash: senhaLimpa }])
      });
      if (resHash.ok || resHash.rede || erroDeDuplicidade(resHash)) {
        res = resHash;
      }
    }

    if (!res.ok) {
      if (erroDeDuplicidade(res)) {
        return { ok: false, jaCadastrado: true, mensagem: "Este e-mail já está cadastrado!" };
      }
      return {
        ok: false,
        rede: res.rede,
        mensagem: res.rede
          ? "Sem conexão com o servidor. Verifique sua internet e tente novamente."
          : (res.mensagem || "Não foi possível salvar o cadastro no banco.")
      };
    }

    // Cria a linha de dados da conta (falha aqui não impede o cadastro)
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

    const criado = Array.isArray(res.dados) && res.dados.length > 0
      ? { ...res.dados[0] }
      : { ...payloadBase };
    criado.email = emailLimpo;
    if (!criado.senha) {
      criado.senha = String(criado.senha_hash || senhaLimpa);
    }
    if (criado.endereco) {
      gravarEnderecoLocalConta(emailLimpo, criado.endereco);
    }
    return { ok: true, usuario: criado };
  } catch (err) {
    return { ok: false, mensagem: "Erro inesperado ao realizar o cadastro. Tente novamente." };
  }
}

/* ---------- Login ---------- */
async function loginUsuarioSupabase(entrada, senha) {
  const MSG_INVALIDO = "E-mail ou senha inválidos, ou conta não cadastrada.";
  try {
    const bruto = String(entrada || "").trim();
    const termo = bruto.toLowerCase();
    const senhaDigitada = String(senha || "");
    if (!termo || !senhaDigitada) {
      return { ok: false, mensagem: MSG_INVALIDO };
    }

    const filtro = termo.includes("@")
      ? `email=eq.${encodeURIComponent(termo)}`
      : `nome=eq.${encodeURIComponent(bruto)}`;

    const res = await supabaseRequest(`usuarios?${filtro}&select=*`);

    if (!res.ok) {
      return {
        ok: false,
        rede: res.rede,
        mensagem: res.rede
          ? "Sem conexão com o servidor. Verifique sua internet e tente novamente."
          : (res.mensagem || "Não foi possível validar o login no servidor.")
      };
    }

    if (!Array.isArray(res.dados) || res.dados.length === 0) {
      return { ok: false, mensagem: MSG_INVALIDO };
    }

    const user = res.dados.find(u => {
      if (!u || typeof u !== "object") return false;
      const senhaRegistro = u.senha ?? u.senha_hash ?? "";
      return String(senhaRegistro).length > 0 && String(senhaRegistro) === senhaDigitada;
    });

    if (!user) {
      return { ok: false, mensagem: MSG_INVALIDO };
    }

    const emailConta = normalizarEmailConta(user.email);
    if (user.endereco) {
      gravarEnderecoLocalConta(emailConta, user.endereco);
    }

    await sincronizarDadosConta(emailConta);
    return {
      ok: true,
      usuario: {
        ...user,
        email: emailConta,
        senha: String(user.senha ?? user.senha_hash ?? senhaDigitada)
      }
    };
  } catch (err) {
    return { ok: false, rede: true, mensagem: "Erro inesperado ao validar o login. Tente novamente." };
  }
}

/* ---------- Recuperação de senha ---------- */
async function gerarCodigoRecuperacaoSupabase(email) {
  try {
    const emailLimpo = normalizarEmailConta(email);
    const busca = await supabaseRequest(
      `usuarios?email=eq.${encodeURIComponent(emailLimpo)}&select=id,email,nome`
    );

    if (!busca.ok) {
      return { ok: false, mensagem: busca.mensagem || "Erro ao consultar e-mail no banco." };
    }
    if (!Array.isArray(busca.dados) || busca.dados.length === 0) {
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
      return { ok: false, mensagem: upd.mensagem || "Erro ao gerar código de recuperação." };
    }

    return { ok: true, codigo };
  } catch (err) {
    return { ok: false, mensagem: "Erro inesperado ao gerar o código de recuperação." };
  }
}

async function redefinirSenhaSupabase(email, codigo, novaSenha) {
  try {
    const emailLimpo = normalizarEmailConta(email);
    const senhaLimpa = String(novaSenha || "");
    if (!senhaLimpa) {
      return { ok: false, mensagem: "Nova senha inválida." };
    }

    const busca = await supabaseRequest(
      `usuarios?email=eq.${encodeURIComponent(emailLimpo)}&select=id,codigo_recuperacao`
    );

    if (!busca.ok) {
      return { ok: false, mensagem: busca.mensagem || "Erro ao verificar código." };
    }

    const user = Array.isArray(busca.dados) ? busca.dados[0] : null;
    if (!user || !user.codigo_recuperacao || String(user.codigo_recuperacao) !== String(codigo || "").trim()) {
      return { ok: false, mensagem: "Código inválido!" };
    }

    let upd = await supabaseRequest(
      `usuarios?email=eq.${encodeURIComponent(emailLimpo)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          senha: senhaLimpa,
          codigo_recuperacao: null
        })
      }
    );

    if (!upd.ok && !upd.rede && erroDeColunaSenha(upd)) {
      upd = await supabaseRequest(
        `usuarios?email=eq.${encodeURIComponent(emailLimpo)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            senha_hash: senhaLimpa,
            codigo_recuperacao: null
          })
        }
      );
    }

    if (!upd.ok) {
      return { ok: false, mensagem: upd.mensagem || "Erro ao atualizar a senha." };
    }

    return { ok: true, mensagem: "Senha redefinida com sucesso!" };
  } catch (err) {
    return { ok: false, mensagem: "Erro inesperado ao redefinir a senha." };
  }
}

/* ---------- Sincronização dos dados da conta ---------- */
async function sincronizarDadosConta(email) {
  try {
    const emailLimpo = normalizarEmailConta(email);
    if (!emailLimpo || emailLimpo === "convidado") return { ok: false, mensagem: "Sessão sem e-mail válido." };

    migrarSacolaLegada(emailLimpo);

    const userRes = await supabaseRequest(
      `usuarios?email=eq.${encodeURIComponent(emailLimpo)}&select=nome,email,telefone,idade,endereco,tipo`
    );
    if (userRes.ok && Array.isArray(userRes.dados) && userRes.dados.length > 0) {
      const u = userRes.dados[0];
      if (u.endereco) {
        gravarEnderecoLocalConta(emailLimpo, u.endereco);
      }
      const ativoAtual = lerJsonLocal("usuario_ativo", null);
      if (ativoAtual && ativoAtual.email && normalizarEmailConta(ativoAtual.email) === emailLimpo && ativoAtual.visitante !== true) {
        gravarJsonLocal("usuario_ativo", {
          ...ativoAtual,
          email: emailLimpo,
          nome: u.nome || ativoAtual.nome || "",
          telefone: u.telefone || ativoAtual.telefone || "",
          idade: u.idade || ativoAtual.idade || "",
          endereco: u.endereco || ativoAtual.endereco || ""
        });
      }
    }

    const res = await supabaseRequest(
      `dados_conta?email_usuario=eq.${encodeURIComponent(emailLimpo)}&select=*`
    );

    if (res.ok && Array.isArray(res.dados) && res.dados.length > 0) {
      const conta = res.dados[0];
      if (Array.isArray(conta.favoritos)) {
        gravarJsonLocal(obterChaveFavoritosConta(emailLimpo), conta.favoritos);
      }
      const sacolaRemota = Array.isArray(conta.sacola) ? conta.sacola : null;
      if (sacolaRemota) {
        const chaveSacola = obterChaveSacolaConta(emailLimpo);
        const localSacola = lerJsonLocal(chaveSacola, []);
        if (sacolaRemota.length > 0 || !Array.isArray(localSacola) || localSacola.length === 0) {
          gravarJsonLocal(chaveSacola, sacolaRemota);
        }
      }
      if (Array.isArray(conta.pedidos)) {
        gravarJsonLocal(obterChavePedidosConta(emailLimpo), conta.pedidos);
      }
      return { ok: true };
    }

    return { ok: res.ok, mensagem: res.mensagem || "" };
  } catch (err) {
    return { ok: false, mensagem: "Erro inesperado ao sincronizar os dados da conta." };
  }
}

async function salvarTudoDaContaSupabase() {
  if (__salvandoContaEmAndamento) {
    __salvarContaNovamentePendente = true;
    return { ok: true, adiado: true };
  }

  const ativo = lerJsonLocal("usuario_ativo", null);
  if (!ativo || !ativo.email || normalizarEmailConta(ativo.email) === "convidado" || ativo.visitante === true) {
    return { ok: false, mensagem: "Conta visitante ou não autenticada." };
  }

  __salvandoContaEmAndamento = true;
  const emailLimpo = normalizarEmailConta(ativo.email);

  try {
    const perfil = lerJsonLocal("perfil_usuario", {});
    const perfilDaConta = perfil.email && normalizarEmailConta(perfil.email) === emailLimpo && perfil.visitante !== true
      ? perfil
      : {};

    const enderecoAtual = String(ativo.endereco || perfilDaConta.endereco || "").trim();
    const telefoneAtual = String(ativo.telefone || perfilDaConta.telefone || "").trim();
    const idadeAtual = String(ativo.idade || perfilDaConta.idade || "").trim();
    const nomeAtual = String(ativo.nome || perfilDaConta.nome || "").trim();

    const patchBody = {};
    if (nomeAtual) patchBody.nome = nomeAtual;
    if (telefoneAtual) patchBody.telefone = telefoneAtual;
    if (idadeAtual) patchBody.idade = idadeAtual;
    if (enderecoAtual) patchBody.endereco = enderecoAtual;

    let userOk = true;
    let erroMsg = "";

    if (Object.keys(patchBody).length > 0) {
      const patchRes = await supabaseRequest(
        `usuarios?email=eq.${encodeURIComponent(emailLimpo)}`,
        {
          method: "PATCH",
          body: JSON.stringify(patchBody)
        }
      );
      if (!patchRes.ok) {
        userOk = false;
        erroMsg = patchRes.mensagem || "Falha ao atualizar perfil no Supabase.";
      }
    }

    const favoritos = lerJsonLocal(obterChaveFavoritosConta(emailLimpo), []);
    const carrinhoAtual = lerJsonLocal(obterChaveSacolaConta(emailLimpo), []);
    const pedidos = lerJsonLocal(obterChavePedidosConta(emailLimpo), []);

    const contaRes = await supabaseRequest("dados_conta", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify([{
        email_usuario: emailLimpo,
        favoritos,
        sacola: carrinhoAtual,
        pedidos,
        atualizado_em: new Date().toISOString()
      }])
    });

    if (!contaRes.ok) {
      return {
        ok: false,
        mensagem: contaRes.mensagem || erroMsg || "Falha ao sincronizar dados da conta no Supabase."
      };
    }

    return { ok: userOk, mensagem: erroMsg };
  } catch (err) {
    return { ok: false, mensagem: "Erro inesperado ao salvar dados da conta." };
  } finally {
    __salvandoContaEmAndamento = false;
    if (__salvarContaNovamentePendente) {
      __salvarContaNovamentePendente = false;
      salvarTudoDaContaSupabase();
    }
  }
}

window.addEventListener("storage", (e) => {
  try {
    if (!e || !e.key) return;
    const ativo = lerJsonLocal("usuario_ativo", null);
    if (!ativo || !ativo.email || normalizarEmailConta(ativo.email) === "convidado" || ativo.visitante === true) {
      return;
    }
    if (
      ["usuario_ativo", "perfil_usuario", "enderecoLoja"].includes(e.key) ||
      e.key.startsWith("enderecos_usuario_") ||
      e.key.startsWith("favoritos_") ||
      e.key.startsWith("carrinho_usuario_") ||
      e.key.startsWith("historico_pedidos_")
    ) {
      salvarTudoDaContaSupabase();
    }
  } catch (err) {
    console.warn("Erro no listener de storage:", err);
  }
});