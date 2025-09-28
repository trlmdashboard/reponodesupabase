const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { login_id, password } = req.body;

        if (!login_id || !password) {
            return res.status(400).json({ error: 'Login ID and password are required' });
        }

        // Initialize Supabase client
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Step 1: Find user in the 01_users table by login_id
        const { data: userData, error: userError } = await supabase
            .from('01_users')
            .select('*')
            .eq('login_id', login_id)
            .single();

        if (userError || !userData) {
            return res.status(401).json({ error: 'Invalid login credentials' });
        }

        // Step 2: Get the email from auth.users table using the uid
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userData.uid);
        
        if (authError || !authUser) {
            return res.status(401).json({ error: 'User not found in authentication system' });
        }

        const email = authUser.user.email;

        // Step 3: Sign in with email and password
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (signInError) {
            return res.status(401).json({ error: 'Invalid login credentials' });
        }

        // Step 4: Get additional user data from 01_users table
        const { data: finalUserData, error: finalError } = await supabase
            .from('01_users')
            .select('*')
            .eq('uid', signInData.user.id)
            .single();

        if (finalError) {
            return res.status(500).json({ error: 'Error fetching user details' });
        }

        // Return success response with user data and token
        res.status(200).json({
            message: 'Login successful',
            token: signInData.session.access_token,
            user: {
                uid: finalUserData.uid,
                login_id: finalUserData.login_id,
                created_at: finalUserData.created_at,
                // Add any other fields you want to return from 01_users table
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
