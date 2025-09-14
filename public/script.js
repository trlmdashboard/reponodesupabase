let supabase;

async function initializeSupabase() {
    try {
        // Fetch configuration from serverless function
        const response = await fetch('/api/config');
        
        if (!response.ok) {
            throw new Error('Failed to fetch configuration');
        }
        
        const config = await response.json();
        
        if (!config.supabaseUrl || !config.supabaseAnonKey) {
            throw new Error('Supabase configuration is missing');
        }
        
        // Initialize Supabase
        supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
        console.log('Supabase initialized successfully');
        
        // Enable UI
        document.getElementById('userForm').style.display = 'block';
        document.getElementById('loadUsersBtn').disabled = false;
        
        // Load users
        loadUsers();
        
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        document.getElementById('usersList').innerHTML = `
            <div style="color: red; padding: 10px; background: #ffe6e6; border-radius: 5px;">
                Error: ${error.message}
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Hide form until Supabase is initialized
    document.getElementById('userForm').style.display = 'none';
    document.getElementById('loadUsersBtn').disabled = true;
    
    const userForm = document.getElementById('userForm');
    const loadUsersBtn = document.getElementById('loadUsersBtn');
    
    userForm.addEventListener('submit', handleSubmit);
    loadUsersBtn.addEventListener('click', loadUsers);
    
    // Initialize Supabase
    initializeSupabase();
});

async function handleSubmit(e) {
    e.preventDefault();
    
    if (!supabase) {
        alert('Supabase not initialized yet. Please wait...');
        return;
    }
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    try {
        const { data, error } = await supabase
            .from('users')
            .insert([{ name, email }])
            .select();

        if (error) {
            throw error;
        }

        console.log('User added successfully:', data);
        document.getElementById('name').value = '';
        document.getElementById('email').value = '';
        
        // Show success message
        showMessage('User added successfully!', 'success');
        
        // Reload users list
        loadUsers();
    } catch (error) {
        console.error('Error adding user:', error);
        showMessage('Error adding user: ' + error.message, 'error');
    }
}

async function loadUsers() {
    if (!supabase) {
        alert('Supabase not initialized yet. Please wait...');
        return;
    }
    
    const usersList = document.getElementById('usersList');
    
    try {
        usersList.innerHTML = '<p>Loading users...</p>';
        
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        usersList.innerHTML = '';

        if (users.length === 0) {
            usersList.innerHTML = '<p>No users found</p>';
            return;
        }

        users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            userElement.innerHTML = `
                <strong>${user.name}</strong> - ${user.email}
                <br>
                <small>Created: ${new Date(user.created_at).toLocaleString()}</small>
            `;
            usersList.appendChild(userElement);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        usersList.innerHTML = `
            <div style="color: red; padding: 10px; background: #ffe6e6; border-radius: 5px;">
                Error loading users: ${error.message}
            </div>
        `;
    }
}

function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px;
        border-radius: 5px;
        color: white;
        z-index: 1000;
        ${type === 'success' ? 'background: #48bb78;' : ''}
        ${type === 'error' ? 'background: #f56565;' : ''}
        ${type === 'info' ? 'background: #4299e1;' : ''}
    `;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        document.body.removeChild(messageDiv);
    }, 3000);
}