-- ============================================================
--  SUPABASE — Migração inicial
--  Cole no SQL Editor do seu projeto Supabase e execute
-- ============================================================

-- Tabela de gastos variáveis
CREATE TABLE IF NOT EXISTS gastos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa      TEXT NOT NULL CHECK (pessoa IN ('fred', 'mya')),
  cat         TEXT NOT NULL,
  valor       NUMERIC(10,2) NOT NULL,
  obs         TEXT DEFAULT '',
  mes         TEXT NOT NULL,        -- formato: YYYY-MM
  data        TEXT NOT NULL,        -- formato: DD/MM/YYYY (display)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de boletos pagos por mês
CREATE TABLE IF NOT EXISTS boletos_pagos (
  id          BIGSERIAL PRIMARY KEY,
  boleto_id   TEXT NOT NULL,
  mes         TEXT NOT NULL,        -- formato: YYYY-MM
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (boleto_id, mes)
);

-- Índices para busca por mês (as queries mais comuns)
CREATE INDEX IF NOT EXISTS idx_gastos_mes ON gastos (mes);
CREATE INDEX IF NOT EXISTS idx_boletos_mes ON boletos_pagos (mes);

-- ============================================================
--  ROW LEVEL SECURITY — habilite depois de testar
--  Por ora deixa público para facilitar o setup inicial
-- ============================================================
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE boletos_pagos ENABLE ROW LEVEL SECURITY;

-- Política aberta (substitua por auth.uid() quando adicionar login)
CREATE POLICY "allow_all_gastos"       ON gastos        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_boletos"      ON boletos_pagos  FOR ALL USING (true) WITH CHECK (true);
