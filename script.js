// ================= DATA =================
var defaultProducts = [
  { id: 1, name: "Wireless Earbuds", price: 1999, category: "Electronics", image: "", description: "Bluetooth earbuds with a charging case and 20 hours of battery." },
  { id: 2, name: "Mechanical Keyboard", price: 3499, category: "Electronics", image: "", description: "Compact keyboard with blue switches and backlight." },
  { id: 3, name: "Cotton T-Shirt", price: 599, category: "Clothing", image: "", description: "Soft round-neck t-shirt, available in many colours." },
  { id: 4, name: "Running Shoes", price: 2799, category: "Footwear", image: "", description: "Lightweight shoes with a cushioned sole for daily runs." },
  { id: 5, name: "Steel Water Bottle", price: 449, category: "Home", image: "", description: "1 litre bottle that keeps water cold for 12 hours." },
  { id: 6, name: "Desk Lamp", price: 899, category: "Home", image: "", description: "LED lamp with three brightness levels." },
  { id: 7, name: "Notebook Pack (5)", price: 299, category: "Stationery", image: "", description: "Five ruled notebooks with 100 pages each." },
  { id: 8, name: "Backpack", price: 1299, category: "Bags", image: "", description: "Water-resistant backpack with a laptop compartment." }
];

var products = JSON.parse(localStorage.getItem("products")) || defaultProducts;
var cart = JSON.parse(localStorage.getItem("cart")) || [];
var editingId = null; 
cart = cart.filter(function (item) {
  return findProduct(item.id);
});

function saveData() {
  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("cart", JSON.stringify(cart));
}

// ================= HELPERS =================
function findProduct(id) {
  return products.find(function (p) {
    return p.id === id;
  });
}

function formatPrice(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

function escapeHTML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showToast(message) {
  var toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(function () {
    toast.classList.remove("show");
  }, 1800);
}

function thumb(p) {
  var hue = 0;
  for (var i = 0; i < p.name.length; i++) {
    hue = hue + p.name.charCodeAt(i) * 7;
  }
  hue = hue % 360;

  var img = "";
  if (p.image) {
    img = `<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" onerror="this.remove()">`;
  }
  return `<div class="thumb" style="--h:${hue}"><span>${escapeHTML(p.name.charAt(0).toUpperCase())}</span>${img}</div>`;
}

// ================= VIEWS =================
function showView(name) {
  document.getElementById("shopView").hidden = name !== "shop";
  document.getElementById("detailView").hidden = name !== "detail";
  document.getElementById("cartView").hidden = name !== "cart";

  if (name === "shop") renderProducts();
  if (name === "cart") renderCart();
  window.scrollTo(0, 0);
}

// ================= SHOW PRODUCTS (search, filter, sort) =================
function updateCategories() {
  var select = document.getElementById("category");
  var current = select.value || "all";
  var categories = [];

  products.forEach(function (p) {
    if (!categories.includes(p.category)) categories.push(p.category);
  });

  var options = '<option value="all">All categories</option>';
  var listOptions = "";
  categories.forEach(function (c) {
    options += `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`;
    listOptions += `<option value="${escapeHTML(c)}">`;
  });

  select.innerHTML = options;
  select.value = categories.includes(current) ? current : "all";
  document.getElementById("categoryList").innerHTML = listOptions;
}

function renderProducts() {
  updateCategories();

  var text = document.getElementById("search").value.toLowerCase();
  var category = document.getElementById("category").value;
  var sort = document.getElementById("sort").value;

  var list = products.filter(function (p) {
    var matchesText = p.name.toLowerCase().includes(text) || p.description.toLowerCase().includes(text);
    var matchesCategory = category === "all" || p.category === category;
    return matchesText && matchesCategory;
  });

  if (sort === "low") list.sort(function (a, b) { return a.price - b.price; });
  if (sort === "high") list.sort(function (a, b) { return b.price - a.price; });
  if (sort === "az") list.sort(function (a, b) { return a.name.localeCompare(b.name); });
  if (sort === "za") list.sort(function (a, b) { return b.name.localeCompare(a.name); });

  var grid = document.getElementById("productGrid");
  if (list.length === 0) {
    grid.innerHTML = '<p class="empty">No products match your search. Try a different word or category.</p>';
    return;
  }

  var html = "";
  list.forEach(function (p) {
    html += `
      <article class="card">
        ${thumb(p)}
        <div class="card-body">
          <p class="cat">${escapeHTML(p.category)}</p>
          <h3>${escapeHTML(p.name)}</h3>
          <p class="price">${formatPrice(p.price)}</p>
          <div class="card-actions">
            <button onclick="viewProduct(${p.id})">View</button>
            <button class="primary" onclick="addToCart(${p.id})">Add to cart</button>
            <button onclick="openForm(${p.id})">Edit</button>
            <button class="danger" onclick="deleteProduct(${p.id})">Delete</button>
          </div>
        </div>
      </article>`;
  });
  grid.innerHTML = html;
}

// ================= SHOW SINGLE PRODUCT =================
function viewProduct(id) {
  var p = findProduct(id);
  document.getElementById("detailView").innerHTML = `
    <button class="link" onclick="showView('shop')">Back to products</button>
    <div class="detail">
      ${thumb(p)}
      <div>
        <p class="cat">${escapeHTML(p.category)}</p>
        <h2>${escapeHTML(p.name)}</h2>
        <p class="price">${formatPrice(p.price)}</p>
        <p>${escapeHTML(p.description) || "No description added."}</p>
        <div class="card-actions">
          <button class="primary" onclick="addToCart(${p.id})">Add to cart</button>
          <button onclick="openForm(${p.id})">Edit</button>
          <button class="danger" onclick="deleteProduct(${p.id})">Delete</button>
        </div>
      </div>
    </div>`;
  showView("detail");
}

//  ================= ADD / EDIT PRODUCT =================
function openForm(id) {
  editingId = id || null;
  var p = editingId ? findProduct(editingId) : null;

  document.getElementById("formTitle").textContent = p ? "Edit product" : "Add product";
  document.getElementById("pName").value = p ? p.name : "";
  document.getElementById("pPrice").value = p ? p.price : "";
  document.getElementById("pCategory").value = p ? p.category : "";
  document.getElementById("pImage").value = p ? p.image : "";
  document.getElementById("pDesc").value = p ? p.description : "";

  updateCategories();
  document.getElementById("productDialog").showModal();
}

function closeForm() {
  document.getElementById("productDialog").close();
}

function saveProduct(event) {
  event.preventDefault();

  var name = document.getElementById("pName").value.trim();
  var price = Number(document.getElementById("pPrice").value);
  var category = document.getElementById("pCategory").value.trim();
  var image = document.getElementById("pImage").value.trim();
  var description = document.getElementById("pDesc").value.trim();

  if (name === "" || category === "" || price <= 0) {
    showToast("Enter a name, a category and a price above 0");
    return;
  }

  if (editingId) {
  
    var p = findProduct(editingId);
    p.name = name;
    p.price = price;
    p.category = category;
    p.image = image;
    p.description = description;
    showToast("Product updated");
  } else {
    var newId = 1;
    products.forEach(function (item) {
      if (item.id >= newId) newId = item.id + 1;
    });
    products.push({ id: newId, name: name, price: price, category: category, image: image, description: description });
    showToast("Product added");
  }

  saveData();
  closeForm();

  // go back to the right page
  if (editingId && !document.getElementById("detailView").hidden) {
    viewProduct(editingId);
  } else {
    showView("shop");
  }
  updateCartCount();
}

// ================= DELETE PRODUCT =================
function deleteProduct(id) {
  var p = findProduct(id);
  if (!confirm('Delete "' + p.name + '"?')) return;

  products = products.filter(function (item) { return item.id !== id; });
  cart = cart.filter(function (item) { return item.id !== id; });

  saveData();
  updateCartCount();
  showToast("Product deleted");
  showView("shop");
}

// ================= CART =================
function updateCartCount() {
  var count = 0;
  cart.forEach(function (item) { count += item.qty; });
  document.getElementById("cartCount").textContent = count;
}

function addToCart(id) {
  var item = cart.find(function (c) { return c.id === id; });
  if (item) {
    item.qty = item.qty + 1;
  } else {
    cart.push({ id: id, qty: 1 });
  }
  saveData();
  updateCartCount();
  showToast("Added to cart");
}

function changeQty(id, change) {
  var item = cart.find(function (c) { return c.id === id; });
  item.qty = item.qty + change;
  if (item.qty < 1) item.qty = 1; // use Remove to delete an item
  saveData();
  updateCartCount();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(function (c) { return c.id !== id; });
  saveData();
  updateCartCount();
  renderCart();
  showToast("Removed from cart");
}

function renderCart() {
  var box = document.getElementById("cartView");

  if (cart.length === 0) {
    box.innerHTML = `
      <h2>Your cart</h2>
      <p class="empty">Your cart is empty. Add a product to see it here.</p>
      <button class="primary" onclick="showView('shop')">Browse products</button>`;
    return;
  }

  var rows = "";
  var total = 0;
  var totalItems = 0;

  cart.forEach(function (item) {
    var p = findProduct(item.id);
    var lineTotal = p.price * item.qty;
    total = total + lineTotal;
    totalItems = totalItems + item.qty;

    rows += `
      <div class="cart-row">
        ${thumb(p)}
        <div class="cart-name">
          <strong>${escapeHTML(p.name)}</strong>
          <span>${formatPrice(p.price)} each</span>
        </div>
        <div class="qty">
          <button onclick="changeQty(${p.id}, -1)" aria-label="Decrease quantity">−</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${p.id}, 1)" aria-label="Increase quantity">+</button>
        </div>
        <strong class="line">${formatPrice(lineTotal)}</strong>
        <button class="danger" onclick="removeFromCart(${p.id})">Remove</button>
      </div>`;
  });

  box.innerHTML = `
    <h2>Your cart</h2>
    ${rows}
    <div class="summary">
      <span>${totalItems} item(s)</span>
      <strong>Total: ${formatPrice(total)}</strong>
    </div>`;
}

// ================= START =================
updateCartCount();
showView("shop");
