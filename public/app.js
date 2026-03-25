const API_URL = '/users';

// DOM Elements
const usersTableBody = document.getElementById('usersTableBody');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const sortOrderBtn = document.getElementById('sortOrderBtn');
const addUserBtn = document.getElementById('addUserBtn');

const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const usersTable = document.getElementById('usersTable');

const modalOverlay = document.getElementById('userModal');
const modalTitle = document.getElementById('modalTitle');
const userForm = document.getElementById('userForm');
const userIdInput = document.getElementById('userId');
const userNameInput = document.getElementById('userName');
const userEmailInput = document.getElementById('userEmail');
const closeModals = document.querySelectorAll('.close-modal');

const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastIcon = document.getElementById('toastIcon');

// State
let currentSortOrder = 'desc';
let debounceTimer;

// Event Listeners
document.addEventListener('DOMContentLoaded', fetchUsers);

searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchUsers, 300);
});

sortSelect.addEventListener('change', fetchUsers);

sortOrderBtn.addEventListener('click', () => {
    currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    const icon = sortOrderBtn.querySelector('i');
    icon.className = currentSortOrder === 'asc' ? 'uil uil-sort-amount-up' : 'uil uil-sort-amount-down';
    fetchUsers();
});

addUserBtn.addEventListener('click', () => openModal());

closeModals.forEach(btn => btn.addEventListener('click', closeModal));

userForm.addEventListener('submit', handleFormSubmit);

// API Functions
async function fetchUsers() {
    showLoading();
    try {
        const search = searchInput.value;
        const sort = sortSelect.value;
        
        let queryParams = `?sort=${sort}&order=${currentSortOrder}`;
        if (search) queryParams += `&search=${encodeURIComponent(search)}`;

        const response = await fetch(`${API_URL}${queryParams}`);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Failed to fetch users');
        
        renderUsers(data.data);
    } catch (error) {
        showToast(error.message, 'error');
        renderUsers([]);
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const id = userIdInput.value;
    const isEdit = !!id;
    
    const payload = {
        name: userNameInput.value,
        email: userEmailInput.value
    };

    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${API_URL}/${id}` : API_URL;

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Failed to save user');
        
        showToast(`User successfully ${isEdit ? 'updated' : 'created'}!`, 'success');
        closeModal();
        fetchUsers();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Failed to delete user');
        
        showToast('User deleted successfully', 'success');
        fetchUsers();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// UI Functions
function renderUsers(users) {
    hideLoading();
    
    if (users.length === 0) {
        usersTable.style.display = 'none';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    usersTable.style.display = 'table';
    
    usersTableBody.innerHTML = users.map(user => `
        <tr>
            <td>
                <div class="user-cell">
                    <div class="user-avatar">
                        ${getInitials(user.name)}
                    </div>
                    <div>
                        <div class="user-name">${escapeHTML(user.name)}</div>
                        <div class="user-id">ID: ${user.id}</div>
                    </div>
                </div>
            </td>
            <td>${escapeHTML(user.email)}</td>
            <td>${formatDate(user.created_at)}</td>
            <td>
                <div class="actions-cell">
                    <button class="btn btn-icon" onclick='openModal(${JSON.stringify(user).replace(/'/g, "&#39;")})' title="Edit">
                        <i class="uil uil-edit"></i>
                    </button>
                    <button class="btn btn-icon" style="color: var(--danger-color)" onclick="deleteUser(${user.id})" title="Delete">
                        <i class="uil uil-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openModal(user = null) {
    if (user) {
        modalTitle.textContent = 'Edit User';
        userIdInput.value = user.id;
        userNameInput.value = user.name;
        userEmailInput.value = user.email;
    } else {
        modalTitle.textContent = 'Add New User';
        userForm.reset();
        userIdInput.value = '';
    }
    modalOverlay.classList.remove('hidden');
    // Focus the first input
    setTimeout(() => userNameInput.focus(), 100);
}

function closeModal() {
    modalOverlay.classList.add('hidden');
    userForm.reset();
}

function showLoading() {
    loadingState.classList.remove('hidden');
    usersTable.style.display = 'none';
    emptyState.classList.add('hidden');
}

function hideLoading() {
    loadingState.classList.add('hidden');
}

let toastTimer;
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    
    toast.className = `toast ${type}`;
    toastIcon.className = type === 'success' ? 'uil uil-check-circle' : 'uil uil-exclamation-circle';
    
    toast.classList.remove('hidden');
    
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Helpers
function getInitials(name) {
    return name.substring(0, 2).toUpperCase();
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' };
    return new Date(dateString + 'Z').toLocaleDateString(undefined, options); // assuming UTC timestamp from sqlite
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
