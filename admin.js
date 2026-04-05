// ==================== АДМИН-ПАНЕЛЬ ====================

// Данные для админки (в реальном проекте данные берутся с сервера)
let adminAnimals = [];
let adminApplications = [];
let adminUsers = [];
let adminSponsorships = [];

// Текущий редактируемый ID
let editingAnimalId = null;

function initMobileMenu() {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');

    if (!mobileBtn || !navLinks || mobileBtn.dataset.menuReady === 'true') {
        return;
    }

    const closeMenu = () => {
        navLinks.classList.remove('active');
        mobileBtn.classList.remove('active');
        mobileBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('mobile-menu-open');
    };

    const toggleMenu = () => {
        const isOpen = navLinks.classList.toggle('active');
        mobileBtn.classList.toggle('active', isOpen);
        mobileBtn.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('mobile-menu-open', isOpen);
    };

    mobileBtn.dataset.menuReady = 'true';
    mobileBtn.setAttribute('aria-label', 'Открыть меню');
    mobileBtn.setAttribute('aria-expanded', 'false');

    mobileBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleMenu();
    });

    navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', (event) => {
        if (!navLinks.classList.contains('active')) {
            return;
        }

        if (!navLinks.contains(event.target) && !mobileBtn.contains(event.target)) {
            closeMenu();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMenu();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeMenu();
        }
    });
}

// Проверка авторизации
function checkAdminAuth() {
    const isAdmin = localStorage.getItem('adminAuthenticated') === 'true';
    const adminAuthDiv = document.getElementById('adminAuth');
    const adminPanelDiv = document.getElementById('adminPanel');
    
    if (isAdmin) {
        adminAuthDiv.style.display = 'none';
        adminPanelDiv.style.display = 'block';
        loadAdminData();
        loadSettings();
    } else {
        adminAuthDiv.style.display = 'flex';
        adminPanelDiv.style.display = 'none';
    }
}

// Загрузка данных из localStorage
function loadAdminData() {
    // Загружаем животных из глобального массива petsData
    if (typeof petsData !== 'undefined') {
        adminAnimals = [...petsData];
    } else {
        adminAnimals = JSON.parse(localStorage.getItem('petsData') || '[]');
    }
    
    // Загружаем заявки
    adminApplications = JSON.parse(localStorage.getItem('applications') || '[]');
    
    // Загружаем пользователей
    adminUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Загружаем опеку
    adminSponsorships = JSON.parse(localStorage.getItem('sponsorships') || '[]');
    
    // Обновляем статистику
    updateAdminStats();
    
    // Рендерим таблицы
    renderAnimalsTable();
    renderApplicationsTable();
    renderUsersList();
    renderSponsorshipsList();
}

// Обновление статистики
function updateAdminStats() {
    const totalAnimals = adminAnimals.length;
    const totalAdopted = adminAnimals.filter(animal => animal.status === 'Найден дом').length;
    const totalUsers = adminUsers.length;
    const totalSponsorships = adminSponsorships.length;
    
    document.getElementById('totalAnimals').textContent = totalAnimals;
    document.getElementById('totalAdopted').textContent = totalAdopted;
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('totalSponsorships').textContent = totalSponsorships;
}

// Рендеринг таблицы животных
function renderAnimalsTable() {
    const tbody = document.getElementById('animalsTableBody');
    if (!tbody) return;
    
    const searchTerm = document.getElementById('searchAnimals')?.value.toLowerCase() || '';
    
    let filteredAnimals = adminAnimals.filter(animal => 
        animal.name.toLowerCase().includes(searchTerm)
    );
    
    if (filteredAnimals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Нет животных</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredAnimals.map(animal => `
        <tr>
            <td>
                <img src="${animal.photoUrl || 'https://via.placeholder.com/50'}" alt="${animal.name}" class="animal-thumb">
            </td>
            <td><strong>${animal.name}</strong></td>
            <td>${animal.type === 'dog' ? 'Собака' : animal.type === 'cat' ? 'Кошка' : 'Другое'}</td>
            <td>${animal.age}</td>
            <td>
                <span class="status-badge status-${animal.status === 'Ищет дом' ? 'available' : 'adopted'}">
                    ${animal.status}
                </span>
            </td>
            <td>${animal.price} ₽</td>
            <td class="action-btns">
                <button class="btn-icon edit" onclick="editAnimal(${animal.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete" onclick="deleteAnimal(${animal.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Редактирование животного
function editAnimal(id) {
    const animal = adminAnimals.find(a => a.id === id);
    if (!animal) return;
    
    editingAnimalId = id;
    document.getElementById('animalModalTitle').textContent = 'Редактировать животное';
    document.getElementById('animalName').value = animal.name;
    document.getElementById('animalType').value = animal.type;
    document.getElementById('animalBreed').value = animal.breed || '';
    document.getElementById('animalAge').value = animal.age;
    document.getElementById('animalGender').value = animal.gender;
    document.getElementById('animalStatus').value = animal.status;
    document.getElementById('animalPrice').value = animal.price;
    document.getElementById('animalMiniDesc').value = animal.miniDesc || '';
    document.getElementById('animalFullDesc').value = animal.fullDesc || '';
    document.getElementById('animalPhoto').value = animal.photoUrl || '';
    
    document.getElementById('animalModal').classList.add('active');
}

// Удаление животного
function deleteAnimal(id) {
    if (confirm('Вы уверены, что хотите удалить это животное?')) {
        adminAnimals = adminAnimals.filter(a => a.id !== id);
        
        // Обновляем глобальный массив если есть
        if (typeof petsData !== 'undefined') {
            petsData = adminAnimals;
        }
        
        localStorage.setItem('petsData', JSON.stringify(adminAnimals));
        renderAnimalsTable();
        updateAdminStats();
        showToast('Животное удалено', 'success');
        
        // Обновляем каталог если страница открыта
        if (typeof loadCatalog === 'function') loadCatalog();
        if (typeof loadPopularPets === 'function') loadPopularPets();
    }
}

// Сохранение животного
function saveAnimal() {
    const animalData = {
        id: editingAnimalId || Date.now(),
        name: document.getElementById('animalName').value,
        type: document.getElementById('animalType').value,
        breed: document.getElementById('animalBreed').value,
        age: document.getElementById('animalAge').value,
        gender: document.getElementById('animalGender').value,
        status: document.getElementById('animalStatus').value,
        price: parseInt(document.getElementById('animalPrice').value),
        miniDesc: document.getElementById('animalMiniDesc').value,
        fullDesc: document.getElementById('animalFullDesc').value,
        photoUrl: document.getElementById('animalPhoto').value,
        inCart: false
    };
    
    if (!animalData.name) {
        showToast('Пожалуйста, заполните имя животного', 'error');
        return;
    }
    
    if (editingAnimalId) {
        const index = adminAnimals.findIndex(a => a.id === editingAnimalId);
        if (index !== -1) {
            adminAnimals[index] = { ...adminAnimals[index], ...animalData };
            showToast('Животное обновлено', 'success');
        }
        editingAnimalId = null;
    } else {
        adminAnimals.push(animalData);
        showToast('Животное добавлено', 'success');
    }
    
    // Обновляем глобальный массив
    if (typeof petsData !== 'undefined') {
        petsData = adminAnimals;
    }
    
    localStorage.setItem('petsData', JSON.stringify(adminAnimals));
    renderAnimalsTable();
    updateAdminStats();
    closeModal();
    
    // Обновляем каталог
    if (typeof loadCatalog === 'function') loadCatalog();
    if (typeof loadPopularPets === 'function') loadPopularPets();
}

// Рендеринг таблицы заявок
function renderApplicationsTable() {
    const tbody = document.getElementById('applicationsTableBody');
    if (!tbody) return;
    
    const filter = document.getElementById('applicationFilter')?.value || 'all';
    
    let filteredApps = adminApplications.filter(app => {
        if (filter === 'all') return true;
        return app.status === filter;
    });
    
    if (filteredApps.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Нет заявок</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredApps.map(app => `
        <tr>
            <td>#${app.id}</td>
            <td>${app.date || new Date().toLocaleDateString()}</td>
            <td>${app.userName}</td>
            <td>${app.userPhone || '-'}</td>
            <td>${app.animalName}</td>
            <td>
                <span class="status-badge status-${app.status}">
                    ${app.status === 'pending' ? 'На рассмотрении' : 
                      app.status === 'approved' ? 'Одобрена' : 'Отклонена'}
                </span>
            </td>
            <td class="action-btns">
                <button class="btn-icon view" onclick="viewApplication(${app.id})">
                    <i class="fas fa-eye"></i>
                </button>
                ${app.status === 'pending' ? `
                    <button class="btn-icon edit" onclick="approveApplication(${app.id})">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-icon delete" onclick="rejectApplication(${app.id})">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// Просмотр заявки
function viewApplication(id) {
    const app = adminApplications.find(a => a.id === id);
    if (!app) return;
    
    const modalBody = document.getElementById('applicationDetails');
    modalBody.innerHTML = `
        <p><strong>Заявитель:</strong> ${app.userName}</p>
        <p><strong>Телефон:</strong> ${app.userPhone || '-'}</p>
        <p><strong>Email:</strong> ${app.userEmail || '-'}</p>
        <p><strong>Животное:</strong> ${app.animalName}</p>
        <p><strong>Дата подачи:</strong> ${app.date || new Date().toLocaleDateString()}</p>
        <p><strong>Комментарий:</strong> ${app.comment || 'Нет комментария'}</p>
    `;
    
    window.currentApplicationId = id;
    document.getElementById('applicationModal').classList.add('active');
}

// Одобрение заявки
function approveApplication(id) {
    const app = adminApplications.find(a => a.id === id);
    if (app) {
        app.status = 'approved';
        
        // Обновляем статус животного
        const animal = adminAnimals.find(a => a.name === app.animalName);
        if (animal) {
            animal.status = 'Найден дом';
        }
        
        localStorage.setItem('applications', JSON.stringify(adminApplications));
        localStorage.setItem('petsData', JSON.stringify(adminAnimals));
        
        renderApplicationsTable();
        renderAnimalsTable();
        updateAdminStats();
        showToast('Заявка одобрена', 'success');
        
        // Обновляем каталог
        if (typeof loadCatalog === 'function') loadCatalog();
        if (typeof loadPopularPets === 'function') loadPopularPets();
    }
    closeApplicationModal();
}

// Отклонение заявки
function rejectApplication(id) {
    const app = adminApplications.find(a => a.id === id);
    if (app) {
        app.status = 'rejected';
        localStorage.setItem('applications', JSON.stringify(adminApplications));
        renderApplicationsTable();
        showToast('Заявка отклонена', 'info');
    }
    closeApplicationModal();
}

// Рендеринг списка пользователей
function renderUsersList() {
    const container = document.getElementById('usersList');
    if (!container) return;
    
    if (adminUsers.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет зарегистрированных пользователей</div>';
        return;
    }
    
    container.innerHTML = adminUsers.map(user => `
        <div class="user-card">
            <div class="user-avatar">
                ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div class="user-info">
                <h4>${user.name || 'Не указано'}</h4>
                <p><i class="fas fa-envelope"></i> ${user.email || '-'}</p>
                <p><i class="fas fa-phone"></i> ${user.phone || '-'}</p>
                <p><i class="fas fa-calendar"></i> Регистрация: ${user.registeredAt || new Date().toLocaleDateString()}</p>
            </div>
        </div>
    `).join('');
}

// Рендеринг списка опеки
function renderSponsorshipsList() {
    const container = document.getElementById('sponsorshipsList');
    if (!container) return;
    
    if (adminSponsorships.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет активных опек</div>';
        return;
    }
    
    container.innerHTML = adminSponsorships.map(sponsorship => `
        <div class="sponsorship-card">
            <div class="sponsorship-info">
                <h4>${sponsorship.animalName}</h4>
                <p><i class="fas fa-user"></i> ${sponsorship.userName}</p>
                <p><i class="fas fa-phone"></i> ${sponsorship.userPhone || '-'}</p>
                <p><i class="fas fa-calendar"></i> С ${sponsorship.startDate}</p>
            </div>
            <div class="sponsorship-amount">
                ${sponsorship.amount} ₽/мес
            </div>
        </div>
    `).join('');
}

// Сохранение настроек
function saveSettings() {
    const settings = {
        shelterName: document.getElementById('shelterName').value,
        shelterPhone: document.getElementById('shelterPhone').value,
        shelterEmail: document.getElementById('shelterEmail').value,
        shelterAddress: document.getElementById('shelterAddress').value,
        shelterDescription: document.getElementById('shelterDescription').value
    };
    
    localStorage.setItem('shelterSettings', JSON.stringify(settings));
    showToast('Настройки сохранены', 'success');
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('shelterSettings') || 'null');

    if (!settings) {
        return;
    }

    const shelterName = document.getElementById('shelterName');
    const shelterPhone = document.getElementById('shelterPhone');
    const shelterEmail = document.getElementById('shelterEmail');
    const shelterAddress = document.getElementById('shelterAddress');
    const shelterDescription = document.getElementById('shelterDescription');

    if (shelterName) shelterName.value = settings.shelterName || '';
    if (shelterPhone) shelterPhone.value = settings.shelterPhone || '';
    if (shelterEmail) shelterEmail.value = settings.shelterEmail || '';
    if (shelterAddress) shelterAddress.value = settings.shelterAddress || '';
    if (shelterDescription) shelterDescription.value = settings.shelterDescription || '';
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('animalModal').classList.remove('active');
    document.getElementById('animalModalTitle').textContent = 'Добавить животное';
    document.getElementById('animalForm').reset();
    editingAnimalId = null;
}

function closeApplicationModal() {
    document.getElementById('applicationModal').classList.remove('active');
    window.currentApplicationId = null;
}

// Показ уведомления
function showToast(message, type = 'success') {
    const toast = document.getElementById('toastMessage');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Переключение вкладок
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
}

// Инициализация админки
function initAdmin() {
    // Проверка авторизации
    initMobileMenu();
    checkAdminAuth();
    
    // Вход в админку
    const loginBtn = document.getElementById('loginAdminBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const password = document.getElementById('adminPassword').value;
            if (password === 'admin123') {
                localStorage.setItem('adminAuthenticated', 'true');
                document.getElementById('adminPassword').value = '';
                checkAdminAuth();
                showToast('Добро пожаловать в админ-панель!', 'success');
            } else {
                showToast('Неверный пароль', 'error');
            }
        });
    }

    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                loginBtn?.click();
            }
        });
    }

    const logoutAdminBtn = document.getElementById('logoutAdminBtn');

    if (logoutAdminBtn) {
        logoutAdminBtn.addEventListener('click', () => {
            localStorage.removeItem('adminAuthenticated');
            checkAdminAuth();
            showToast('Вы вышли из админки', 'info');
        });
    }
    
    // Кнопка добавления животного
    const addBtn = document.getElementById('addAnimalBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            document.getElementById('animalModalTitle').textContent = 'Добавить животное';
            document.getElementById('animalForm').reset();
            editingAnimalId = null;
            document.getElementById('animalModal').classList.add('active');
        });
    }
    
    // Поиск
    const searchInput = document.getElementById('searchAnimals');
    if (searchInput) {
        searchInput.addEventListener('input', renderAnimalsTable);
    }
    
    // Фильтр заявок
    const filterSelect = document.getElementById('applicationFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', renderApplicationsTable);
    }
    
    // Сохранение настроек
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    // Закрытие модальных окон
    const animalModal = document.getElementById('animalModal');
    const applicationModal = document.getElementById('applicationModal');
    const animalCloseBtn = animalModal?.querySelector('.close-modal');
    const animalCancelBtn = animalModal?.querySelector('.cancel-modal');
    const applicationCloseBtn = applicationModal?.querySelector('.close-modal');

    if (animalCloseBtn) {
        animalCloseBtn.addEventListener('click', closeModal);
    }

    if (animalCancelBtn) {
        animalCancelBtn.addEventListener('click', closeModal);
    }

    if (applicationCloseBtn) {
        applicationCloseBtn.addEventListener('click', closeApplicationModal);
    }

    [animalModal, applicationModal].forEach((modal) => {
        if (!modal) {
            return;
        }

        modal.addEventListener('click', (event) => {
            if (event.target !== modal) {
                return;
            }

            if (modal.id === 'applicationModal') {
                closeApplicationModal();
                return;
            }

            closeModal();
        });
    });
    
    // Сохранение животного
    const saveAnimalBtn = document.querySelector('.save-animal');
    if (saveAnimalBtn) {
        saveAnimalBtn.addEventListener('click', saveAnimal);
    }
    
    // Кнопки в модальном окне заявки
    const approveBtn = document.querySelector('.approve-app');
    const rejectBtn = document.querySelector('.reject-app');
    
    if (approveBtn) {
        approveBtn.addEventListener('click', () => {
            if (window.currentApplicationId) {
                approveApplication(window.currentApplicationId);
            }
        });
    }
    
    if (rejectBtn) {
        rejectBtn.addEventListener('click', () => {
            if (window.currentApplicationId) {
                rejectApplication(window.currentApplicationId);
            }
        });
    }
    
    // Инициализация вкладок
    initTabs();
}

// Загрузка при загрузке страницы
document.addEventListener('DOMContentLoaded', initAdmin);