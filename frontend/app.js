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

// 2. Render the data to the screen (Now with Action Buttons)
function renderGrid(items) {
    grid.innerHTML = ''; 
    
    if (items.length === 0) {
        grid.innerHTML = '<p>No items found.</p>';
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        
        const categoryName = item.category ? item.category.name : 'Uncategorized';
        const kitsList = item.kits && item.kits.length > 0 
            ? item.kits.map(k => k.name).join(', ') 
            : 'No Kits';

        card.innerHTML = `
            <h3>${item.name}</h3>
            <p><strong>Qty:</strong> <span class="qty-badge">${item.quantity}</span></p>
            <p><strong>Location:</strong> ${item.location || 'Unassigned'}</p>
            <hr>
            <p><small>Category: ${categoryName}</small></p>
            <p><small>Type: ${item.assetType || 'N/A'}</small></p>
            <p><small>Kits: ${kitsList}</small></p>
            
            <div class="card-actions">
                <button class="edit-btn" onclick="updateQuantity('${item.id}')">Edit Qty</button>
                <button class="delete-btn" onclick="deleteItem('${item.id}')">Delete</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 3. Search functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredItems = inventoryData.filter(item => 
        item.name.toLowerCase().includes(searchTerm) || 
        (item.location && item.location.toLowerCase().includes(searchTerm))
    );
    renderGrid(filteredItems);
});

// --- NEW SECURITY FEATURES ---

// 4. Securely Delete an Item
async function deleteItem(id) {
    // Prompt the user for the admin password
    const token = prompt("🔒 Enter Admin Password to delete this item:");
    if (!token) return; // Cancel if they leave it blank

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            fetchInventory(); // Instantly reload the grid!
        } else {
            alert("❌ Unauthorized: Incorrect Admin Password.");
        }
    } catch (error) {
        alert("❌ Network error.");
    }
}

// 5. Securely Update Quantity
async function updateQuantity(id) {
    // Find the item in our local array to keep its other data intact
    const item = inventoryData.find(i => i.id === id);
    if (!item) return;

    // Ask for the new quantity
    const newQty = prompt(`Enter new quantity for ${item.name}:`, item.quantity);
    if (newQty === null || newQty === "") return; // Cancel if they hit escape

    // Prompt for the admin password
    const token = prompt("🔒 Enter Admin Password to authorize this change:");
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            // We must send the whole object back to Prisma, just with the updated quantity
            body: JSON.stringify({
                name: item.name,
                quantity: parseInt(newQty),
                location: item.location,
                assetType: item.assetType,
                categoryId: item.categoryId
            })
        });

        if (response.ok) {
            fetchInventory(); // Instantly reload the grid!
        } else {
            alert("❌ Unauthorized: Incorrect Admin Password.");
        }
    } catch (error) {
        alert("❌ Network error.");
    }
}

// Start the app
fetchInventory();