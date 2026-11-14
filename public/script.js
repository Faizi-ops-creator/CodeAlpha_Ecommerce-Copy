
let products = [];
let cart = [];

// Database se products load karna
async function displayProducts() {
    const productList = document.getElementById("product-list");

    try {
        const response = await fetch("/api/products");

        if (!response.ok) {
            throw new Error("Products load nahi hue");
        }

        products = await response.json();

        productList.innerHTML = "";

        products.forEach(product => {
            productList.innerHTML += `
                <div class="product-card">
                    <img
                        src="${product.image}"
                        alt="${product.name}"
                        onclick="showProductDetails(${product.id})"
                        style="cursor: pointer;"
                    >

                    <h3
                        onclick="showProductDetails(${product.id})"
                        style="cursor: pointer;"
                    >
                        ${product.name}
                    </h3>

                    <p>Price: Rs. ${product.price}</p>

                    <button onclick="addToCart(${product.id})">
                        Add to Cart
                    </button>

                    <button onclick="showProductDetails(${product.id})">
                        View Details
                    </button>
                </div>
            `;
        });

    } catch (error) {
        console.error(error);
        productList.textContent = "Products load nahi ho sake.";
    }
}

// Shopping Cart mein product add karna
function addToCart(productId) {
    const product = products.find(item => item.id === productId);
    const cartItem = cart.find(item => item.id === productId);

    if (!product) return;

    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    displayCart();
}

// Cart display karna
function displayCart() {
    const cartItems = document.getElementById("cart-items");
    const cartCount = document.getElementById("cart-count");
    const cartTotal = document.getElementById("cart-total");

    cartItems.innerHTML = "";

    let total = 0;
    let count = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        count += item.quantity;

        cartItems.innerHTML += `
            <div class="cart-item">
                <span>${item.name} x ${item.quantity}</span>
                <span>Rs. ${item.price * item.quantity}</span>
                <button onclick="removeFromCart(${item.id})">
                    Remove
                </button>
            </div>
        `;
    });

    cartCount.textContent = count;
    cartTotal.textContent = total;
}

// Cart se product remove karna
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    displayCart();
}

// Order place karna
document.getElementById("checkout-btn").addEventListener("click", async function() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
        alert("Please login before placing an order!");
        return;
    }

    const items = cart.map(item => ({
        productId: item.id,
        quantity: item.quantity
    }));

    try {
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ items })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        alert(data.message + " Order ID: " + data.orderId);

        cart = [];
        displayCart();

    } catch (error) {
        alert("Order place nahi ho saka. Please try again.");
    }
});

// Products aur Cart load karna
displayProducts();
displayCart();

// User Registration
document.getElementById("register-form").addEventListener("submit", async function(event) {
    event.preventDefault();

    const name = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;
    const message = document.getElementById("register-message");

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        message.textContent = data.message;
        message.style.color = response.ok ? "green" : "red";

        if (response.ok) {
            this.reset();
        }
    } catch (error) {
        message.textContent = "Server se connection nahi ho saka.";
        message.style.color = "red";
    }
});

// User Login
document.getElementById("login-form").addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const message = document.getElementById("login-message");

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        message.textContent = data.message;
        message.style.color = response.ok ? "green" : "red";

        if (response.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            this.reset();
        }
    } catch (error) {
        message.textContent = "Server se connection nahi ho saka.";
        message.style.color = "red";
    }
});

// Product Details show karna
function showProductDetails(productId) {
    const product = products.find(item => item.id === productId);

    if (!product) return;

    const detailsSection = document.getElementById("product-details");
    const detailsContent = document.getElementById("product-detail-content");

    detailsContent.innerHTML = `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <h4>Price: Rs. ${product.price}</h4>
            <p>${product.description || "No description available."}</p>

            <button onclick="addToCart(${product.id})">
                Add to Cart
            </button>
        </div>
    `;

    detailsSection.style.display = "block";

    detailsSection.scrollIntoView({
        behavior: "smooth"
    });
}

// Product Details band karna
function closeProductDetails() {
    document.getElementById("product-details").style.display = "none";

    document.getElementById("products").scrollIntoView({
        behavior: "smooth"
    });
}
