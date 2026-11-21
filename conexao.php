<?php
$host = 'localhost';
$db   = 'sabor_e_brasa';
$user = 'root';      // No XAMPP/Laragon padrão costuma ser 'root'
$pass = '';          // No XAMPP/Laragon padrão costuma ser vazio ''

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'mensagem' => 'Erro ao conectar no banco de dados.']);
    exit;
}