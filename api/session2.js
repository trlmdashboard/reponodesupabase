const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Server misconfigured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return res.status(200).json({ user: null });
    }

    res.status(200).json({ 
      user: { 
        id: session.user.id, 
        email: session.user.email 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
