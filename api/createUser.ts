import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Usar o Service Role Key em vez do Anon Key para conseguir bypass ao RLS e criar Users
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Email mapping fictício
    const emailToAuth = `${username}@obras.local`;

    // 1. Criar Utilizador na Auth Admin
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: emailToAuth,
      password: password,
      email_confirm: true,
      user_metadata: {
        username: username,
        role: role
      }
    });

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true, user: data.user });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
