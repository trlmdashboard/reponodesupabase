import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY

  
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({ error: 'Login ID and password are required' });
    }

    // Step 1: Find user by login_id in 01_users table
    const { data: customUser, error: userError } = await supabase
      .from('01_users')
      .select('uid, login_id')
      .eq('login_id', loginId)
      .single();

    if (userError || !customUser) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    // Step 2: Get email from Supabase auth using the uid
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
      customUser.uid
    );

    if (authError || !authUser.user) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const email = authUser.user.email;

    // Step 3: Sign in with email and password
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (signInError) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    // Step 4: Return success with user data
    res.status(200).json({
      success: true,
      user: {
        uid: signInData.user.id,
        login_id: customUser.login_id,
        email: signInData.user.email,
      },
      session: signInData.session,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
