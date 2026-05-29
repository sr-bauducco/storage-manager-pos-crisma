const API_URL = 'http://localhost:3000/api'; // Apontando para o seu backend na Oracle Cloud
const form = document.getElementById('addItemForm');
const categorySelect = document.getElementById('categoryId');
const statusMessage = document.getElementById('statusMessage');

// 1. Busca as Categorias quando a página carrega
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const categories = await response.json();
        
        // Traduzido e deixando claro que é opcional
        categorySelect.innerHTML = '<option value="">-- Selecione uma Categoria (Opcional) --</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id; // Envia o ID para o Prisma
            option.textContent = cat.name; // Mostra o nome para o usuário
            categorySelect.appendChild(option);
        });
    } catch (error) {
        categorySelect.innerHTML = '<option value="">Erro ao carregar categorias</option>';
    }
}

// 2. Lida com o Envio do Formulário
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede a página de recarregar
    statusMessage.textContent = 'Salvando...';
    statusMessage.className = '';

    // Coleta os valores dos campos opcionais
    const categoryValue = document.getElementById('categoryId').value;
    const kitValue = document.getElementById('kit').value.trim();

    // Coleta o token de admin (se o elemento existir no HTML)
    const tokenInput = document.getElementById('adminToken');
    const token = tokenInput ? tokenInput.value : '';

    // Monta os dados
    const itemData = {
        name: document.getElementById('name').value.trim(),
        quantity: parseInt(document.getElementById('quantity').value, 10),
        categoryId: categoryValue ? categoryValue : null, // Envia nulo se estiver vazio
        kit: kitValue ? kitValue : null // Envia nulo se estiver vazio
    };

    try {
        const response = await fetch(`${API_URL}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Injeta a chave de segurança
            },
            body: JSON.stringify(itemData)
        });

        if (response.ok) {
            statusMessage.textContent = '✅ Item adicionado com sucesso!';
            statusMessage.className = 'success';
            form.reset(); // Limpa o formulário
            loadCategories(); // Recarrega as categorias por precaução
        } else if (response.status === 401) {
            statusMessage.textContent = '❌ Não autorizado: Senha de Admin incorreta.';
            statusMessage.className = 'error';
        } else {
            statusMessage.textContent = '❌ Falha ao adicionar item. Verifique os logs do servidor.';
            statusMessage.className = 'error';
        }
    } catch (error) {
        statusMessage.textContent = '❌ Erro de rede. O backend está rodando?';
        statusMessage.className = 'error';
    }
});

// Inicia o aplicativo
loadCategories();