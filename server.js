require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const CATEGORIAS = ['Pl\u00e1stico', 'Papel/Papel\u00e3o', 'Vidro', 'Metal', 'Org\u00e2nico'];

const semAcento = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

const MAPA_CAT = {
  'plastico': CATEGORIAS[0],
  'papel/papelao': CATEGORIAS[1],
  'papel': CATEGORIAS[1],
  'papelao': CATEGORIAS[1],
  'vidro': CATEGORIAS[2],
  'metal': CATEGORIAS[3],
  'organico': CATEGORIAS[4]
};
const MAPA_UN = { 'kg': 'kg', 'unidades': 'unidades', 'unidade': 'unidades', 'un': 'unidades' };

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function validar(b) {
  const cat = MAPA_CAT[semAcento(b.categoria)];
  const un = MAPA_UN[semAcento(b.unidade)];
  const q = Number(b.quantidade);
  if (!cat) {
    console.log('Categoria recebida:', JSON.stringify(b.categoria));
    return 'Categoria invalida.';
  }
  if (!un) return 'Unidade invalida.';
  if (!Number.isFinite(q) || q <= 0) return 'Quantidade deve ser maior que zero.';
  b.categoria = cat;
  b.unidade = un;
  return null;
}

app.get('/api/registros', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM registros ORDER BY data_registro DESC, id DESC');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao consultar o banco.' });
  }
});

app.post('/api/registros', async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  try {
    const { categoria, quantidade, unidade, observacao } = req.body;
    const [r] = await db.query(
      'INSERT INTO registros (categoria, quantidade, unidade, observacao) VALUES (?, ?, ?, ?)',
      [categoria, Number(quantidade), unidade, (observacao || '').trim()]
    );
    const [rows] = await db.query('SELECT * FROM registros WHERE id = ?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao gravar no banco.' });
  }
});

app.put('/api/registros/:id', async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  try {
    const { categoria, quantidade, unidade, observacao } = req.body;
    const [r] = await db.query(
      'UPDATE registros SET categoria=?, quantidade=?, unidade=?, observacao=? WHERE id=?',
      [categoria, Number(quantidade), unidade, (observacao || '').trim(), req.params.id]
    );
    if (r.affectedRows === 0) return res.status(404).json({ erro: 'Registro nao encontrado.' });
    const [rows] = await db.query('SELECT * FROM registros WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao atualizar no banco.' });
  }
});

app.delete('/api/registros/:id', async (req, res) => {
  try {
    const [r] = await db.query('DELETE FROM registros WHERE id = ?', [req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ erro: 'Registro nao encontrado.' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao excluir no banco.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('SmartTrash + MySQL em http://localhost:' + PORT);
});