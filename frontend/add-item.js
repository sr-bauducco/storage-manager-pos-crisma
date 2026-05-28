const API_URL = 'http://147.15.45.97:3000/api';
const form = document.getElementById('addItemForm');
const categorySelect = document.getElementById('categoryId');
const statusMessage = document.getElementById('statusMessage');

// 1. Fetch Categories when the page loads
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const categories = await response.json();
        
        categorySelect.innerHTML = '<option value="">-- Select a Category --</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id; // We send the ID to Prisma
            option.textContent = cat.name; // We show the name to the user
            categorySelect.appendChild(option);
        });
    } catch (error) {
        categorySelect.innerHTML = '<option value="">Error loading categories</option>';
    }
}

// 2. Handle Form Submission
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Stop the page from refreshing
    statusMessage.textContent = 'Saving...';
    statusMessage.className = '';

    // Gather the data
    const itemData = {
        name: document.getElementById('name').value,
        quantity: parseInt(document.getElementById('quantity').value),
        location: document.getElementById('location').value,
        assetType: document.getElementById('assetType').value,
        categoryId: document.getElementById('categoryId').value
    };

    const token = document.getElementById('adminToken').value;

    try {
        const response = await fetch(`${API_URL}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Injecting your secret key
            },
            body: JSON.stringify(itemData)
        });

        if (response.ok) {
            statusMessage.textContent = '✅ Item added successfully!';
            statusMessage.className = 'success';
            form.reset(); // Clear the form
            loadCategories(); // Reload just in case
        } else if (response.status === 401) {
            statusMessage.textContent = '❌ Unauthorized: Incorrect Admin Password.';
            statusMessage.className = 'error';
        } else {
            statusMessage.textContent = '❌ Failed to add item. Check server logs.';
            statusMessage.className = 'error';
        }
    } catch (error) {
        statusMessage.textContent = '❌ Network error. Is the backend running?';
        statusMessage.className = 'error';
    }
});

// Start the app
loadCategories();