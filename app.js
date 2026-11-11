var API = '/api/registros';
var CATEGORIAS = ['Pl\u00e1stico', 'Papel/Papel\u00e3o', 'Vidro', 'Metal', 'Org\u00e2nico'];
var VALOR_POR_NOME = {
  'Pl\u00e1stico': 'plastico',
  'Papel/Papel\u00e3o': 'papel',
  'Vidro': 'vidro',
  'Metal': 'metal',
  'Org\u00e2nico': 'organico'
};

var form = document.getElementById('formRegistro');
var campoId = document.getElementById('registroId');
var campoCategoria = document.getElementById('categoria');
var campoQuantidade = document.getElementById('quantidade');
var campoUnidade = document.getElementById('unidade');
var campoObs = document.getElementById('observacao');
var btnSalvar = document.getElementById('btnSalvar');
var btnCancelar = document.getElementById('btnCancelar');
var tituloForm = document.getElementById('tituloForm');
var mensagem = document.getElementById('mensagem');
var lista = document.getElementById('lista');
var registros = [];

function escapar(t) {
  var d = document.createElement('div');
  d.textContent = (t === null || t === undefined) ? '' : t;
  return d.innerHTML;
}
function fmtNum(n) {
  return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}
function fmtData(iso) {
  var d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
function avisar(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = tipo;
  setTimeout(function () { mensagem.textContent = ''; mensagem.className = ''; }, 3500);
}
function soma(itens, un) {
  return itens.filter(function (r) { return r.unidade === un; })
    .reduce(function (s, r) { return s + Number(r.quantidade); }, 0);
}

function carregar() {
  fetch(API)
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (dados) { registros = dados; desenhar(); })
    .catch(function () {
      lista.innerHTML = '<p class="vazio">Nao foi possivel carregar os registros. Veja o servidor.</p>';
    });
}

function desenhar() {
  document.getElementById('totalRegistros').textContent = registros.length;
  document.getElementById('totalKg').textContent = fmtNum(soma(registros, 'kg'));
  document.getElementById('totalUnidades').textContent = fmtNum(soma(registros, 'unidades'));

  document.getElementById('porCategoria').innerHTML = CATEGORIAS.map(function (cat) {
    var itens = registros.filter(function (r) { return r.categoria === cat; });
    return '<div class="cat"><strong>' + cat + '</strong><small>' +
      fmtNum(soma(itens, 'kg')) + ' kg · ' + fmtNum(soma(itens, 'unidades')) + ' un · ' +
      itens.length + ' reg.</small></div>';
  }).join('');

  if (!registros.length) {
    lista.innerHTML = '<p class="vazio">Nenhum descarte cadastrado ainda.</p>';
    return;
  }
  lista.innerHTML = registros.map(function (r) {
    return '<div class="item">' +
      '<div class="info"><strong>' + escapar(r.categoria) + '</strong>' +
      '<div>' + fmtData(r.data_registro) + (r.observacao ? ' · ' + escapar(r.observacao) : '') + '</div></div>' +
      '<div class="qtd">' + fmtNum(r.quantidade) + ' ' + escapar(r.unidade) + '</div>' +
      '<div class="acoes">' +
      '<button type="button" class="btn azul" onclick="editar(' + r.id + ')">Editar</button>' +
      '<button type="button" class="btn vermelho" onclick="excluir(' + r.id + ')">Excluir</button>' +
      '</div></div>';
  }).join('');
}

function editar(id) {
  var r = registros.filter(function (x) { return Number(x.id) === Number(id); })[0];
  if (!r) return;
  campoId.value = r.id;
  campoCategoria.value = VALOR_POR_NOME[r.categoria] || '';
  campoQuantidade.value = r.quantidade;
  campoUnidade.value = r.unidade;
  campoObs.value = r.observacao || '';
  tituloForm.textContent = 'Editando registro #' + r.id;
  btnSalvar.textContent = 'Salvar alterações';
  btnCancelar.hidden = false;
  form.scrollIntoView({ behavior: 'smooth' });
}

function sairDaEdicao() {
  form.reset();
  campoId.value = '';
  tituloForm.textContent = 'Novo descarte';
  btnSalvar.textContent = 'Cadastrar';
  btnCancelar.hidden = true;
}

function excluir(id) {
  if (!confirm('Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.')) return;
  fetch(API + '/' + id, { method: 'DELETE' }).then(function (r) {
    if (!r.ok) return avisar('Erro ao excluir.', 'erro');
    if (campoId.value && Number(campoId.value) === Number(id)) sairDaEdicao();
    avisar('Registro excluído.', 'ok');
    carregar();
  });
}

form.addEventListener('submit', function (e) {
  e.preventDefault();
  var dados = {
    categoria: campoCategoria.value,
    quantidade: Number(campoQuantidade.value),
    unidade: campoUnidade.value,
    observacao: campoObs.value.trim()
  };
  if (!dados.categoria || !(dados.quantidade > 0)) {
    return avisar('Preencha a categoria e uma quantidade maior que zero.', 'erro');
  }
  var editando = campoId.value !== '';
  fetch(editando ? API + '/' + campoId.value : API, {
    method: editando ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  }).then(function (r) {
    if (r.ok) {
      avisar(editando ? 'Registro atualizado!' : 'Descarte cadastrado!', 'ok');
      sairDaEdicao();
      carregar();
    } else {
      r.json().then(function (j) { avisar(j.erro || 'Erro ao salvar.', 'erro'); })
        .catch(function () { avisar('Erro ao salvar.', 'erro'); });
    }
  });
});

btnCancelar.addEventListener('click', sairDaEdicao);
carregar();