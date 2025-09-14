// Initialize Supabase
const supabaseUrl = 'https://your-project-ref.supabase.co'; // Replace with your Supabase URL
const supabaseKey = 'your-anon-key'; // Replace with your Supabase anon key
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', function() {
    const userForm = document.getElementById('userForm');
    const loadUsersBtn = document.getElementById('loadUsersBtn');
    
    userForm.addEventListener('submit', handleSubmit);
    loadUsersBtn.addEventListener('click', loadUsers);
    
    // Load users on page load
    loadUsers();
});

async function handleSubmit(e) {
    e.preventDefault();
    
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
        alert('User added successfully!');
        
        // Reload users list
        loadUsers();
    } catch (error) {
        console.error('Error adding user:', error);
        alert('Error adding user: ' + error.message);
    }
}

async function loadUsers() {
    const usersList = document.getElementById('usersList');
    
    try {
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
        alert('Error loading users: ' + error.message);
    }
}
