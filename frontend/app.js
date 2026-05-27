const API_URL = 'http://localhost:3000/api/items';
const grid = document.getElementById('inventoryGrid');
const searchInput = document.getElementById('searchInput');

let inventoryData = [];

// 1. Fetch data from the backend
async function fetchInventory() {
    try {
        const response = await fetch(API_URL);
        inventoryData = await response.json();
        renderGrid(inventoryData);
    } catch (error) {
        console.error('Failed to fetch items:', error);
        grid.innerHTML = '<p>Error loading inventory. Is the backend running?</p>';
    }
}

// 2. Render the data to the screen
function renderGrid(items) {
    grid.innerHTML = ''; // Clear loading text
    
    if (items.length === 0) {
        grid.innerHTML = '<p>No items found.</p>';
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Safely extract category and kits if they exist
        const categoryName = item.category ? item.category.name : 'Uncategorized';
        const kitsList = item.kits && item.kits.length > 0 
            ? item.kits.map(k => k.name).join(', ') 
            : 'No Kits';

        card.innerHTML = `
            <h3>${item.name}</h3>
            <p><strong>Qty:</strong> ${item.quantity}</p>
            <p><strong>Location:</strong> ${item.location}</p>
            <hr>
            <p><small>Category: ${categoryName}</small></p>
            <p><small>Kits: ${kitsList}</small></p>
        `;
        grid.appendChild(card);
    });
}

// 3. Add Search functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredItems = inventoryData.filter(item => 
        item.name.toLowerCase().includes(searchTerm) || 
        item.location.toLowerCase().includes(searchTerm)
    );
    renderGrid(filteredItems);
});

// Start the app
fetchInventory();