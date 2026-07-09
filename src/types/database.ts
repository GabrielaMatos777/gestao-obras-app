export type Profile = {
  id: string;
  username: string;
  role: 'admin' | 'user';
  must_change_password: boolean;
  created_at: string;
};

export type Obra = {
  id: string;
  nome_obra: string;
  estado: 'ativa' | 'concluida';
  total_gasto: number;
  created_at?: string;
};

export type Fatura = {
  id: string;
  obra_id: string;
  foto_url?: string;
  fornecedor: string;
  data_compra: string;
  valor_total: number;
  registado_por: string;
  created_at?: string;
};

export type MaterialComprado = {
  id: string;
  fatura_id: string;
  texto_original_fatura: string;
  produto_normalizado: string;
  quantidade: number;
  preco_unitario: number;
  preco_total_item: number;
  created_at?: string;
};
