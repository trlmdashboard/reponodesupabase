import { supabase } from './supabase-client.js'

document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const name = document.getElementById('name').value
    const email = document.getElementById('email').value

    const { data, error } = await supabase
        .from('users')
        .insert([{ name, email }])
        .select()

    if (error) {
        console.error('Error adding user:', error)
        alert('Error adding user: ' + error.message)
    } else {
        console.log('User added successfully:', data)
        document.getElementById('name').value = ''
        document.getElementById('email').value = ''
        alert('User added successfully!')
    }
})

window.loadUsers = async function() {
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error loading users:', error)
        alert('Error loading users: ' + error.message)
        return
    }

    const usersList = document.getElementById('usersList')
    usersList.innerHTML = ''

    if (users.length === 0) {
        usersList.innerHTML = '<p>No users found</p>'
        return
    }

    users.forEach(user => {
        const userElement = document.createElement('div')
        userElement.className = 'user-item'
        userElement.innerHTML = `
            <strong>${user.name}</strong> - ${user.email}
            <br>
            <small>Created: ${new Date(user.created_at).toLocaleString()}</small>
        `
        usersList.appendChild(userElement)
    })
}

// Load users on page load
document.addEventListener('DOMContentLoaded', loadUsers)
