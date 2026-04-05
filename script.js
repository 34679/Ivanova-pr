// ========== ПЕРЕМЕННЫЕ ==========
let cart = [];
let currentUser = { isLoggedIn: false, name: "", email: "", phone: "" };
const demoUserProfile = {
    name: "Анна Иванова",
    email: "demo@lapkindom.ru",
    phone: "+7 (999) 123-45-67"
};

function getStoredUsers() {
    return JSON.parse(localStorage.getItem("users") || "[]");
}

function saveStoredUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

function ensureDemoUserAccount() {
    const users = getStoredUsers();
    const existingUser = users.find((user) => user.email === demoUserProfile.email);

    if (!existingUser) {
        users.push({
            ...demoUserProfile,
            registeredAt: new Date().toLocaleDateString("ru-RU")
        });
        saveStoredUsers(users);
    }
}

function ensureStorageCollections() {
    if (typeof petsData !== "undefined") {
        const savedPets = localStorage.getItem("petsData");
        if (savedPets) {
            try {
                petsData = JSON.parse(savedPets);
            } catch (error) {
                localStorage.setItem("petsData", JSON.stringify(petsData));
            }
        } else {
            localStorage.setItem("petsData", JSON.stringify(petsData));
        }
    }

    if (!localStorage.getItem("applications")) {
        localStorage.setItem("applications", JSON.stringify([]));
    }

    if (!localStorage.getItem("users")) {
        localStorage.setItem("users", JSON.stringify([]));
    }

    ensureDemoUserAccount();

    if (!localStorage.getItem("sponsorships")) {
        localStorage.setItem("sponsorships", JSON.stringify([]));
    }
}

function normalizeCartItem(rawItem) {
    if (!rawItem || typeof rawItem !== "object") {
        return null;
    }

    const id = Number(rawItem.id);
    const name = typeof rawItem.name === "string" ? rawItem.name.trim() : "";
    const parsedPrice = typeof rawItem.price === "number"
        ? rawItem.price
        : Number(String(rawItem.price ?? "").replace(/[^\d.-]/g, ""));
    const parsedQuantity = typeof rawItem.quantity === "number"
        ? rawItem.quantity
        : Number(String(rawItem.quantity ?? "1").replace(/[^\d-]/g, ""));

    if (!Number.isFinite(id) || !name) {
        return null;
    }

    return {
        id,
        name,
        price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
        quantity: Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1
    };
}

function normalizeCart(rawCart) {
    if (!Array.isArray(rawCart)) {
        return [];
    }

    const validPetIds = typeof petsData !== "undefined"
        ? new Set(petsData.map((pet) => Number(pet.id)))
        : null;

    return rawCart
        .map(normalizeCartItem)
        .filter((item) => item && (!validPetIds || validPetIds.has(item.id)));
}

// ========== ЗАГРУЗКА ИЗ LOCALSTORAGE ==========
function loadStorage() {
    ensureStorageCollections();

    const savedCart = localStorage.getItem("shelter_cart") || localStorage.getItem("cart");
    if (savedCart) {
        try {
            cart = normalizeCart(JSON.parse(savedCart));
        } catch(e) { 
            cart = []; 
        }
    }

    saveCartToLocal();
    
    const savedUser = localStorage.getItem("shelter_user") || localStorage.getItem("currentUser");
    if (savedUser) {
        try {
            const u = JSON.parse(savedUser);
            if (u.name || u.email || u.phone) {
                currentUser = { isLoggedIn: true, name: u.name || "", email: u.email || "", phone: u.phone || "" };
            }
        } catch(e) {}
    }
    updateCartBadge();
}

function saveCartToLocal() {
    localStorage.setItem("shelter_cart", JSON.stringify(cart));
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartBadge();
    renderCartModalContent();
}

function saveUserToLocal() {
    if (currentUser.isLoggedIn && (currentUser.name || currentUser.email || currentUser.phone)) {
        const userData = { 
            name: currentUser.name, 
            email: currentUser.email, 
            phone: currentUser.phone 
        };
        localStorage.setItem("shelter_user", JSON.stringify(userData));
        localStorage.setItem("currentUser", JSON.stringify(userData));
        syncUserList(userData);
    } else {
        localStorage.removeItem("shelter_user");
        localStorage.removeItem("currentUser");
    }
}

function syncUserList(userData) {
    const users = getStoredUsers();
    const userIndex = users.findIndex((user) => user.email && user.email === userData.email);
    const payload = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        registeredAt: userIndex >= 0 && users[userIndex].registeredAt
            ? users[userIndex].registeredAt
            : new Date().toLocaleDateString("ru-RU")
    };

    if (userIndex >= 0) {
        users[userIndex] = { ...users[userIndex], ...payload };
    } else if (payload.name || payload.email || payload.phone) {
        users.push(payload);
    }

    saveStoredUsers(users);
}

function getCartItemById(id) {
    return cart.find((item) => item.id === id);
}

// ========== КОРЗИНА ==========
window.addToCart = function(item) {
    const existing = getCartItemById(item.id);
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        cart.push({ 
            id: item.id, 
            name: item.name, 
            price: item.price, 
            quantity: 1 
        });
    }
    saveCartToLocal();
    showToast(`➕ ${item.name} добавлен(а) в корзину!`);
}

function updateCartItemQuantity(id, nextQuantity) {
    const item = getCartItemById(id);
    if (!item) return;

    if (nextQuantity <= 0) {
        cart = cart.filter((cartItem) => cartItem.id !== id);
    } else {
        item.quantity = nextQuantity;
    }

    saveCartToLocal();
}

function removeCartItem(id) {
    const item = getCartItemById(id);
    if (item) {
        cart = cart.filter((cartItem) => cartItem.id !== id);
        saveCartToLocal();
        showToast(`❌ ${item.name} удалён(а) из корзины`);
    }
}

function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const badge = document.getElementById("cartCountBadge");
    if (badge) {
        badge.innerText = totalItems;
        badge.style.display = totalItems > 0 ? "inline-flex" : "none";
    }
}

function renderCartModalContent() {
    const container = document.getElementById("cartItemsList");
    const totalContainer = document.getElementById("cartTotal");
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = `<div class="empty-cart"><i class="fas fa-box-open"></i><p>Корзина пуста</p><small>Добавьте питомца, чтобы помочь ему</small></div>`;
        totalContainer.innerHTML = ``;
        return;
    }
    
    let totalSum = 0;
    let html = ``;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalSum += itemTotal;
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div>${item.price} ₽ в месяц</div>
                </div>
                <div class="cart-item-actions">
                    <button class="quantity-btn" data-action="decrease" data-id="${item.id}" aria-label="Уменьшить количество">−</button>
                    <span class="cart-item-quantity">${item.quantity}</span>
                    <button class="quantity-btn" data-action="increase" data-id="${item.id}" aria-label="Увеличить количество">+</button>
                    <span class="cart-item-price">${itemTotal} ₽</span>
                    <button class="remove-item" data-id="${item.id}" aria-label="Удалить из корзины"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    totalContainer.innerHTML = `<strong>Итого: ${totalSum} ₽/мес</strong><p style="font-size: 0.8rem; margin-top: 8px;">Спасибо за вашу помощь!</p>`;
    
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id, 10);
            const item = getCartItemById(id);
            if (!item) return;

            const delta = btn.dataset.action === 'increase' ? 1 : -1;
            updateCartItemQuantity(id, item.quantity + delta);
        });
    });

    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
            removeCartItem(parseInt(btn.dataset.id));
        });
    });
}

function checkoutCart() {
    if (cart.length === 0) {
        showToast("Корзина пуста");
        return { requiresProfile: false, completed: false };
    }

    if (!currentUser.isLoggedIn || !currentUser.name) {
        showToast("Заполните профиль");
        return { requiresProfile: true, completed: false };
    }

    const sponsorships = JSON.parse(localStorage.getItem("sponsorships") || "[]");
    const applications = JSON.parse(localStorage.getItem("applications") || "[]");
    const today = new Date().toLocaleDateString("ru-RU");

    cart.forEach((item, index) => {
        sponsorships.push({
            id: Date.now() + index,
            animalId: item.id,
            animalName: item.name,
            userName: currentUser.name,
            userEmail: currentUser.email,
            userPhone: currentUser.phone,
            amount: item.price,
            quantity: item.quantity,
            startDate: today,
            status: "active"
        });

        applications.push({
            id: Date.now() + index + 1000,
            date: today,
            userName: currentUser.name,
            userPhone: currentUser.phone,
            animalName: item.name,
            animalId: item.id,
            quantity: item.quantity,
            amount: item.price,
            status: "pending"
        });
    });

    localStorage.setItem("sponsorships", JSON.stringify(sponsorships));
    localStorage.setItem("applications", JSON.stringify(applications));

    cart = [];
    saveCartToLocal();
    showToast(`Спасибо, ${currentUser.name}! Заявка отправлена.`);
    return { requiresProfile: false, completed: true };
}

function getPetTypeLabel(type) {
    const typeMap = {
        dog: "Собака",
        cat: "Кошка",
        other: "Друг"
    };

    return typeMap[type] || typeMap.other;
}

function renderPetModalContent(pet) {
    const body = document.getElementById("petModalBody");
    const title = document.getElementById("petModalTitle");
    const actionBtn = document.getElementById("petModalActionBtn");
    if (!body || !title || !actionBtn || !pet) return;

    const genderIcon = pet.gender === "Мальчик" ? "fa-mars" : "fa-venus";
    const typeLabel = getPetTypeLabel(pet.type);
    const priceLabel = pet.price > 0 ? `${pet.price} ₽/мес` : "Особая опека";
    const tags = [
        pet.breed && pet.breed !== "-" ? pet.breed : "Метис",
        pet.status,
        pet.gender
    ];

    title.textContent = pet.name;
    actionBtn.dataset.id = String(pet.id);
    actionBtn.dataset.name = pet.name;
    actionBtn.dataset.price = String(pet.price || 0);
    actionBtn.innerHTML = `<i class="fas fa-paw"></i> ${pet.price > 0 ? "Поддержать питомца" : "Помочь питомцу"}`;

    body.innerHTML = `
        <div class="pet-modal-layout">
            <div class="pet-modal-media">
                <img src="${pet.photoUrl || "https://via.placeholder.com/640x420"}" alt="${pet.name}" class="pet-modal-image">
                <div class="pet-modal-status">${pet.status}</div>
            </div>
            <div class="pet-modal-info">
                <div class="pet-modal-meta">
                    <span class="pet-modal-chip"><i class="fas fa-paw"></i> ${typeLabel}</span>
                    <span class="pet-modal-chip"><i class="fas ${genderIcon}"></i> ${pet.gender}</span>
                    <span class="pet-modal-chip"><i class="fas fa-calendar-alt"></i> ${pet.age}</span>
                </div>
                <div class="pet-modal-price">${priceLabel}</div>
                <div class="pet-modal-breed">${pet.breed && pet.breed !== "-" ? pet.breed : "Метис с большим сердцем"}</div>
                <p class="pet-modal-desc">${pet.fullDesc || pet.miniDesc}</p>
                <div class="pet-modal-tags">
                    ${tags.map((tag) => `<span class="pet-modal-tag">${tag}</span>`).join("")}
                </div>
            </div>
        </div>
    `;
}

window.openPetModal = function(petId) {
    const petModal = document.getElementById("petModal");
    if (!petModal || typeof petsData === "undefined") return;

    const pet = petsData.find((item) => item.id === petId);
    if (!pet) return;

    renderPetModalContent(pet);
    petModal.style.display = "flex";
};

// ========== МОДАЛЬНЫЕ ОКНА ==========
function initModals() {
    const profileModal = document.getElementById("profileModal");
    const cartModal = document.getElementById("cartModal");
    const petModal = document.getElementById("petModal");
    const openProfile = document.getElementById("openProfileBtn");
    const cartIcon = document.getElementById("cartIconBtn");
    const closeProfile = document.getElementById("closeProfileModal");
    const closeCart = document.getElementById("closeCartModal");
    const closePet = document.getElementById("closePetModal");
    const closePetFooter = document.getElementById("closePetModalFooter");
    const saveBtn = document.getElementById("saveProfileBtn");
    const loginBtn = document.getElementById("loginBtn");
    const logout = document.getElementById("logoutBtn");
    const checkout = document.getElementById("checkoutBtn");
    const petActionBtn = document.getElementById("petModalActionBtn");
    const authLoginTab = document.getElementById("authModeLoginBtn");
    const authRegisterTab = document.getElementById("authModeRegisterBtn");
    
    if (openProfile) {
        openProfile.onclick = () => {
            renderProfileModalState();
            profileModal.style.display = "flex";
        };
    }
    
    if (cartIcon) {
        cartIcon.onclick = () => {
            renderCartModalContent();
            cartModal.style.display = "flex";
        };
    }
    
    if (closeProfile) closeProfile.onclick = () => profileModal.style.display = "none";
    if (closeCart) closeCart.onclick = () => cartModal.style.display = "none";
    if (closePet) closePet.onclick = () => petModal.style.display = "none";
    if (closePetFooter) closePetFooter.onclick = () => petModal.style.display = "none";

    window.addEventListener("click", (e) => {
        if (e.target === profileModal) profileModal.style.display = "none";
        if (e.target === cartModal) cartModal.style.display = "none";
        if (e.target === petModal) petModal.style.display = "none";
    });
    
    if (saveBtn) saveBtn.onclick = saveProfile;
    if (loginBtn) loginBtn.onclick = loginAccount;
    if (logout) logout.onclick = logoutAccount;

    if (authLoginTab) {
        authLoginTab.onclick = () => renderProfileModalState("login");
    }

    if (authRegisterTab) {
        authRegisterTab.onclick = () => renderProfileModalState("register");
    }

    if (petActionBtn) {
        petActionBtn.onclick = () => {
            const id = parseInt(petActionBtn.dataset.id, 10);
            const name = petActionBtn.dataset.name;
            const price = parseInt(petActionBtn.dataset.price, 10);

            if (Number.isNaN(id)) return;

            window.addToCart({ id, name, price: Number.isNaN(price) ? 0 : price });
            if (petModal) petModal.style.display = "none";
        };
    }
    
    if (checkout) {
        checkout.onclick = () => {
            const result = checkoutCart();
            if (result.requiresProfile) {
                profileModal.style.display = "flex";
                return;
            }
            if (result.completed) {
                cartModal.style.display = "none";
            }
        };
    }
}

// ========== ПРОФИЛЬ ==========
function fillRegistrationForm() {
    const profileData = currentUser.isLoggedIn
        ? currentUser
        : demoUserProfile;

    document.getElementById("profileName").value = profileData.name || "";
    document.getElementById("profileEmail").value = profileData.email || "";
    document.getElementById("profilePhone").value = profileData.phone || "";
}

function fillLoginForm() {
    document.getElementById("loginEmail").value = currentUser.email || demoUserProfile.email;
    document.getElementById("loginPhone").value = currentUser.phone || demoUserProfile.phone;
}

function getCurrentUserDonationTotal() {
    if (!currentUser.isLoggedIn) {
        return 0;
    }

    const sponsorships = JSON.parse(localStorage.getItem("sponsorships") || "[]");

    return sponsorships.reduce((sum, sponsorship) => {
        const sameEmail = currentUser.email && sponsorship.userEmail === currentUser.email;
        const samePhone = currentUser.phone && sponsorship.userPhone === currentUser.phone;

        if (!sameEmail && !samePhone) {
            return sum;
        }

        const amount = Number(sponsorship.amount) || 0;
        const quantity = Number(sponsorship.quantity) || 1;
        return sum + (amount * quantity);
    }, 0);
}

function renderAccountPanel() {
    const nameField = document.getElementById("accountNameValue");
    const emailField = document.getElementById("accountEmailValue");
    const phoneField = document.getElementById("accountPhoneValue");
    const donationField = document.getElementById("accountDonationValue");
    const donationTotal = getCurrentUserDonationTotal();

    if (nameField) nameField.innerText = currentUser.name || "-";
    if (emailField) emailField.innerText = currentUser.email || "-";
    if (phoneField) phoneField.innerText = currentUser.phone || "-";
    if (donationField) donationField.innerText = `${donationTotal} ₽`;
}

function setAuthMode(mode) {
    const authSwitch = document.getElementById("authSwitch");
    const loginPanel = document.getElementById("loginPanel");
    const registerPanel = document.getElementById("registerPanel");
    const accountPanel = document.getElementById("accountPanel");
    const authLoginTab = document.getElementById("authModeLoginBtn");
    const authRegisterTab = document.getElementById("authModeRegisterBtn");

    if (!loginPanel || !registerPanel || !accountPanel) {
        return;
    }

    loginPanel.classList.toggle("active", mode === "login");
    registerPanel.classList.toggle("active", mode === "register");
    accountPanel.classList.toggle("active", mode === "account");

    if (authSwitch) {
        authSwitch.style.display = mode === "account" ? "none" : "grid";
    }

    if (authLoginTab) {
        authLoginTab.classList.toggle("active", mode === "login");
    }

    if (authRegisterTab) {
        authRegisterTab.classList.toggle("active", mode === "register");
    }
}

function renderProfileModalState(preferredMode) {
    if (currentUser.isLoggedIn) {
        renderAccountPanel();
        setAuthMode("account");
        return;
    }

    fillLoginForm();
    fillRegistrationForm();
    setAuthMode(preferredMode === "register" ? "register" : "login");
}

function saveProfile() {
    const name = document.getElementById("profileName").value.trim();
    const email = document.getElementById("profileEmail").value.trim();
    const phone = document.getElementById("profilePhone").value.trim();

    if (!name || !email || !phone) {
        showToast("Заполните имя, email и телефон");
        return;
    }

    currentUser.isLoggedIn = true;
    currentUser.name = name;
    currentUser.email = email;
    currentUser.phone = phone;
    saveUserToLocal();
    renderAccountPanel();
    setAuthMode("account");
    showToast("Регистрация завершена!");
}

function loginAccount() {
    const email = document.getElementById("loginEmail").value.trim();
    const phone = document.getElementById("loginPhone").value.trim();
    const user = getStoredUsers().find((item) => item.email === email && item.phone === phone);

    if (!user) {
        showToast("Пользователь не найден");
        return;
    }

    currentUser = {
        isLoggedIn: true,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || ""
    };

    saveUserToLocal();
    renderAccountPanel();
    setAuthMode("account");
    showToast(`С возвращением, ${currentUser.name}!`);
}

function logoutAccount() {
    currentUser = { isLoggedIn: false, name: "", email: "", phone: "" };
    saveUserToLocal();
    fillLoginForm();
    fillRegistrationForm();
    setAuthMode("login");
    showToast("Вы вышли из аккаунта");
    document.getElementById("profileModal").style.display = "none";
}

// ========== TOAST ==========
let toastTimeout = null;
function showToast(msg) {
    const toast = document.getElementById("toastMessage");
    toast.innerText = msg;
    toast.classList.add("show");
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// ========== МОБИЛЬНОЕ МЕНЮ ==========
function initMobileMenu() {
    const mobileBtn = document.getElementById("mobileMenuBtn");
    const navLinks = document.querySelector(".nav-links");

    if (!mobileBtn || !navLinks || mobileBtn.dataset.menuReady === "true") {
        return;
    }

    const closeMenu = () => {
        navLinks.classList.remove("active");
        mobileBtn.classList.remove("active");
        mobileBtn.setAttribute("aria-expanded", "false");
        document.body.classList.remove("mobile-menu-open");
    };

    const toggleMenu = () => {
        const isOpen = navLinks.classList.toggle("active");
        mobileBtn.classList.toggle("active", isOpen);
        mobileBtn.setAttribute("aria-expanded", String(isOpen));
        document.body.classList.toggle("mobile-menu-open", isOpen);
    };

    mobileBtn.dataset.menuReady = "true";
    mobileBtn.setAttribute("aria-label", "Открыть меню");
    mobileBtn.setAttribute("aria-expanded", "false");

    mobileBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleMenu();
    });

    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
        if (!navLinks.classList.contains("active")) {
            return;
        }

        if (!navLinks.contains(event.target) && !mobileBtn.contains(event.target)) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            closeMenu();
        }
    });
}

// ========== ЗАПУСК ==========
function init() {
    loadStorage();
    initModals();
    initMobileMenu();
    
    // Анимация появления элементов при скролле
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.feature-card, .step-card, .testimonial-card').forEach(el => {
        el.style.opacity = "0";
        el.style.transform = "translateY(30px)";
        el.style.transition = "all 0.6s ease";
        observer.observe(el);
    });
}

init();