// produtos.js - Catálogo centralizado e compartilhado entre index.html, admin.html e sacola.html

const CHAVE_CATALOGO = "catalogo_sabor_casa";
const CHAVE_SACOLA = "sacola_itens";

const produtosPadrao20 = [
  {
    id: 1001,
    nome: "Pão de Queijo Mineiro Tradicional",
    categoria: "salgados",
    sub: "Salgados",
    imagem: "https://cdn1.matadornetwork.com/blogs/1/2014/07/Pao-de-queijo-traditional-snack-from-Brazil-560x420.jpg",
    preco: 24.90,
    descricao: "Pão de queijo mineiro tradicional, com queijo meia-cura e casquinha dourada. Pacote com 20 unidades."
  },
  {
    id: 1002,
    nome: "Bauru Clássico no Pão Francês",
    categoria: "sanduiches",
    sub: "Sanduíches",
    imagem: "https://cdn.tasteatlas.com/images/dishrestaurants/69a13a35d2404f998b246dc2d605ef33.jpg?height=513&width=800",
    preco: 19.90,
    descricao: "Pão francês recheado com roast beef, combinação de queijos, tomate e pepino em conserva."
  },
  {
    id: 1003,
    nome: "Tapioca com Queijo Coalho e Presunto",
    categoria: "tapiocas",
    sub: "Tapiocas",
    imagem: "https://www.arise-app.com/images/dishes/pt/tapioca-com-queijo-e-presunto-122vce.webp",
    preco: 14.90,
    descricao: "Tapioca preparada na hora, recheada com queijo coalho e presunto."
  },
  {
    id: 1004,
    nome: "Coxinha de Frango com Catupiry",
    categoria: "salgados-fritos",
    sub: "Salgados Fritos",
    imagem: "https://newr7-r7-prod.web.arc-cdn.net/resizer/v2/J3DMTSMSVVN77DQQO2JIATOHPU.jpg?auth=bd523a36b8d23958edb9e2d5a4d57e9cde5a2eaf53122e93152f9ee4b91ebf18&height=667&width=1000",
    preco: 42.90,
    descricao: "Coxinhas douradas, com recheio de frango temperado e catupiry. Caixa com 15 unidades."
  },
  {
    id: 1005,
    nome: "Crepioca de Frango Desfiado",
    categoria: "fitness",
    sub: "Fitness",
    imagem: "https://www.arise-app.com/images/dishes/pt/crepioca-de-frango-com-chia-5722sg.webp",
    preco: 16.90,
    descricao: "Crepioca macia recheada com frango desfiado e requeijão."
  },
  {
    id: 1006,
    nome: "Empadão de Frango Cremoso",
    categoria: "salgados-assados",
    sub: "Salgados Assados",
    imagem: "https://static.itdg.com.br/images/1200-675/88b9214692428e29e9e69089e8395bb2/editorial-a-2025-12-19t165642.704.png",
    preco: 59.90,
    descricao: "Empadão de massa amanteigada com recheio cremoso de frango. Serve até 8 porções."
  },
  {
    id: 1007,
    nome: "Misto Quente Especial na Frigideira",
    categoria: "sanduiches",
    sub: "Sanduíches",
    imagem: "https://snapcalorie-webflow-website.s3.us-east-2.amazonaws.com/media/food_pics_v2/medium/misto_quente.jpg",
    preco: 14.90,
    descricao: "Pão tostado na frigideira, com presunto e queijo muçarela derretido."
  },
  {
    id: 1008,
    nome: "Enroladinho de Salsicha Assado",
    categoria: "salgados-assados",
    sub: "Salgados Assados",
    imagem: "https://snapcalorie-webflow-website.s3.us-east-2.amazonaws.com/media/food_pics_v2/medium/enroladinho_de_salsicha.jpg",
    preco: 26.90,
    descricao: "Massa assada e douradinha envolvendo salsicha. Caixa com 10 unidades."
  },
  {
    id: 1009,
    nome: "Club Sandwich Tradicional",
    categoria: "sanduiches",
    sub: "Sanduíches",
    imagem: "https://cdn.shopify.com/s/files/1/0851/3955/4638/files/Classic_triple-decker_Club_Sandwich_sliced_and_served_with_pickles.webp?v=1749719424",
    preco: 24.90,
    descricao: "Sanduíche em camadas com pão tostado, peito de peru, queijo, bacon, tomate e alface."
  },
  {
    id: 1010,
    nome: "Pastel de Feira de Carne Moída",
    categoria: "salgados-fritos",
    sub: "Salgados Fritos",
    imagem: "https://newr7-r7-prod.web.arc-cdn.net/resizer/v2/BPOP2ZWGIVBLRFA4NJX72UDITQ.jpeg?auth=3974a0e100f4b0296df87b7496ea4473cece3395ab0c617178fb53b229635582&height=1000&width=1500",
    preco: 39.90,
    descricao: "Pastéis crocantes recheados com carne moída temperada. Caixa com 10 unidades."
  },
  {
    id: 1011,
    nome: "Esfiha Aberta de Queijo (Estilo Habib's)",
    categoria: "salgados-assados",
    sub: "Salgados Assados",
    imagem: "https://jpimg.com.br/uploads/2018/08/esfiha-aberta-do-Habib%E2%80%99s-1.jpg",
    preco: 34.90,
    descricao: "Esfihas abertas com massa macia e recheio de queijo temperado. Caixa com 12 unidades."
  },
  {
    id: 1012,
    nome: "Panqueca Americana com Mel e Frutas",
    categoria: "doces",
    sub: "Doces",
    imagem: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=600",
    preco: 22.90,
    descricao: "Panquecas americanas fofinhas, servidas com mel e frutas. Porção com 4 unidades."
  },
  {
    id: 1013,
    nome: "Muffin Salgado de Legumes e Queijo",
    categoria: "fitness",
    sub: "Fitness",
    imagem: "https://cucinaricetta.com/assets/images/1770237543134-vduvkmbh.jpg",
    preco: 21.90,
    descricao: "Muffins salgados assados com legumes e queijo. Caixa com 6 unidades."
  },
  {
    id: 1014,
    nome: "Croissant de Presunto e Queijo",
    categoria: "salgados-assados",
    sub: "Salgados Assados",
    imagem: "https://p2.trrsf.com/image/fget/cf/1200/900/middle/images.terra.com/2023/11/07/553376496-croissant-tradicional-de-presunto-e-queijo.jpg",
    preco: 36.90,
    descricao: "Croissants folhados e dourados, recheados com presunto e queijo. Caixa com 8 unidades."
  },
  {
    id: 1015,
    nome: "Bruschetta Clássica de Tomate e Manjericão",
    categoria: "leves",
    sub: "Leves",
    imagem: "https://www.amando.it/media/2025/07/bruschette-veloci.jpg",
    preco: 22.90,
    descricao: "Fatias de pão italiano tostado com tomate temperado, azeite e manjericão. Porção com 4 unidades."
  },
  {
    id: 1016,
    nome: "Guacamole com Nachos de Tortilla",
    categoria: "petiscos",
    sub: "Petiscos",
    imagem: "https://uploads.leouve.com.br/2024/10/4pQ2cjqY-Firefly-Guacamole-com-alguns-Nachos-57375-jpg.webp",
    preco: 28.90,
    descricao: "Guacamole cremoso de abacate acompanhado de nachos de tortilla. Porção para compartilhar."
  },
  {
    id: 1017,
    nome: "Biscoito de Polvilho Assado",
    categoria: "crocantes",
    sub: "Crocantes",
    imagem: "https://images.cooknenjoy.com/uploads/2017/01/biscoito-de-polvilho-02.jpg",
    preco: 17.90,
    descricao: "Biscoitos de polvilho leves e crocantes, assados. Pacote com 30 unidades."
  },
  {
    id: 1018,
    nome: "Sanduíche Natural de Frango com Cenoura",
    categoria: "sanduiches-frios",
    sub: "Sanduíches Frios",
    imagem: "https://www.arise-app.com/images/dishes/pt/sanduiche-de-pao-integral-com-frango-e-salada-yawc2k.webp",
    preco: 19.90,
    descricao: "Sanduíche frio de pão integral com frango desfiado, cenoura e folhas de alface."
  },
  {
    id: 1019,
    nome: "Bolinho de Chuva com Açúcar e Canela",
    categoria: "doces",
    sub: "Doces",
    imagem: "https://p2.trrsf.com/image/fget/cf/1200/900/middle/images.terra.com/2025/03/02/2023512577-bolinhodechuvatradicional.jpg",
    preco: 18.90,
    descricao: "Bolinho de chuva fofinho, finalizado com açúcar e canela. Porção com 4 unidades."
  },
  {
    id: 1020,
    nome: "Hambúrguer Artesanal com Queijo Cheddar",
    categoria: "sanduiches",
    sub: "Sanduíches",
    imagem: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600",
    preco: 27.90,
    descricao: "Hambúrguer artesanal com queijo cheddar, servido em pão tipo brioche."
  }
];

// Mantém referência global compatível com o nome anterior
let bancoDeProdutos = [];

function inicializarCatalogo() {
  const salvo = localStorage.getItem(CHAVE_CATALOGO);
  if (!salvo) {
    localStorage.setItem(CHAVE_CATALOGO, JSON.stringify(produtosPadrao20));
    bancoDeProdutos = [...produtosPadrao20];
  } else {
    try {
      const parsed = JSON.parse(salvo);
      bancoDeProdutos = Array.isArray(parsed) && parsed.length > 0 ? parsed : [...produtosPadrao20];
    } catch {
      bancoDeProdutos = [...produtosPadrao20];
    }
  }
  return bancoDeProdutos;
}

function obterCatalogo() {
  return inicializarCatalogo();
}

function salvarCatalogo(lista) {
  bancoDeProdutos = lista;
  localStorage.setItem(CHAVE_CATALOGO, JSON.stringify(lista));
  window.dispatchEvent(new CustomEvent("catalogoAtualizado", { detail: lista }));
}

function restaurarCatalogoPadrao() {
  salvarCatalogo([...produtosPadrao20]);
  return bancoDeProdutos;
}

function adicionarProdutoCatalogo(novoProduto) {
  const lista = obterCatalogo();
  const maiorId = lista.reduce((max, item) => Math.max(max, Number(item.id) || 1000), 1000);
  const itemCompleto = {
    id: novoProduto.id || maiorId + 1,
    nome: novoProduto.nome.trim(),
    categoria: novoProduto.categoria || "lanches",
    sub: novoProduto.sub.trim(),
    imagem: novoProduto.imagem.trim(),
    preco: Number(novoProduto.preco) || 0,
    descricao: novoProduto.descricao.trim()
  };
  lista.push(itemCompleto);
  salvarCatalogo(lista);
  return itemCompleto;
}

function editarProdutoCatalogo(id, dadosAtualizados) {
  const lista = obterCatalogo().map((item) => {
    if (Number(item.id) === Number(id)) {
      return {
        ...item,
        ...dadosAtualizados,
        preco: Number(dadosAtualizados.preco ?? item.preco)
      };
    }
    return item;
  });
  salvarCatalogo(lista);
  return lista;
}

function removerProdutoCatalogo(id) {
  const lista = obterCatalogo().filter((item) => Number(item.id) !== Number(id));
  salvarCatalogo(lista);
  return lista;
}

// --- FUNÇÕES DA SACOLA COMPARTILHADA ---
function obterSacola() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_SACOLA)) || [];
  } catch {
    return [];
  }
}

function salvarSacola(itens) {
  localStorage.setItem(CHAVE_SACOLA, JSON.stringify(itens));
  window.dispatchEvent(new CustomEvent("sacolaAtualizada", { detail: itens }));
}

function adicionarNaSacola(idProduto, quantidade = 1) {
  const catalogo = obterCatalogo();
  const produto = catalogo.find((p) => Number(p.id) === Number(idProduto));
  if (!produto) return null;

  const sacola = obterSacola();
  const existente = sacola.find((item) => Number(item.id) === Number(produto.id));

  if (existente) {
    existente.quantidade = (existente.quantidade || 1) + quantidade;
    existente.nome = produto.nome;
    existente.preco = produto.preco;
    existente.imagem = produto.imagem;
    existente.sub = produto.sub;
  } else {
    sacola.push({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      imagem: produto.imagem,
      sub: produto.sub,
      quantidade
    });
  }

  salvarSacola(sacola);
  return sacola;
}

function alterarQuantidadeSacola(idProduto, delta) {
  const sacola = obterSacola()
    .map((item) => {
      if (Number(item.id) === Number(idProduto)) {
        return { ...item, quantidade: (item.quantidade || 1) + delta };
      }
      return item;
    })
    .filter((item) => item.quantidade > 0);

  salvarSacola(sacola);
  return sacola;
}

function removerItemSacola(idProduto) {
  const sacola = obterSacola().filter((item) => Number(item.id) !== Number(idProduto));
  salvarSacola(sacola);
  return sacola;
}

function limparSacola() {
  salvarSacola([]);
}

const formatarPreco = (preco) =>
  Number(preco || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

// Inicializa automaticamente ao carregar o script
inicializarCatalogo();