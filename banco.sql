CREATE DATABASE IF NOT EXISTS sabor_e_brasa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sabor_e_brasa;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  telefone VARCHAR(25) DEFAULT NULL,
  idade VARCHAR(5) DEFAULT NULL,
  endereco VARCHAR(255) DEFAULT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  tipo ENUM('cliente', 'admin') DEFAULT 'cliente',
  codigo_recuperacao VARCHAR(6) DEFAULT NULL,
  codigo_expira_em DATETIME DEFAULT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);