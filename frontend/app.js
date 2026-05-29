const API_URL = 'http://localhost:3000/api'; // Apontando para o seu servidor Oracle
const grid = document.getElementById('inventoryGrid');
const searchInput = document.getElementById('searchInput');
const loadingText = document.getElementById('loadingText');

let inventoryData = [];
let selectedIds = [];

// ==========================================
// 1. BUSCAR DADOS DO BACKEND
// ==========================================
async function fetchInventory() {
    try {
        const response = await fetch(`${API_URL}/items`);
        inventoryData = await response.json();
        renderGrid(inventoryData);
    } catch (error) {
        console.error('Falha ao buscar itens:', error);
        loadingText.innerHTML = '❌ Erro ao carregar estoque. O backend está rodando?';
        loadingText.style.color = '#ef4444';
    }
}

// ==========================================
// 2. RENDERIZAR A GRADE (COM CHECKBOXES)
// ==========================================
function renderGrid(items) {
    grid.innerHTML = ''; 
    loadingText.style.display = 'none';
    
    if (items.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1 / -1;">Nenhum item encontrado.</p>';
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        
        const categoryName = item.category ? item.category.name : (item.categoryId || 'Sem Categoria');
        const kitBadge = item.kit ? `<small class="kit-badge">📦 ${item.kit}</small>` : '';
        const categoryBadge = categoryName !== 'Sem Categoria' ? `<small>🏷️ ${categoryName}</small>` : '';
        
        const isChecked = selectedIds.includes(item.id) ? 'checked' : '';

        card.innerHTML = `
            <input type="checkbox" class="card-checkbox" value="${item.id}" onchange="toggleSelection(this)" ${isChecked}>
            
            <h3>
                ${item.name} 
                <span class="qty-badge">Qtd: ${item.quantity || 1}</span>
            </h3>
            
            <div style="margin-bottom: 10px;">
                ${categoryBadge}
                ${kitBadge}
            </div>
            
            <hr>
            
            <div class="card-actions">
                <button class="edit-btn" onclick="updateQuantity('${item.id}')">✏️ Editar Qtd</button>
                <button class="delete-btn" onclick="deleteItem('${item.id}')">🗑️ Excluir</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ==========================================
// 3. SISTEMA DE PESQUISA
// ==========================================
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredItems = inventoryData.filter(item => 
        item.name.toLowerCase().includes(searchTerm) || 
        (item.kit && item.kit.toLowerCase().includes(searchTerm))
    );
    renderGrid(filteredItems);
});

// ==========================================
// 4. AÇÕES INDIVIDUAIS
// ==========================================
async function deleteItem(id) {
    const token = prompt("🔒 Digite a Senha do Admin para excluir este item:");
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/items/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            fetchInventory(); 
        } else {
            alert("❌ Não autorizado: Senha Incorreta.");
        }
    } catch (error) {
        alert("❌ Erro de rede.");
    }
}

async function updateQuantity(id) {
    const item = inventoryData.find(i => i.id === id);
    if (!item) return;

    const newQty = prompt(`Digite a nova quantidade para ${item.name}:`, item.quantity || 1);
    if (newQty === null || newQty === "") return;

    const token = prompt("🔒 Digite a Senha do Admin para autorizar:");
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/items/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                name: item.name,
                quantity: parseInt(newQty, 10),
                categoryId: item.categoryId || null,
                kit: item.kit || null
            })
        });

        if (response.ok) {
            fetchInventory(); 
        } else {
            alert("❌ Não autorizado: Senha Incorreta.");
        }
    } catch (error) {
        alert("❌ Erro de rede.");
    }
}

// ==========================================
// 5. AÇÕES EM LOTE (BULK ACTIONS)
// ==========================================
function toggleSelection(checkbox) {
    if (checkbox.checked) {
        if (!selectedIds.includes(checkbox.value)) {
            selectedIds.push(checkbox.value);
        }
    } else {
        selectedIds = selectedIds.filter(id => id !== checkbox.value);
    }
    updateBulkActionBar();
}

function updateBulkActionBar() {
    const bar = document.getElementById('bulkActionsBar');
    const countSpan = document.getElementById('selectedCount');
    
    if (selectedIds.length > 0) {
        bar.style.display = 'flex';
        countSpan.textContent = `${selectedIds.length} selecionado(s)`;
    } else {
        bar.style.display = 'none';
    }
}

async function deleteSelected() {
    const token = document.getElementById('bulkAdminToken').value.trim();
    if (!token) return alert('Atenção: Digite a senha do Admin na barra inferior.');
    
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.length} itens?`)) return;

    try {
        const response = await fetch(`${API_URL}/items/bulk-delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ids: selectedIds })
        });

        if (response.ok) {
            alert('Itens excluídos com sucesso!');
            resetBulkSelection();
            fetchInventory();
        } else {
            alert('❌ Falha na exclusão. Verifique a senha.');
        }
    } catch (error) {
        alert('Erro ao conectar com o servidor.');
    }
}

async function assignKitToSelected() {
    const token = document.getElementById('bulkAdminToken').value.trim();
    const kitName = document.getElementById('bulkKitName').value.trim();
    
    if (!token) return alert('Atenção: Digite a senha do Admin na barra inferior.');
    if (!kitName) return alert('Atenção: Digite o nome do Kit!');

    try {
        const response = await fetch(`${API_URL}/items/bulk-kit`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ids: selectedIds, kitName: kitName })
        });

        if (response.ok) {
            alert(`Itens agrupados no kit "${kitName}" com sucesso!`);
            resetBulkSelection();
            fetchInventory();
        } else {
            alert('❌ Falha ao agrupar. Verifique a senha.');
        }
    } catch (error) {
        alert('Erro ao conectar com o servidor.');
    }
}

function resetBulkSelection() {
    selectedIds = [];
    document.getElementById('bulkAdminToken').value = '';
    document.getElementById('bulkKitName').value = '';
    updateBulkActionBar();
    
    document.querySelectorAll('.card-checkbox').forEach(cb => cb.checked = false);
}

// INICIAR APLICATIVO
fetchInventory();