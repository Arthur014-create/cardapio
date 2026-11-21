<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once 'conexao.php';

$dados = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$acao  = $dados['acao'] ?? '';

/* =========================================================
   1. CADASTRAR NOVO USUÁRIO NO BANCO
========================================================= */
if ($acao === 'cadastrar') {
    $nome  = trim($dados['nome'] ?? '');
    $email = strtolower(trim($dados['email'] ?? ''));
    $senha = $dados['senha'] ?? '';
    $tipo  = ($dados['tipo'] ?? 'cliente') === 'admin' ? 'admin' : 'cliente';

    if (!$nome || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($senha) < 4) {
        echo json_encode(['ok' => false, 'mensagem' => 'Preencha nome, e-mail válido e senha (mínimo 4 caracteres).']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['ok' => false, 'mensagem' => 'Este e-mail já está cadastrado.']);
        exit;
    }

    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
    $insert = $pdo->prepare("INSERT INTO usuarios (nome, email, senha_hash, tipo) VALUES (?, ?, ?, ?)");
    $insert->execute([$nome, $email, $senhaHash, $tipo]);

    $usuario = [
        'id'    => $pdo->lastInsertId(),
        'nome'  => $nome,
        'email' => $email,
        'tipo'  => $tipo
    ];
    $_SESSION['usuario'] = $usuario;

    echo json_encode(['ok' => true, 'mensagem' => 'Conta criada com sucesso!', 'usuario' => $usuario]);
    exit;
}

/* =========================================================
   2. ENTRAR (LOGIN)
========================================================= */
if ($acao === 'login') {
    $email = strtolower(trim($dados['email'] ?? ''));
    $senha = $dados['senha'] ?? '';

    $stmt = $pdo->prepare("SELECT id, nome, email, telefone, idade, endereco, senha_hash, tipo FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($senha, $user['senha_hash'])) {
        echo json_encode(['ok' => false, 'mensagem' => 'E-mail ou senha incorretos.']);
        exit;
    }

    $usuarioSessao = [
        'id'       => $user['id'],
        'nome'     => $user['nome'],
        'email'    => $user['email'],
        'telefone' => $user['telefone'] ?? '',
        'idade'    => $user['idade'] ?? '',
        'endereco' => $user['endereco'] ?? '',
        'tipo'     => $user['tipo']
    ];
    $_SESSION['usuario'] = $usuarioSessao;

    echo json_encode(['ok' => true, 'mensagem' => 'Login realizado!', 'usuario' => $usuarioSessao]);
    exit;
}

/* =========================================================
   3. ENVIAR CÓDIGO DE RECUPERAÇÃO PARA O E-MAIL
========================================================= */
if ($acao === 'enviar_codigo') {
    $email = strtolower(trim($dados['email'] ?? ''));

    $stmt = $pdo->prepare("SELECT id, nome FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode(['ok' => false, 'mensagem' => 'Nenhum cadastro encontrado com esse e-mail.']);
        exit;
    }

    // Gera código de 6 dígitos válido por 15 minutos
    $codigo = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $expira = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    $upd = $pdo->prepare("UPDATE usuarios SET codigo_recuperacao = ?, codigo_expira_em = ? WHERE id = ?");
    $upd->execute([$codigo, $expira, $user['id']]);

    // Envio do e-mail (requer servidor SMTP configurado no php.ini ou PHPMailer)
    $assunto   = "Codigo de recuperacao - Sabor & Brasa";
    $mensagem  = "Olá, {$user['nome']}!\n\nSeu código para redefinir a senha é: {$codigo}\nEle expira em 15 minutos.";
    $cabecalho = "From: no-reply@saborebrasa.com\r\nContent-Type: text/plain; charset=UTF-8\r\n";

    $enviado = @mail($email, $assunto, $mensagem, $cabecalho);

    echo json_encode([
        'ok' => true,
        'mensagem' => $enviado
            ? 'Código enviado para o seu e-mail! Verifique sua caixa de entrada ou spam.'
            : 'Código gerado no banco! (Configure SMTP no servidor para envio externo).',
        // Remova 'codigo_teste' quando colocar em produção com SMTP ativo
        'codigo_teste' => $enviado ? null : $codigo
    ]);
    exit;
}

/* =========================================================
   4. VALIDAR CÓDIGO E SALVAR NOVA SENHA
========================================================= */
if ($acao === 'redefinir_senha') {
    $email     = strtolower(trim($dados['email'] ?? ''));
    $codigo    = trim($dados['codigo'] ?? '');
    $novaSenha = $dados['nova_senha'] ?? '';

    if (strlen($novaSenha) < 4) {
        echo json_encode(['ok' => false, 'mensagem' => 'A nova senha precisa ter pelo menos 4 caracteres.']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id, codigo_recuperacao, codigo_expira_em FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || $user['codigo_recuperacao'] !== $codigo) {
        echo json_encode(['ok' => false, 'mensagem' => 'Código inválido.']);
        exit;
    }

    if (strtotime($user['codigo_expira_em']) < time()) {
        echo json_encode(['ok' => false, 'mensagem' => 'Este código expirou. Solicite um novo.']);
        exit;
    }

    $novoHash = password_hash($novaSenha, PASSWORD_DEFAULT);
    $upd = $pdo->prepare("UPDATE usuarios SET senha_hash = ?, codigo_recuperacao = NULL, codigo_expira_em = NULL WHERE id = ?");
    $upd->execute([$novoHash, $user['id']]);

    echo json_encode(['ok' => true, 'mensagem' => 'Senha alterada com sucesso! Já pode entrar.']);
    exit;
}
/* =========================================================
   FUNÇÕES DE VALIDAÇÃO DE E-MAIL, TELEFONE E ENDEREÇO
========================================================= */
function emailDominioExiste(string $email): bool {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }
    $dominio = substr(strrchr($email, "@"), 1);
    if (!$dominio) {
        return false;
    }
    // Verifica se o domínio tem registro MX (servidor de e-mail) ou registro A ativo
    return checkdnsrr($dominio, "MX") || checkdnsrr($dominio, "A");
}

function telefoneBrasileiroValido(string $telefone): bool {
    $digitos = preg_replace('/\D/', '', $telefone);
    if (strlen($digitos) === 13 && str_starts_with($digitos, '55')) {
        $digitos = substr($digitos, 2);
    }
    // Precisa ter 10 (fixo) ou 11 (celular) dígitos
    if (!in_array(strlen($digitos), [10, 11], true)) {
        return false;
    }
    // Bloqueia sequências repetidas como 11111111111 ou 99999999999
    if (preg_match('/^(\d)\1+$/', $digitos)) {
        return false;
    }
    // DDD válido no Brasil (11 a 99)
    $ddd = (int) substr($digitos, 0, 2);
    if ($ddd < 11 || $ddd > 99) {
        return false;
    }
    // Celular de 11 dígitos deve começar com 9 após o DDD
    if (strlen($digitos) === 11 && $digitos[2] !== '9') {
        return false;
    }
    return true;
}

/* =========================================================
   1. CADASTRAR NOVO USUÁRIO COM VERIFICAÇÃO DE DADOS REAIS
========================================================= */
if ($acao === 'cadastrar') {
    $nome     = trim($dados['nome'] ?? '');
    $email    = strtolower(trim($dados['email'] ?? ''));
    $telefone = trim($dados['telefone'] ?? '');
    $idade    = trim($dados['idade'] ?? '');
    $endereco = trim($dados['endereco'] ?? '');
    $senha    = $dados['senha'] ?? '';
    $tipo     = ($dados['tipo'] ?? 'cliente') === 'admin' ? 'admin' : 'cliente';

    if (strlen($nome) < 3) {
        echo json_encode(['ok' => false, 'mensagem' => 'Informe seu nome completo.']);
        exit;
    }

    if (!emailDominioExiste($email)) {
        echo json_encode(['ok' => false, 'mensagem' => 'Este e-mail não parece existir ou o domínio é inválido. Confira o endereço digitado.']);
        exit;
    }

    if (!telefoneBrasileiroValido($telefone)) {
        echo json_encode(['ok' => false, 'mensagem' => 'Telefone inválido! Informe DDD + número existente (ex: (67) 99999-9999).']);
        exit;
    }

    if (strlen($endereco) < 8) {
        echo json_encode(['ok' => false, 'mensagem' => 'Informe um endereço completo existente (Rua, Número e Bairro).']);
        exit;
    }

    if (strlen($senha) < 4) {
        echo json_encode(['ok' => false, 'mensagem' => 'A senha precisa ter pelo menos 4 caracteres.']);
        exit;
    }

    // Verifica duplicidade de e-mail ou telefone no banco
    $stmt = $pdo->prepare("SELECT id, email, telefone FROM usuarios WHERE email = ? OR telefone = ?");
    $stmt->execute([$email, $telefone]);
    $existente = $stmt->fetch();

    if ($existente) {
        $msg = $existente['email'] === $email
            ? 'Este e-mail já está cadastrado!'
            : 'Este número de telefone já está vinculado a outra conta!';
        echo json_encode(['ok' => false, 'mensagem' => $msg]);
        exit;
    }

    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
    $insert = $pdo->prepare("INSERT INTO usuarios (nome, email, telefone, idade, endereco, senha_hash, tipo) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $insert->execute([$nome, $email, $telefone, $idade, $endereco, $senhaHash, $tipo]);

    $usuario = [
        'id'       => $pdo->lastInsertId(),
        'nome'     => $nome,
        'email'    => $email,
        'telefone' => $telefone,
        'idade'    => $idade,
        'endereco' => $endereco,
        'tipo'     => $tipo
    ];
    $_SESSION['usuario'] = $usuario;

    echo json_encode(['ok' => true, 'mensagem' => 'Conta criada com sucesso!', 'usuario' => $usuario]);
    exit;
}

echo json_encode(['ok' => false, 'mensagem' => 'Ação inválida.']);