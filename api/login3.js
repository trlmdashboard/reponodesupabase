import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { login_id, login_password } = req.body;

    if (!login_id || !login_password) {
      return res.status(400).json({ error: 'Login ID and password are required' });
    }

    // Query the custom users table
    const { data: users, error } = await supabase
      .from('01_users')
      .select('*')
      .eq('login_id', login_id)
      .eq('login_password', login_password)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(401).json({ error: 'Invalid login credentials' });
      }
      throw error;
    }

    if (!users) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    // Successful login - return user data (excluding password)
    const { login_password: _, ...userWithoutPassword } = users;
    
    res.status(200).json({
      success: true,
      user: userWithoutPassword,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
