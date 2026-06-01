// app.js — carregado via <script type="module">
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL     = 'https://anrhurtohxpngtdlhtup.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFucmh1cnRvaHhwbmd0ZGxodHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDM1MzMsImV4cCI6MjA5NTkxOTUzM30.Hx-QRYQDkFeeAjFpns2Ito9YwkHJtCeDyLBDXL7zDkU'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// expõe funções para o HTML (onclick)
window._app = {}

// ── DADOS FIXOS ──────────────────────────────────────────────
const RENDA = 22554.93

const CATS = [
  { id: 'gas',  icon: 'ti ti-gas-station',    label: 'Gasolina',       limite: 2000, color: '#378ADD' },
  { id: 'merc', icon: 'ti ti-shopping-cart',   label: 'Mercado/Casa',   limite: 2500, color: '#1D9E75' },
  { id: 'rua',  icon: 'ti ti-tools-kitchen-2', label: 'Lanche na rua',  limite: 1000, color: '#EF9F27' },
  { id: 'farm', icon: 'ti ti-pill',            label: 'Farmácia',       limite: 500,  color: '#D4537E' },
  { id: 'shop', icon: 'ti ti-shopping-bag',    label: 'Shopee/Compras', limite: 600,  color: '#7F77DD' },
  { id: 'out',  icon: 'ti ti-dots',            label: 'Outros',         limite: 800,  color: '#888780' },
]

const GRUPOS = [
  {
    id: 'casa', titulo: 'Contas da Casa', icon: 'ti ti-home', color: '#378ADD',
    boletos: [
      { id: 'agua',     nome: 'Água',     valor: 180.00, venc: 10 },
      { id: 'energia',  nome: 'Energia',  valor: 380.00, venc: 15 },
      { id: 'internet', nome: 'Internet', valor: 120.00, venc: 20 },
      { id: 'celular',  nome: 'Celular',  valor: 375.00, venc: 5  },
    ]
  },
  {
    id: 'pessoas', titulo: 'Pessoas & Saúde', icon: 'ti ti-users', color: '#D4537E',
    boletos: [
      { id: 'unimed',  nome: 'Unimed',        valor: 980.00, venc: 8  },
      { id: 'odonto',  nome: 'Odonto',         valor: 180.00, venc: 8  },
      { id: 'seguro',  nome: 'Seguro',         valor: 420.00, venc: 12 },
      { id: 'arena',   nome: 'Arena (escola)', valor: 890.00, venc: 10 },
      { id: 'facul',   nome: 'Faculdade',      valor: 428.00, venc: 20 },
      { id: 'brodim',  nome: 'Brodim',         valor: 150.00, venc: 25 },
    ]
  },
  {
    id: 'fixos', titulo: 'Fixos do Mês', icon: 'ti ti-lock', color: '#7F77DD',
    boletos: [
      { id: 'casa_fin', nome: 'Financiamento Casa (Caixa)', valor: 4160.00, venc: 5  },
      { id: 'imposto',  nome: 'Imposto PJ',                  valor: 1500.00, venc: 20 },
      { id: 'dizimo',   nome: 'Dízimo Igreja (10%)',          valor: 2255.49, venc: 1  },
      { id: 'emprest',  nome: 'Parcela Empréstimo',           valor: 2550.00, venc: 10 },
    ]
  },
]

const TODOS_BOLETOS = GRUPOS.flatMap(g => g.boletos)
const LIMITE_VAR    = CATS.reduce((a, b) => a + b.limite, 0)

// ── ESTADO ───────────────────────────────────────────────────
let gastos          = []
let boletosPagos    = []
let gruposCollapsed = {}
let pessoaSel       = null
let catSel          = null
let histFiltro      = 'todos'

// ── UTILS ────────────────────────────────────────────────────
const fmt = v => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const mesFinanceiro = () => {
  const d   = new Date()
  const dia = d.getDate()
  const ref = dia < 10 ? new Date(d.getFullYear(), d.getMonth() - 1, 1) : d
  return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`
}

const mesAtual = mesFinanceiro

const mesLabel = () => {
  const [ano, mes] = mesFinanceiro().split('-')
  const ref   = new Date(Number(ano), Number(mes) - 1, 10)
  const label = ref.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1) + ' (dia 10→9)'
}

function toast(msg) {
  const el = document.getElementById('toast')
  el.textContent = msg
  el.classList.add('show')
  setTimeout(() => el.classList.remove('show'), 2500)
}

function hideLoading() {
  const el = document.getElementById('loading')
  if (!el) return
  el.classList.add('hide')
  setTimeout(() => el.remove(), 400)
}

// ── SUPABASE — GASTOS ─────────────────────────────────────────
async function carregarGastos() {
  try {
    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .eq('mes', mesAtual())
      .order('created_at', { ascending: true })
    if (error) throw error
    gastos = data || []
  } catch (e) {
    console.warn('Supabase offline, usando localStorage', e)
    gastos = JSON.parse(localStorage.getItem('gastos_v3') || '[]')
      .filter(g => g.mes === mesAtual())
  }
}

async function salvarGasto(novo) {
  gastos.push(novo)
  localStorage.setItem('gastos_v3', JSON.stringify(gastos))
  renderAll()
  try {
    const { error } = await supabase.from('gastos').insert([novo])
    if (error) throw error
  } catch (e) {
    console.warn('Erro ao salvar no Supabase', e)
    toast('⚠️ Salvo só localmente (sem internet)')
  }
}

async function deletarGasto(id) {
  gastos = gastos.filter(g => g.id !== id)
  localStorage.setItem('gastos_v3', JSON.stringify(gastos))
  renderAll()
  try { await supabase.from('gastos').delete().eq('id', id) } catch {}
}
window.deletarGasto = deletarGasto

// ── SUPABASE — BOLETOS ────────────────────────────────────────
async function carregarBoletos() {
  try {
    const { data, error } = await supabase
      .from('boletos_pagos')
      .select('boleto_id')
      .eq('mes', mesAtual())
    if (error) throw error
    boletosPagos = (data || []).map(r => r.boleto_id)
  } catch {
    boletosPagos = JSON.parse(localStorage.getItem('boletosPagos_v3') || '[]')
  }
}

async function toggleBoleto(id) {
  const idx  = boletosPagos.indexOf(id)
  const pago = idx >= 0
  if (pago) {
    boletosPagos.splice(idx, 1)
    try { await supabase.from('boletos_pagos').delete().eq('boleto_id', id).eq('mes', mesAtual()) } catch {}
  } else {
    boletosPagos.push(id)
    try { await supabase.from('boletos_pagos').insert([{ boleto_id: id, mes: mesAtual() }]) } catch {}
  }
  localStorage.setItem('boletosPagos_v3', JSON.stringify(boletosPagos))
  renderFixos()
  renderDash()
}
window.toggleBoleto = toggleBoleto

async function toggleGrupo(id) {
  gruposCollapsed[id] = !gruposCollapsed[id]
  localStorage.setItem('gruposCollapsed', JSON.stringify(gruposCollapsed))
  renderFixos()
}
window.toggleGrupo = toggleGrupo

// ── NAVEGAÇÃO ─────────────────────────────────────────────────
function goPage(p) {
  document.querySelectorAll('.page').forEach(e => e.classList.remove('active'))
  document.querySelectorAll('.nav-btn').forEach(e => e.classList.remove('active'))
  document.getElementById('page-' + p).classList.add('active')
  const idx = ['dash', 'lancar', 'fixos', 'historico'].indexOf(p)
  document.querySelectorAll('.nav-btn')[idx].classList.add('active')
  if (p === 'dash')      renderDash()
  if (p === 'fixos')     renderFixos()
  if (p === 'historico') renderHist()
  if (p === 'lancar')    renderLancar()
}
window.goPage = goPage

// ── LANÇAR ────────────────────────────────────────────────────
function selPessoa(p) {
  pessoaSel = pessoaSel === p ? null : p
  renderLancar()
}
window.selPessoa = selPessoa

function selCat(id) {
  catSel = catSel === id ? null : id
  renderCatGrid()
  showAlerta()
  atualizarBotao()
}
window.selCat = selCat

function atualizarBotao() {
  const btn = document.getElementById('btn-lancar')
  if (!btn) return
  const pronto = pessoaSel && catSel
  btn.className = 'btn-primary ' + (pronto
    ? (pessoaSel === 'fred' ? 'btn-fred' : 'btn-mya')
    : 'btn-disabled')
}

function renderLancar() {
  ;['fred', 'mya'].forEach(p => {
    const b = document.getElementById('pbtn-' + p)
    if (b) b.classList.toggle('active', pessoaSel === p)
    const g = gastos.filter(x => x.pessoa === p).reduce((a, b) => a + b.valor, 0)
    const el = document.getElementById('pgasto-' + p)
    if (el) el.textContent = fmt(g)
  })
  const inp = document.getElementById('inp-valor')
  if (inp) inp.className = 'valor-input' + (pessoaSel ? ' ' + pessoaSel : '')
  renderCatGrid()
  showAlerta()
  atualizarBotao()
}

function renderCatGrid() {
  const g = document.getElementById('cat-grid')
  if (!g) return
  g.innerHTML = ''
  CATS.forEach(c => {
    const gt  = gastos.filter(x => x.cat === c.id).reduce((a, b) => a + b.valor, 0)
    const pct = Math.min(100, Math.round(gt / c.limite * 100))
    const sel = catSel === c.id
    const div = document.createElement('div')
    div.className = 'cat-btn' + (sel ? ' sel-' + (pessoaSel || 'fred') : '')
    div.innerHTML = `
      <div class="cat-icon"><i class="${c.icon}" style="font-size:22px;color:${c.color}"></i></div>
      <div class="cat-name">${c.label}</div>
      <div class="cat-pct">${pct}% usado</div>`
    div.onclick = () => selCat(c.id)
    g.appendChild(div)
  })
}

function showAlerta() {
  const box = document.getElementById('alerta-cat')
  if (!box) return
  if (!catSel) { box.style.display = 'none'; return }
  const c    = CATS.find(x => x.id === catSel)
  const g    = gastos.filter(x => x.cat === c.id).reduce((a, b) => a + b.valor, 0)
  const rest = c.limite - g
  const pct  = Math.round(g / c.limite * 100)
  let cls, msg
  if (pct >= 100) { cls = 'alert-over'; msg = `<i class="ti ti-alert-circle"></i> Limite estourado em ${fmt(Math.abs(rest))}!` }
  else if (pct >= 75) { cls = 'alert-warn'; msg = `<i class="ti ti-alert-triangle"></i> Atenção: ${fmt(rest)} restando` }
  else { cls = 'alert-ok'; msg = `<i class="ti ti-check"></i> ${fmt(rest)} disponível (${100 - pct}% livre)` }
  box.className = 'alert ' + cls
  box.innerHTML = msg
  box.style.display = 'block'
}

async function lancar() {
  const v   = parseFloat(document.getElementById('inp-valor').value)
  const obs = document.getElementById('inp-obs').value.trim()
  if (!pessoaSel || !catSel || !v || v <= 0) return
  const novo = {
    id: crypto.randomUUID(),
    pessoa: pessoaSel,
    cat: catSel,
    valor: v,
    obs,
    mes: mesAtual(),
    data: new Date().toLocaleDateString('pt-BR'),
    created_at: new Date().toISOString(),
  }
  document.getElementById('inp-valor').value = ''
  document.getElementById('inp-obs').value   = ''
  catSel = null
  await salvarGasto(novo)
  toast('✅ Gasto registrado!')
  goPage('dash')
}
window.lancar = lancar

// ── PAINEL ────────────────────────────────────────────────────
function renderDash() {
  const el = document.getElementById('page-dash')
  if (!el) return
  const totalGasto = gastos.reduce((a, b) => a + b.valor, 0)
  const totalFixo  = TODOS_BOLETOS.reduce((a, b) => a + b.valor, 0)
  const totalPago  = TODOS_BOLETOS.filter(b => boletosPagos.includes(b.id)).reduce((a, b) => a + b.valor, 0)
  const livre      = RENDA - totalFixo - LIMITE_VAR
  const gastoPct   = Math.min(100, Math.round(totalGasto / LIMITE_VAR * 100))
  const gFred      = gastos.filter(x => x.pessoa === 'fred').reduce((a, b) => a + b.valor, 0)
  const gMya       = gastos.filter(x => x.pessoa === 'mya').reduce((a, b) => a + b.valor, 0)
  const fredPct    = totalGasto > 0 ? Math.round(gFred / totalGasto * 100) : 50
  const hoje       = new Date().getDate()
  const pendentes  = TODOS_BOLETOS.filter(b => !boletosPagos.includes(b.id) && b.venc - hoje >= 0 && b.venc - hoje <= 5)

  let html = ''

  if (pendentes.length) {
    html += `<div class="card" style="border-color:var(--color-warn);background:var(--color-warn-light)">
      <p class="section-label" style="color:#854F0B"><i class="ti ti-bell"></i> Vencendo em breve</p>`
    pendentes.forEach(b => {
      const d = b.venc - hoje
      html += `<div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:#633806">
        <span style="font-weight:500">${b.nome}</span>
        <span>${d === 0 ? 'Vence hoje!' : 'Em ' + d + 'd'} · ${fmt(b.valor)}</span></div>`
    })
    html += `</div>`
  }

  html += `<div class="metric-grid">
    <div class="metric"><div class="metric-label">Renda do mês</div><div class="metric-value">${fmt(RENDA)}</div></div>
    <div class="metric"><div class="metric-label">Boletos pagos</div><div class="metric-value${totalPago === totalFixo ? ' success' : ''}">${fmt(totalPago)}<span style="font-size:11px;color:var(--color-text-secondary)"> / ${fmt(totalFixo)}</span></div></div>
    <div class="metric"><div class="metric-label">Gasto variável</div><div class="metric-value${gastoPct >= 100 ? ' danger' : gastoPct >= 75 ? ' warn' : ''}">${fmt(totalGasto)}</div></div>
    <div class="metric"><div class="metric-label">Margem livre</div><div class="metric-value success">${fmt(livre)}</div></div>
  </div>`

  html += `<div class="card">
    <p class="section-label">Gastos por pessoa</p>
    <div style="display:flex;justify-content:space-between;margin-bottom:7px;font-size:13px;font-weight:500">
      <span style="color:var(--color-fred-dark);display:flex;align-items:center;gap:5px"><span style="width:9px;height:9px;border-radius:50%;background:var(--color-fred);display:inline-block"></span>Fred — ${fmt(gFred)}</span>
      <span style="color:var(--color-mya-dark);display:flex;align-items:center;gap:5px">Mya — ${fmt(gMya)}<span style="width:9px;height:9px;border-radius:50%;background:var(--color-mya);display:inline-block"></span></span>
    </div>
    <div class="stacked-bar"><div class="stacked-fred" style="width:${fredPct}%"></div><div class="stacked-mya" style="width:${100 - fredPct}%"></div></div>
  </div>`

  html += `<div class="card"><p class="section-label">Categorias variáveis</p>`
  CATS.forEach(c => {
    const gt  = gastos.filter(x => x.cat === c.id).reduce((a, b) => a + b.valor, 0)
    const gF  = gastos.filter(x => x.cat === c.id && x.pessoa === 'fred').reduce((a, b) => a + b.valor, 0)
    const gM  = gastos.filter(x => x.cat === c.id && x.pessoa === 'mya').reduce((a, b) => a + b.valor, 0)
    const pct = Math.min(100, Math.round(gt / c.limite * 100))
    const bCls = pct >= 100 ? 'bar-over' : pct >= 75 ? 'bar-warn' : 'bar-ok'
    const tCls = pct >= 100 ? 'tag-over'  : pct >= 75 ? 'tag-warn'  : 'tag-ok'
    const tTxt = pct >= 100 ? 'Estourado' : pct >= 75 ? 'Atenção'   : 'Ok'
    const sub  = (gF > 0 || gM > 0)
      ? `<span style="font-size:11px;color:var(--color-text-secondary)">${gF > 0 ? 'F:' + fmt(gF) : ''}${gF > 0 && gM > 0 ? ' · ' : ''}${gM > 0 ? 'M:' + fmt(gM) : ''}</span>`
      : ''
    html += `<div class="prog-row">
      <div class="prog-header">
        <span class="prog-name"><i class="${c.icon}" style="font-size:15px;color:${c.color}"></i>${c.label} ${sub}</span>
        <span style="display:flex;align-items:center;gap:6px"><span class="prog-vals">${fmt(gt)} / ${fmt(c.limite)}</span><span class="tag ${tCls}">${tTxt}</span></span>
      </div>
      <div class="bar-bg"><div class="bar-fill ${bCls}" style="width:${pct}%"></div></div>
    </div>`
  })
  html += `</div>`

  html += `<div class="card" onclick="goPage('fixos')" style="cursor:pointer">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <p class="section-label" style="margin:0">Boletos por grupo</p>
      <span style="font-size:12px;color:var(--color-text-secondary)">Ver todos <i class="ti ti-chevron-right"></i></span>
    </div>`
  GRUPOS.forEach(gr => {
    const total  = gr.boletos.reduce((a, b) => a + b.valor, 0)
    const pagos  = gr.boletos.filter(b => boletosPagos.includes(b.id)).length
    const pago$  = gr.boletos.filter(b => boletosPagos.includes(b.id)).reduce((a, b) => a + b.valor, 0)
    const pct    = Math.round(pagos / gr.boletos.length * 100)
    html += `<div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px">
        <span style="font-weight:500;display:flex;align-items:center;gap:6px"><i class="${gr.icon}" style="font-size:14px;color:${gr.color}"></i>${gr.titulo}</span>
        <span style="color:var(--color-text-secondary)">${pagos}/${gr.boletos.length} · ${fmt(pago$)}</span>
      </div>
      <div class="bar-bg"><div class="bar-fill bar-ok" style="width:${pct}%"></div></div>
    </div>`
  })
  html += `</div>`
  el.innerHTML = html
}

// ── BOLETOS ───────────────────────────────────────────────────
function renderFixos() {
  const el = document.getElementById('page-fixos')
  if (!el) return
  const totalGeral = TODOS_BOLETOS.reduce((a, b) => a + b.valor, 0)
  const totalPago  = TODOS_BOLETOS.filter(b => boletosPagos.includes(b.id)).reduce((a, b) => a + b.valor, 0)

  let html = `<div class="metric-grid">
    <div class="metric"><div class="metric-label">Total de boletos</div><div class="metric-value">${fmt(totalGeral)}</div></div>
    <div class="metric"><div class="metric-label">Pago até agora</div><div class="metric-value success">${fmt(totalPago)}</div></div>
  </div>`

  GRUPOS.forEach(gr => {
    const collapsed = gruposCollapsed[gr.id]
    const pagos     = gr.boletos.filter(b => boletosPagos.includes(b.id)).length
    const pago$     = gr.boletos.filter(b => boletosPagos.includes(b.id)).reduce((a, b) => a + b.valor, 0)
    html += `<div class="grupo-card">
      <div class="grupo-header" onclick="toggleGrupo('${gr.id}')">
        <span class="grupo-titulo"><i class="${gr.icon}" style="font-size:16px;color:${gr.color}"></i>${gr.titulo}</span>
        <span style="display:flex;align-items:center;gap:8px">
          <span class="grupo-resumo">${pagos}/${gr.boletos.length} pago${pagos !== 1 ? 's' : ''} · ${fmt(pago$)}</span>
          <i class="ti ${collapsed ? 'ti-chevron-down' : 'ti-chevron-up'}" style="font-size:14px;color:var(--color-text-secondary)"></i>
        </span>
      </div>`
    if (!collapsed) {
      gr.boletos.forEach(b => {
        const pago  = boletosPagos.includes(b.id)
        const hoje  = new Date().getDate()
        const diff  = b.venc - hoje
        let chipCls = 'chip-ok', chipTxt = `Dia ${b.venc}`
        if (pago)        { chipCls = 'chip-ok';     chipTxt = 'Pago ✓' }
        else if (diff < 0)  { chipCls = 'chip-warn';   chipTxt = `Dia ${b.venc}` }
        else if (diff === 0){ chipCls = 'chip-danger';  chipTxt = 'Vence hoje!' }
        else if (diff <= 5) { chipCls = 'chip-warn';   chipTxt = `Em ${diff}d` }
        html += `<div class="boleto-row" onclick="toggleBoleto('${b.id}')">
          <div class="check-box ${pago ? 'checked' : ''}"><i class="ti ti-check" style="font-size:13px;color:${pago ? '#fff' : 'transparent'}"></i></div>
          <div class="boleto-info">
            <div class="boleto-nome ${pago ? 'riscado' : ''}">${b.nome}</div>
            <span class="chip ${chipCls}" style="margin-top:3px">${chipTxt}</span>
          </div>
          <div class="boleto-right"><div class="boleto-valor">${fmt(b.valor)}</div></div>
        </div>`
      })
    }
    html += `</div>`
  })
  el.innerHTML = html
}

// ── HISTÓRICO ─────────────────────────────────────────────────
function renderHist() {
  const el = document.getElementById('page-historico')
  if (!el) return
  const filtrados = histFiltro === 'todos' ? gastos : gastos.filter(x => x.pessoa === histFiltro)
  const sorted    = [...filtrados].reverse()

  let html = `<div class="filter-row">
    <button class="filter-chip ${histFiltro === 'todos' ? 'active' : ''}" onclick="setFiltro('todos')">Todos</button>
    <button class="filter-chip ${histFiltro === 'fred'  ? 'active' : ''}" onclick="setFiltro('fred')">Fred</button>
    <button class="filter-chip ${histFiltro === 'mya'   ? 'active' : ''}" onclick="setFiltro('mya')">Mya</button>
  </div>`

  if (!sorted.length) {
    html += `<div class="card"><p class="empty"><i class="ti ti-receipt-off" style="font-size:28px;display:block;margin-bottom:8px"></i>Nenhum lançamento ainda</p></div>`
    el.innerHTML = html; return
  }

  const totalF = filtrados.reduce((a, b) => a + b.valor, 0)
  html += `<div class="metric-grid">
    <div class="metric"><div class="metric-label">${sorted.length} lançamento${sorted.length !== 1 ? 's' : ''}</div><div class="metric-value">${fmt(totalF)}</div></div>
    <div class="metric"><div class="metric-label">Média por gasto</div><div class="metric-value">${fmt(sorted.length ? totalF / sorted.length : 0)}</div></div>
  </div><div class="card">`

  sorted.forEach(g => {
    const c      = CATS.find(x => x.id === g.cat) || { icon: 'ti ti-dots', label: 'Outros', color: '#888' }
    const isFred = g.pessoa === 'fred'
    html += `<div class="lanc-row">
      <div style="display:flex;align-items:center;gap:8px">
        <i class="${c.icon}" style="font-size:16px;color:${c.color}"></i>
        <div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
            <span style="font-size:13px;font-weight:500">${c.label}</span>
            <span class="badge ${isFred ? 'badge-fred' : 'badge-mya'}">${isFred ? 'Fred' : 'Mya'}</span>
          </div>
          <div style="font-size:11px;color:var(--color-text-secondary)">${g.data}${g.obs ? ' · ' + g.obs : ''}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-weight:600;color:var(--color-danger)">- ${fmt(g.valor)}</span>
        <button class="del-btn" onclick="deletarGasto('${g.id}')"><i class="ti ti-trash"></i></button>
      </div>
    </div>`
  })
  html += `</div>`
  el.innerHTML = html
}

function setFiltro(f) { histFiltro = f; renderHist() }
window.setFiltro = setFiltro

// ── RENDER GERAL ──────────────────────────────────────────────
function renderAll() {
  renderLancar()
  renderDash()
  renderFixos()
  renderHist()
}

// ── INIT ──────────────────────────────────────────────────────
async function init() {
  document.getElementById('mes-badge').textContent  = mesLabel()
  gruposCollapsed = JSON.parse(localStorage.getItem('gruposCollapsed') || '{}')

  try {
    await Promise.all([carregarGastos(), carregarBoletos()])
  } catch (e) {
    console.warn('Erro no carregamento inicial', e)
  }

  renderAll()
  hideLoading()   // sempre esconde o loading, mesmo com erro
}

init()
