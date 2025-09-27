const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
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
    const { js_txt_user_id, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Server misconfigured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: customUser, error: userError } = await supabase
      .from('01_users')
      .select('uid, login_id')
      .eq('login_id', js_txt_user_id)
      .single();

    if (userError || !customUser) {
      return Response.json({ error: 'Invalid login credentials' }, { status: 401 });
    }

    //---2nd part
     const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
      customUser.uid
    );

    if (authError || !authUser.user) {
      return Response.json({ error: 'Invalid login credentials' }, { status: 401 });
    }

    const email = authUser.user.email;


    // 3rd part
     const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (signInError) {
      return Response.json({ error: 'Invalid login credentials' }, { status: 401 });
    }


    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.status(200).json({ 
      user: { 
        id: data.user.id, 
        email: data.user.email 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
