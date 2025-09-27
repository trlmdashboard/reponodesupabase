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

// Login handler - UPDATED TO HANDLE THE SPECIFIC ERROR
async function handleLogin(req, res) {
    try {
        const { loginId, password } = req.body;

        if (!loginId || !password) {
            return res.status(400).json({ error: 'Login ID and password are required' });
        }

        console.log('Login attempt for loginId:', loginId);

        // Step 1: Find user by login_id in 01_users table
        const { data: userData, error: userError } = await supabase
            .from('01_users')
            .select('uid, login_id')
            .eq('login_id', loginId)
            .single();

        if (userError) {
            console.log('User lookup error:', userError);
            return res.status(401).json({ error: 'Invalid Login ID or password' });
        }

        if (!userData) {
            console.log('User not found in 01_users table');
            return res.status(401).json({ error: 'Invalid Login ID or password' });
        }

        console.log('Found user in 01_users:', userData);

        // Step 2: Try to get email from auth.users using the uid
        const { data: authUser, error: authError } = await supabase
            .from('auth.users')
            .select('email, id')
            .eq('id', userData.uid)
            .single();

        if (authError) {
            console.log('Auth user lookup error:', authError);
            // If user not found in auth.users, try alternative approach
            return res.status(401).json({ 
                error: 'Authentication system error. Please contact administrator.',
                details: 'User not properly registered in authentication system'
            });
        }

        if (!authUser) {
            console.log('User not found in auth.users table, trying direct authentication...');
            
            // Alternative approach: Try to authenticate directly using loginId as email
            // This handles cases where the user might exist with a different mapping
            return await tryDirectAuthentication(loginId, password, res, userData);
        }

        console.log('Found user in auth.users:', authUser);

        // Step 3: Sign in with email and password
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: authUser.email,
            password: password
        });

        if (signInError) {
            console.log('Sign in error:', signInError);
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

// Alternative authentication method
async function tryDirectAuthentication(loginId, password, res, userData) {
    try {
        // Try using loginId as email directly
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: loginId, // Try loginId as email
            password: password
        });

        if (signInError) {
            // If that fails, try to find any user in auth.users that might match
            const { data: allUsers, error: listError } = await supabase
                .from('auth.users')
                .select('email, id')
                .ilike('email', `%${loginId}%`)
                .limit(5);

            if (!listError && allUsers && allUsers.length > 0) {
                console.log('Potential matching users found:', allUsers);
                return res.status(401).json({ 
                    error: 'Authentication configuration issue. Please contact administrator.',
                    details: 'User exists but authentication mapping is incorrect'
                });
            }

            return res.status(401).json({ 
                error: 'Invalid Login ID or password',
                details: 'Please check your credentials and try again'
            });
        }

        // If direct authentication worked, update the 01_users table with correct UID
        if (signInData.user.id !== userData.uid) {
            // Update the 01_users table with the correct UID
            const { error: updateError } = await supabase
                .from('01_users')
                .update({ uid: signInData.user.id })
                .eq('login_id', loginId);

            if (updateError) {
                console.log('Error updating user UID:', updateError);
            }
        }

        setSessionCookie(res, signInData.session.access_token);

        res.status(200).json({
            success: true,
            user: {
                id: signInData.user.id,
                login_id: userData.login_id,
                email: signInData.user.email
            }
        });

    } catch (error) {
        console.error('Direct authentication error:', error);
        res.status(500).json({ error: 'Authentication system error' });
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

// Debug endpoint to check database structure
async function handleDebug(req, res) {
    try {
        // Check 01_users table structure
        const { data: usersSample, error: usersError } = await supabase
            .from('01_users')
            .select('*')
            .limit(3);

        // Check auth.users accessibility
        const { data: authSample, error: authError } = await supabase
            .from('auth.users')
            .select('id, email')
            .limit(3);

        res.status(200).json({
            users_table_sample: usersSample,
            users_table_error: usersError,
            auth_table_sample: authSample,
            auth_table_error: authError
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
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

            case 'debug':
                if (req.method === 'GET') {
                    await handleDebug(req, res);
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
