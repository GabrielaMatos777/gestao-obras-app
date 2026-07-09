import { createClient, type Session } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import type { Obra, Fatura, MaterialComprado, Profile } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session?.user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    }
    
    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(profileData);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, profile, loading };
}

// Mock database (in-memory) for demonstration and prototyping
export const mockDb = {
  obras: [
    { id: '1', nome_obra: 'Casa da Rita', estado: 'ativa', total_gasto: 1540.50 },
    { id: '2', nome_obra: 'Casa Edgar', estado: 'ativa', total_gasto: 890.00 },
    { id: '3', nome_obra: 'Reparação Telhado Cascais', estado: 'concluida', total_gasto: 850.00 },
  ] as Obra[],
  
  faturas: [
    { id: 'f1', obra_id: '1', fornecedor: 'Leroy Merlin', data_compra: '2026-07-01', valor_total: 450.50, registado_por: 'Gestor A' },
    { id: 'f2', obra_id: '1', fornecedor: 'Bricomarché', data_compra: '2026-07-05', valor_total: 1090.00, registado_por: 'Gestor B' },
    { id: 'f3', obra_id: '2', fornecedor: 'Maxmat', data_compra: '2026-07-07', valor_total: 890.00, registado_por: 'Gestor A' },
  ] as Fatura[],

  materiais: [
    { id: 'm1', fatura_id: 'f1', texto_original_fatura: 'TINTA ACR BRANC 15L', produto_normalizado: 'Tinta Branca 15L', quantidade: 2, preco_unitario: 120.00, preco_total_item: 240.00 },
    { id: 'm2', fatura_id: 'f1', texto_original_fatura: 'PINCEL ROLO 20CM', produto_normalizado: 'Rolo Pintura 20cm', quantidade: 3, preco_unitario: 15.00, preco_total_item: 45.00 },
    { id: 'm3', fatura_id: 'f2', texto_original_fatura: 'PLACA PLADUR 13MM 2X1.2', produto_normalizado: 'Placa Pladur 13mm', quantidade: 50, preco_unitario: 18.00, preco_total_item: 900.00 },
    { id: 'm4', fatura_id: 'f3', texto_original_fatura: 'CIMENTO 25KG', produto_normalizado: 'Cimento Portland 25kg', quantidade: 20, preco_unitario: 5.50, preco_total_item: 110.00 },
    { id: 'm5', fatura_id: 'f3', texto_original_fatura: 'TIJOLO 15', produto_normalizado: 'Tijolo Burro 15cm', quantidade: 1000, preco_unitario: 0.78, preco_total_item: 780.00 },
  ] as MaterialComprado[],
};
