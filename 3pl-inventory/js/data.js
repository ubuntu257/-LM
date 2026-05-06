// 3PL Inventory - Data Layer (localStorage CRUD)
const DB = {
  KEYS: { COMPANIES:'3pl_companies', PRODUCTS:'3pl_products', TRANSACTIONS:'3pl_transactions', CURRENT_USER:'3pl_current_user', OUTBOUND_REQUESTS:'3pl_outbound_requests' },

  init() {
    if (!localStorage.getItem(this.KEYS.COMPANIES)) {
      this.save(this.KEYS.COMPANIES, SampleData.companies);
      this.save(this.KEYS.PRODUCTS, SampleData.products);
      this.save(this.KEYS.TRANSACTIONS, SampleData.generateTransactions());
    }
  },

  save(key, data) { localStorage.setItem(key, JSON.stringify(data)); },
  load(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } },

  // Companies
  getCompanies() { return this.load(this.KEYS.COMPANIES); },
  getCompany(id) { return this.getCompanies().find(c => c.id === id); },

  // Products
  getProducts(companyId) {
    const all = this.load(this.KEYS.PRODUCTS);
    return companyId && companyId !== 'comp_admin' ? all.filter(p => p.companyId === companyId) : all;
  },
  getProduct(id) { return this.load(this.KEYS.PRODUCTS).find(p => p.id === id); },
  addProduct(product) {
    const products = this.load(this.KEYS.PRODUCTS);
    product.id = 'prod_' + Date.now();
    product.lastUpdated = new Date().toISOString();
    products.push(product);
    this.save(this.KEYS.PRODUCTS, products);
    return product;
  },
  updateProduct(id, updates) {
    const products = this.load(this.KEYS.PRODUCTS);
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...updates, lastUpdated: new Date().toISOString() };
    this.save(this.KEYS.PRODUCTS, products);
    return products[idx];
  },
  deleteProduct(id) {
    const products = this.load(this.KEYS.PRODUCTS).filter(p => p.id !== id);
    this.save(this.KEYS.PRODUCTS, products);
  },

  // Transactions
  getTransactions(companyId) {
    const all = this.load(this.KEYS.TRANSACTIONS);
    return companyId && companyId !== 'comp_admin' ? all.filter(t => t.companyId === companyId) : all;
  },
  addTransaction(txn) {
    const txns = this.load(this.KEYS.TRANSACTIONS);
    txn.id = 'txn_' + Date.now();
    txn.date = new Date().toISOString();
    txns.unshift(txn);
    this.save(this.KEYS.TRANSACTIONS, txns);
    // Update stock
    const product = this.getProduct(txn.productId);
    if (product) {
      const newStock = txn.type === 'inbound'
        ? product.currentStock + txn.quantity
        : Math.max(0, product.currentStock - txn.quantity);
      this.updateProduct(txn.productId, { currentStock: newStock });
    }
    return txn;
  },

  // Outbound Requests
  getRequests(companyId) {
    const all = this.load(this.KEYS.OUTBOUND_REQUESTS);
    return companyId && companyId !== 'comp_admin' ? all.filter(r => r.companyId === companyId) : all;
  },
  addRequest(req) {
    const requests = this.load(this.KEYS.OUTBOUND_REQUESTS);
    req.id = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    req.requestDate = new Date().toISOString();
    req.status = 'pending'; // pending, approved, completed, rejected
    requests.unshift(req);
    this.save(this.KEYS.OUTBOUND_REQUESTS, requests);
    return req;
  },
  updateRequest(id, updates) {
    const requests = this.load(this.KEYS.OUTBOUND_REQUESTS);
    const idx = requests.findIndex(r => r.id === id);
    if (idx === -1) return null;
    requests[idx] = { ...requests[idx], ...updates, lastUpdated: new Date().toISOString() };
    this.save(this.KEYS.OUTBOUND_REQUESTS, requests);
    return requests[idx];
  },
  deleteRequest(id) {
    const requests = this.load(this.KEYS.OUTBOUND_REQUESTS).filter(r => r.id !== id);
    this.save(this.KEYS.OUTBOUND_REQUESTS, requests);
  },

  // Auth
  login(code, password) {
    const company = this.getCompanies().find(c => c.code === code && c.password === password);
    if (company) { this.save(this.KEYS.CURRENT_USER, company); return company; }
    return null;
  },
  logout() { localStorage.removeItem(this.KEYS.CURRENT_USER); },
  getCurrentUser() {
    try { return JSON.parse(localStorage.getItem(this.KEYS.CURRENT_USER)); } catch { return null; }
  },

  // Stats
  getStats(companyId) {
    const products = this.getProducts(companyId);
    const txns = this.getTransactions(companyId);
    const today = new Date().toDateString();
    const todayTxns = txns.filter(t => new Date(t.date).toDateString() === today);
    
    // 정산금액 계산 (출고된 총 수량 * 입고단가)
    let totalSettlement = 0;
    products.forEach(p => {
      const soldQty = txns.filter(t => t.productId === p.id && t.type === 'outbound').reduce((sum, t) => sum + t.quantity, 0);
      totalSettlement += soldQty * (p.incomingPrice || 0);
    });

    return {
      totalProducts: products.length,
      totalStock: products.reduce((s, p) => s + p.currentStock, 0),
      totalSettlement,
      todayInbound: todayTxns.filter(t => t.type==='inbound').reduce((s,t) => s+t.quantity, 0),
      todayOutbound: todayTxns.filter(t => t.type==='outbound').reduce((s,t) => s+t.quantity, 0),
      lowStockProducts: products.filter(p => p.currentStock <= p.safetyStock),
      recentTxns: txns.slice(0, 10)
    };
  },

  // Add Company
  addCompany(company) {
    const companies = this.load(this.KEYS.COMPANIES);
    company.id = 'comp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    companies.push(company);
    this.save(this.KEYS.COMPANIES, companies);
    return company;
  },

  // Bulk add products
  addBulkProducts(products) {
    const existing = this.load(this.KEYS.PRODUCTS);
    let count = 0;
    products.forEach(p => {
      p.id = 'prod_' + Date.now() + '_' + (count++);
      p.lastUpdated = new Date().toISOString();
      existing.push(p);
    });
    this.save(this.KEYS.PRODUCTS, existing);
    return count;
  },

  // Bulk add transactions (with stock update)
  addBulkTransactions(txns) {
    const existing = this.load(this.KEYS.TRANSACTIONS);
    let count = 0;
    txns.forEach(t => {
      t.id = 'txn_' + Date.now() + '_' + (count++);
      t.date = t.date || new Date().toISOString();
      existing.unshift(t);
      // Update stock
      const product = this.getProduct(t.productId);
      if (product) {
        const newStock = t.type === 'inbound'
          ? product.currentStock + t.quantity
          : Math.max(0, product.currentStock - t.quantity);
        this.updateProduct(t.productId, { currentStock: newStock });
      }
    });
    this.save(this.KEYS.TRANSACTIONS, existing);
    return count;
  },

  // Reset
  resetData() {
    localStorage.removeItem(this.KEYS.COMPANIES);
    localStorage.removeItem(this.KEYS.PRODUCTS);
    localStorage.removeItem(this.KEYS.TRANSACTIONS);
    this.init();
  }
};
