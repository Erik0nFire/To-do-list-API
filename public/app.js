const API_URL = 'http://localhost:3000'; 
let authToken = getCookie('token');
let currentUser = localStorage.getItem('username');
let currentTodos = []; 

const authSection = document.getElementById('auth-section');
const todoSection = document.getElementById('todo-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const todoList = document.getElementById('todo-list');
const authMessage = document.getElementById('auth-message');

const editModal = document.getElementById('edit-modal');
const editTitleInput = document.getElementById('edit-title');
const editDescInput = document.getElementById('edit-desc');
const editIdInput = document.getElementById('edit-id');

if (authToken) {
    showTodoSection();
}

document.getElementById('show-login-btn').addEventListener('click', () => toggleForms('login'));
document.getElementById('show-register-btn').addEventListener('click', () => toggleForms('register'));

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (response.ok) {
            alert('Registered! Please login.');
            toggleForms('login');
        } else {
            authMessage.textContent = 'Registration failed.';
        }
    } catch (error) { console.error(error); }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            authToken = data.token;
            currentUser = data.username;
            
            setCookie('token', authToken, 1);
            
            localStorage.setItem('username', currentUser);
            showTodoSection();
        } else {
            authMessage.textContent = 'Invalid credentials';
        }
    } catch (error) { console.error(error); }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    eraseCookie('token');
    localStorage.removeItem('username');
    location.reload();
});


document.getElementById('add-todo-btn').addEventListener('click', async () => {
    const title = document.getElementById('new-todo-title').value;
    const desc = document.getElementById('new-todo-desc').value;
    if (!title) return alert("Title is required");

    try {
        const response = await fetch(`${API_URL}/todos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ title: title, description: desc })
        });
        if (response.ok) {
            document.getElementById('new-todo-title').value = '';
            document.getElementById('new-todo-desc').value = '';
            fetchTodos();
        }
    } catch (error) { console.error(error); }
});

async function fetchTodos() {
    try {
        const response = await fetch(`${API_URL}/todos`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const todos = await response.json();
            currentTodos = todos;
            renderTodos(todos);
        } else if (response.status === 401) {
            eraseCookie('token');
            location.reload();
        }
    } catch (error) { console.error(error); }
}

function renderTodos(todos) {
    todoList.innerHTML = '';
    todos.forEach(todo => {
        const li = document.createElement('li');
        const textClass = todo.completed ? 'completed-task' : '';
        const isChecked = todo.completed ? 'checked' : '';

        li.innerHTML = `
            <input type="checkbox" class="todo-check" data-id="${todo.id}" ${isChecked}>
            <div class="task-info ${textClass}">
                <strong>${todo.title}</strong><br>
                <small>${todo.description}</small>
            </div>
            <div class="action-buttons">
                <button class="edit-btn" data-id="${todo.id}">Edit</button>
                <button class="delete-btn" data-id="${todo.id}">Delete</button>
            </div>
        `;
        todoList.appendChild(li);
    });
}

todoList.addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains('delete-btn')) deleteTodoItem(id);
    if (e.target.classList.contains('edit-btn')) openEditModal(id);
    if (e.target.classList.contains('todo-check')) toggleComplete(id);
});

async function deleteTodoItem(id) {
    if(!confirm("Are you sure?")) return;
    try {
        const response = await fetch(`${API_URL}/todos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) fetchTodos();
    } catch (error) { console.error(error); }
}

async function toggleComplete(id) {
    const todo = currentTodos.find(t => t.id == id);
    if (!todo) return;
    const newStatus = !todo.completed;

    try {
        const response = await fetch(`${API_URL}/todos/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}` 
            },
            body: JSON.stringify({ 
                title: todo.title, 
                description: todo.description, 
                completed: newStatus 
            })
        });
        if (response.ok) fetchTodos();
    } catch (error) { console.error(error); }
}

function openEditModal(id) {
    const todo = currentTodos.find(t => t.id == id);
    if (!todo) return;
    
    editIdInput.value = todo.id;
    editTitleInput.value = todo.title;
    editDescInput.value = todo.description;
    editModal.classList.remove('hidden');
}

document.getElementById('cancel-edit-btn').addEventListener('click', () => {
    editModal.classList.add('hidden');
});

document.getElementById('save-edit-btn').addEventListener('click', async () => {
    const id = editIdInput.value;
    const title = editTitleInput.value;
    const desc = editDescInput.value;
    const todo = currentTodos.find(t => t.id == id);

    try {
        const response = await fetch(`${API_URL}/todos/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}` 
            },
            body: JSON.stringify({ 
                title: title, 
                description: desc, 
                completed: todo.completed 
            })
        });

        if (response.ok) {
            editModal.classList.add('hidden');
            fetchTodos();
        }
    } catch (error) { console.error(error); }
});

function toggleForms(view) {
    authMessage.textContent = '';
    if (view === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        document.getElementById('show-login-btn').classList.add('active');
        document.getElementById('show-register-btn').classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        document.getElementById('show-login-btn').classList.remove('active');
        document.getElementById('show-register-btn').classList.add('active');
    }
}

function showTodoSection() {
    authSection.classList.add('hidden');
    todoSection.classList.remove('hidden');
    document.getElementById('welcome-user').textContent = `User: ${currentUser}`;
    fetchTodos();
}


function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/; SameSite=Strict";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {   
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}