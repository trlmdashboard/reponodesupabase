const { createClient } = require('@supabase/supabase-js');

// These should be set as environment variables in Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, full_name, login_id, user_type, fpc_id, lsc_id } = req.body;

    if (!email || !password || !full_name || !login_id || !user_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Create user in Supabase Authentication
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // Insert user details into custom table
    const { data: userData, error: userError } = await supabase
      .from('01_users')
      .insert([
        { 
          uid: userId, 
          full_name, 
          login_id, 
          user_type, 
          fpc_id: fpc_id || null, 
          lsc_id: lsc_id || null 
        }
      ]);

    if (userError) {
      // If user creation fails, try to delete the auth user
      await supabase.auth.admin.deleteUser(userId);
      return res.status(400).json({ error: userError.message });
    }

    res.status(200).json({ 
      message: 'Registration successful! Please check your email for verification.',
      user: { id: userId, email }
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
