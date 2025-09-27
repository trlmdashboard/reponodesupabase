import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Set CORS headers
function setCorsHeaders(res, origin) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
}

// Handle preflight request
function handlePreflight(req, res) {
    setCorsHeaders(res, req.headers.origin);
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }
    return false;
}

// Get session token from cookie
function getSessionToken(req) {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
    }, {});

    return cookies.session_token || null;
}

// Set session cookie
function setSessionCookie(res, token, maxAge = 86400) {
    const cookieOptions = [
        `HttpOnly`,
        `Secure`,
        `SameSite=Strict`,
        `Path=/`,
        `Max-Age=${maxAge}`
    ].join('; ');

    res.setHeader('Set-Cookie', `session_token=${token}; ${cookieOptions}`);
}

// Clear session cookie
function clearSessionCookie(res) {
    res.setHeader('Set-Cookie', 'session_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
}

// Login handler
async function handleLogin(req, res) {
    try {
        const { loginId, password } = req.body;

        if (!loginId || !password) {
            return res.status(400).json({ error: 'Login ID and password are required' });
        }

        // Step 1: Find user by login_id in 01_users table
        const { data: userData, error: userError } = await supabase
            .from('01_users')
            .select('uid, login_id')
            .eq('login_id', loginId)
            .single();

        if (userError || !userData) {
            return res.status(401).json({ error: 'Invalid Login ID or password' });
        }

        // Step 2: Get email from auth.users
        const { data: authUser, error: authError } = await supabase
            .from('auth.users')
            .select('email, id')
            .eq('id', userData.uid)
            .single();

        if (authError || !authUser) {
            return res.status(401).json({ error: 'User not found in authentication system' });
        }

        // Step 3: Sign in with email and password
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: authUser.email,
            password: password
        });

        if (signInError) {
            return res.status(401).json({ error: 'Invalid Login ID or password' });
        }

        // Set HTTP-only cookie with session token
        setSessionCookie(res, signInData.session.access_token);

        // Return success with user data
        res.status(200).json({
            success: true,
            user: {
                id: signInData.user.id,
                login_id: userData.login_id,
                email: authUser.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Check authentication handler
async function handleCheckAuth(req, res) {
    try {
        const sessionToken = getSessionToken(req);

        if (!sessionToken) {
            return res.status(200).json({ authenticated: false });
        }

        // Verify the session token
        const { data: { user }, error } = await supabase.auth.getUser(sessionToken);

        if (error || !user) {
            // Clear invalid session cookie
            clearSessionCookie(res);
            return res.status(200).json({ authenticated: false });
        }

        // Get additional user info from 01_users table
        const { data: userData } = await supabase
            .from('01_users')
            .select('login_id')
            .eq('uid', user.id)
            .single();

        res.status(200).json({
            authenticated: true,
            user: {
                id: user.id,
                login_id: userData?.login_id || 'N/A',
                email: user.email
            }
        });

    } catch (error) {
        console.error('Check auth error:', error);
        res.status(200).json({ authenticated: false });
    }
}

// Logout handler
async function handleLogout(req, res) {
    try {
        const sessionToken = getSessionToken(req);

        if (sessionToken) {
            // Sign out from Supabase
            await supabase.auth.signOut(sessionToken);
        }

        // Clear session cookie
        clearSessionCookie(res);

        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
}

// Main request handler
export default async function handler(req, res) {
    const origin = req.headers.origin;
    
    // Handle preflight request
    if (handlePreflight(req, res)) return;

    // Set CORS headers for actual requests
    setCorsHeaders(res, origin);

    try {
        const { action } = req.query;

        switch (action) {
            case 'login':
                if (req.method === 'POST') {
                    await handleLogin(req, res);
                } else {
                    res.status(405).json({ error: 'Method not allowed' });
                }
                break;

            case 'check':
                if (req.method === 'GET') {
                    await handleCheckAuth(req, res);
                } else {
                    res.status(405).json({ error: 'Method not allowed' });
                }
                break;

            case 'logout':
                if (req.method === 'POST') {
                    await handleLogout(req, res);
                } else {
                    res.status(405).json({ error: 'Method not allowed' });
                }
                break;

            default:
                res.status(400).json({ error: 'Invalid action specified' });
                break;
        }

    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
