let state = {
  transactions: [],
  profile: {
    name: "Alpha User",
    currency: "USD",
  },
  theme: "light",
  currentFilter: "all",
  searchQuery: "",
  chartView: "donut", // "donut" or "trend"
  formType: "income", // "income" or "expense"
};

// Static configuration helpers
const CURRENCY_MAP = {
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "de-DE" },
  GBP: { symbol: "£", locale: "en-GB" },
  INR: { symbol: "₹", locale: "en-IN" },
  JPY: { symbol: "¥", locale: "ja-JP" },
};

const CATEGORIES = {
  income: [
    {
      id: "salary",
      name: "Salary & Wage",
      icon: "briefcase",
      color: "#10b981",
    },
    {
      id: "freelance",
      name: "Freelance/Gig Work",
      icon: "laptop-2",
      color: "#34d399",
    },
    {
      id: "investment",
      name: "Investments & Dividends",
      icon: "trending-up",
      color: "#059669",
    },
    { id: "gift", name: "Gifts & Grants", icon: "gift", color: "#6ee7b7" },
    {
      id: "other-income",
      name: "Other Income Source",
      icon: "piggy-bank",
      color: "#047857",
    },
  ],
  expense: [
    { id: "food", name: "Food & Dining", icon: "utensils", color: "#f43f5e" },
    {
      id: "housing",
      name: "Housing & Utilities",
      icon: "home",
      color: "#ef4444",
    },
    {
      id: "transport",
      name: "Transport & Fuel",
      icon: "car",
      color: "#f59e0b",
    },
    {
      id: "entertainment",
      name: "Entertainment & Leisure",
      icon: "film",
      color: "#3b82f6",
    },
    {
      id: "healthcare",
      name: "Healthcare & Insurance",
      icon: "heart-pulse",
      color: "#06b6d4",
    },
    {
      id: "shopping",
      name: "Shopping & Retail",
      icon: "shopping-bag",
      color: "#8b5cf6",
    },
    {
      id: "education",
      name: "Education & Learning",
      icon: "graduation-cap",
      color: "#a855f7",
    },
    {
      id: "other-expense",
      name: "Miscellaneous Expenses",
      icon: "help-circle",
      color: "#64748b",
    },
  ],
};

const FINANCIAL_TIPS = [
  "Aim to allocate 20% of your income to savings and investments. Consistently test yourself with the 50/30/20 budget framework.",
  "Always inspect the visual cash breakdown chart. Focus on shrinking your single largest luxury category first.",
  "Avoid lifestyle inflation! As your income grows, divert the excess cash straight into your savings automatically.",
  "A healthy emergency fund contains at least 3 to 6 months of basic living expenses. Track details carefully.",
  "Track your subscriptions periodically. Unused digital memberships and trial payments represent the quickest leak in modern budgets.",
  "Consider setting a daily custom budget limit. Live alerts keep spending spikes down.",
];

let analyticsChartInstance = null;
let promptConfirmCallback = null;

/* ==========================================================
           2. APP INITIALIZATION & BOOTSTRAP
           ========================================================== */
window.onload = function () {
  loadStateFromLocalStorage();
  applyTheme(state.theme);
  populateCategoryDropdown();
  renderStats();
  renderTransactionsList();
  updateChart();
  initializeSettingsInputs();
  lucide.createIcons();

  // Setup default date picker limit to today
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("tx-date").value = today;

  // Render random initial tip
  showQuickTip();
};

function loadStateFromLocalStorage() {
  try {
    const storedStateStr = localStorage.getItem("fintrack_pro_state_v1");
    if (storedStateStr) {
      const parsed = JSON.parse(storedStateStr);
      if (parsed && typeof parsed === "object") {
        state = { ...state, ...parsed };
      }
    } else {
      // Populate with mock transaction data to let the application shine out of the box
      state.transactions = [
        {
          id: "tx_mock_1",
          type: "income",
          category: "salary",
          amount: 4800,
          date: getOffsetDate(-10),
          desc: "Monthly Salary Deposit",
        },
        {
          id: "tx_mock_2",
          type: "income",
          category: "freelance",
          amount: 650,
          date: getOffsetDate(-5),
          desc: "Client Website Delivery",
        },
        {
          id: "tx_mock_3",
          type: "expense",
          category: "housing",
          amount: 1200,
          date: getOffsetDate(-8),
          desc: "Appartment Lease Rent",
        },
        {
          id: "tx_mock_4",
          type: "expense",
          category: "food",
          amount: 145.5,
          date: getOffsetDate(-4),
          desc: "Organic Groceries Batch",
        },
        {
          id: "tx_mock_5",
          type: "expense",
          category: "transport",
          amount: 48.0,
          date: getOffsetDate(-3),
          desc: "City Transit Fuel refill",
        },
        {
          id: "tx_mock_6",
          type: "expense",
          category: "entertainment",
          amount: 89.9,
          date: getOffsetDate(-1),
          desc: "Premium Streaming Subscription",
        },
      ];
      saveStateToLocalStorage();
    }
  } catch (e) {
    console.error(
      "Local storage read failure, falling back to empty environment.",
      e,
    );
  }
}

function saveStateToLocalStorage() {
  try {
    localStorage.setItem("fintrack_pro_state_v1", JSON.stringify(state));
  } catch (e) {
    showToast("Data storage failed! Check disk constraints.", "error");
  }
}

function getOffsetDate(daysOffset) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split("T")[0];
}

/* ==========================================================
           3. DYNAMIC INTERFACE UPDATES & RENDERERS
           ========================================================== */
// Format absolute dynamic currency matching choice
function formatCurrency(amount) {
  const conf = CURRENCY_MAP[state.profile.currency] || CURRENCY_MAP.USD;
  return new Intl.NumberFormat(conf.locale, {
    style: "currency",
    currency: state.profile.currency,
  }).format(amount);
}

function renderStats() {
  let totalIncome = 0;
  let totalExpense = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  state.transactions.forEach((t) => {
    const amt = parseFloat(t.amount) || 0;
    if (t.type === "income") {
      totalIncome += amt;
      incomeCount++;
    } else {
      totalExpense += amt;
      expenseCount++;
    }
  });

  const netBalance = totalIncome - totalExpense;

  // Update stats DOM Elements
  const balEl = document.getElementById("stat-balance");
  balEl.textContent = formatCurrency(netBalance);

  // Dynamic color shift depending on negative/positive status of balance
  if (netBalance < 0) {
    balEl.className =
      "text-3xl sm:text-4xl font-bold mt-2 tracking-tight text-rose-100";
  } else {
    balEl.className =
      "text-3xl sm:text-4xl font-bold mt-2 tracking-tight text-white";
  }

  document.getElementById("stat-income").textContent =
    formatCurrency(totalIncome);
  document.getElementById("stat-income-count").textContent =
    `${incomeCount} transaction${incomeCount === 1 ? "" : "s"}`;

  document.getElementById("stat-expense").textContent =
    formatCurrency(totalExpense);
  document.getElementById("stat-expense-count").textContent =
    `${expenseCount} transaction${expenseCount === 1 ? "" : "s"}`;

  // Update currency indicators throughout
  document.querySelectorAll(".currency-symbol").forEach((el) => {
    const conf = CURRENCY_MAP[state.profile.currency] || CURRENCY_MAP.USD;
    el.textContent = conf.symbol;
  });
}

// Populates Category Dropdown dependent on Type Toggle Selector
function populateCategoryDropdown() {
  const catSelect = document.getElementById("tx-category");
  catSelect.innerHTML = "";
  const currentList = CATEGORIES[state.formType];

  currentList.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    catSelect.appendChild(opt);
  });
}

// Toggle transaction form active type (Income/Expense)
function setFormType(type) {
  state.formType = type;
  const btnIncome = document.getElementById("form-type-income");
  const btnExpense = document.getElementById("form-type-expense");

  if (type === "income") {
    btnIncome.className =
      "py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm";
    btnExpense.className =
      "py-2 text-sm font-medium rounded-lg transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white";
  } else {
    btnExpense.className =
      "py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm";
    btnIncome.className =
      "py-2 text-sm font-medium rounded-lg transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white";
  }

  populateCategoryDropdown();
}

/* ==========================================================
           4. TRANSACTION MANAGEMENT (LIST, ADD, DELETE)
           ========================================================== */
function renderTransactionsList() {
  const tbody = document.getElementById("transaction-rows");
  const emptyState = document.getElementById("tx-empty-state");
  tbody.innerHTML = "";

  // Filter & Search Logic combined
  const filtered = state.transactions.filter((t) => {
    const matchesType =
      state.currentFilter === "all" || t.type === state.currentFilter;
    const matchesSearch =
      !state.searchQuery ||
      (t.desc &&
        t.desc.toLowerCase().includes(state.searchQuery.toLowerCase())) ||
      (t.category &&
        t.category.toLowerCase().includes(state.searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // Sort by Date descending, then ID fallback
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  document.getElementById("tx-showing-count").textContent = filtered.length;

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    tbody.closest("table").classList.add("hidden");
  } else {
    emptyState.classList.add("hidden");
    tbody.closest("table").classList.remove("hidden");

    filtered.forEach((t) => {
      const row = document.createElement("tr");
      row.className =
        "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group";

      // Match categories details
      const catMap = [...CATEGORIES.income, ...CATEGORIES.expense];
      const catObj = catMap.find((c) => c.id === t.category) || {
        name: t.category,
        icon: "receipt-text",
        color: "#64748b",
      };

      // Format Date nicely
      const formattedDate = new Date(t.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      row.innerHTML = `
                        <td class="py-3 px-4 flex items-center gap-3">
                            <div class="p-2 rounded-xl" style="background-color: ${catObj.color}15; color: ${catObj.color}">
                                <i data-lucide="${catObj.icon}" class="w-4 h-4"></i>
                            </div>
                            <div class="max-w-[150px] sm:max-w-xs">
                                <p class="font-medium text-slate-800 dark:text-slate-100 truncate text-xs sm:text-sm">
                                    ${escapeHtml(t.desc) || catObj.name}
                                </p>
                                <span class="block md:hidden text-[10px] text-slate-400 font-medium tracking-wide capitalize">${t.type}</span>
                            </div>
                        </td>
                        <td class="py-3 px-4">
                            <span class="inline-flex items-center text-xs px-2.5 py-1 rounded-lg font-medium" style="background-color: ${catObj.color}10; color: ${catObj.color}">
                                ${catObj.name}
                            </span>
                        </td>
                        <td class="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            ${formattedDate}
                        </td>
                        <td class="py-3 px-4 text-right font-semibold whitespace-nowrap ${t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200"}">
                            ${t.type === "income" ? "+" : "-"}${formatCurrency(t.amount)}
                        </td>
                        <td class="py-3 px-4 text-center">
                            <button onclick="requestDeleteTransaction('${t.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors opacity-100 lg:opacity-0 group-hover:opacity-100 focus:opacity-100" title="Delete Transaction">
                                <i data-lucide="trash" class="w-4 h-4"></i>
                            </button>
                        </td>
                    `;
      tbody.appendChild(row);
    });
  }

  // Bind new lucide icons in dynamically created elements
  lucide.createIcons();
}

function handleTransactionSubmit(event) {
  event.preventDefault();

  const amountVal = parseFloat(document.getElementById("tx-amount").value);
  const dateVal = document.getElementById("tx-date").value;
  const catVal = document.getElementById("tx-category").value;
  const descVal = document.getElementById("tx-desc").value.trim();

  if (!amountVal || isNaN(amountVal) || amountVal <= 0) {
    showToast("Please provide a valid, positive amount value", "error");
    return;
  }

  if (!dateVal) {
    showToast("Transaction date is strictly required", "error");
    return;
  }

  const newTx = {
    id: "tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    type: state.formType,
    category: catVal,
    amount: amountVal,
    date: dateVal,
    desc: descVal,
  };

  state.transactions.unshift(newTx);
  saveStateToLocalStorage();

  // Refresh UI components
  renderStats();
  renderTransactionsList();
  updateChart();

  // Reset form inputs (preserve date for fast bulk input sessions)
  document.getElementById("tx-amount").value = "";
  document.getElementById("tx-desc").value = "";

  showToast("Transaction logged successfully!", "success");
}

function requestDeleteTransaction(id) {
  triggerCustomPrompt(
    "Delete Transaction?",
    "Are you sure you want to permanently clear this transaction from your local ledger history?",
    function () {
      state.transactions = state.transactions.filter((t) => t.id !== id);
      saveStateToLocalStorage();
      renderStats();
      renderTransactionsList();
      updateChart();
      showToast("Transaction cleared.", "success");
    },
  );
}

/* ==========================================================
           5. DATA MANAGEMENT, PREFERENCES & IMPORT/EXPORT
           ========================================================== */
function changeCurrency(currencyCode) {
  if (CURRENCY_MAP[currencyCode]) {
    state.profile.currency = currencyCode;
    saveStateToLocalStorage();
    renderStats();
    renderTransactionsList();
    updateChart();
    showToast(`Switched currency preference to ${currencyCode}`, "success");
  }
}

function setFilter(filterType) {
  state.currentFilter = filterType;

  // Adjust styling of active filter tabs
  const tabs = document.querySelectorAll(".filter-tab");
  tabs.forEach((tab) => {
    tab.className =
      "filter-tab px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition";
  });

  // Target correct button triggering event contextually
  event.currentTarget.className =
    "filter-tab px-3 py-1.5 text-xs font-semibold rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900";

  renderTransactionsList();
}

function applyFilters() {
  state.searchQuery = document.getElementById("tx-search").value;
  renderTransactionsList();
}

/* ==========================================================
           6. CHART GENERATION & ANALYTICS VISUALIZER
           ========================================================== */
function toggleChartType(type) {
  state.chartView = type;
  const btnDonut = document.getElementById("btn-chart-donut");
  const btnTrend = document.getElementById("btn-chart-trend");

  if (type === "donut") {
    btnDonut.className =
      "px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm transition";
    btnTrend.className =
      "px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition";
  } else {
    btnTrend.className =
      "px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm transition";
    btnDonut.className =
      "px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition";
  }

  updateChart();
}

function updateChart() {
  const canvas = document.getElementById("analyticsChart");
  const emptyOverlay = document.getElementById("chart-empty-state");

  if (state.transactions.length === 0) {
    emptyOverlay.classList.remove("hidden");
    if (analyticsChartInstance) {
      analyticsChartInstance.destroy();
      analyticsChartInstance = null;
    }
    return;
  } else {
    emptyOverlay.classList.add("hidden");
  }

  // Destroy previous chart to avoid hover layout bleed/memory leaks
  if (analyticsChartInstance) {
    analyticsChartInstance.destroy();
  }

  const ctx = canvas.getContext("2d");
  const isDarkMode = document.documentElement.classList.contains("dark");
  const textThemeColor = isDarkMode ? "#e2e8f0" : "#334155";
  const borderThemeColor = isDarkMode ? "#334155" : "#f1f5f9";

  if (state.chartView === "donut") {
    // Generate expense categorization visual data
    const expenseOnly = state.transactions.filter((t) => t.type === "expense");

    if (expenseOnly.length === 0) {
      // Fallback visual to all-income state if zero expenses logged yet
      const incomeCats = {};
      state.transactions.forEach((t) => {
        incomeCats[t.category] =
          (incomeCats[t.category] || 0) + parseFloat(t.amount);
      });

      const labels = Object.keys(incomeCats).map((id) => {
        const catObj = CATEGORIES.income.find((c) => c.id === id);
        return catObj ? catObj.name : id;
      });
      const data = Object.values(incomeCats);
      const colors = Object.keys(incomeCats).map((id) => {
        const catObj = CATEGORIES.income.find((c) => c.id === id);
        return catObj ? catObj.color : "#64748b";
      });

      analyticsChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Income breakdown",
              data: data,
              backgroundColor: colors,
              borderWidth: 2,
              borderColor: borderThemeColor,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: textThemeColor,
                font: { family: "Inter", size: 11 },
              },
            },
            title: {
              display: true,
              text: "Gross Income Category Breakdown",
              color: textThemeColor,
              font: { family: "Inter", size: 13, weight: "bold" },
            },
          },
        },
      });
    } else {
      // Map active actual expense items
      const expenseCats = {};
      expenseOnly.forEach((t) => {
        expenseCats[t.category] =
          (expenseCats[t.category] || 0) + parseFloat(t.amount);
      });

      const labels = Object.keys(expenseCats).map((id) => {
        const catObj = CATEGORIES.expense.find((c) => c.id === id);
        return catObj ? catObj.name : id;
      });
      const data = Object.values(expenseCats);
      const colors = Object.keys(expenseCats).map((id) => {
        const catObj = CATEGORIES.expense.find((c) => c.id === id);
        return catObj ? catObj.color : "#64748b";
      });

      analyticsChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Expense breakdown",
              data: data,
              backgroundColor: colors,
              borderWidth: 2,
              borderColor: borderThemeColor,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: textThemeColor,
                font: { family: "Inter", size: 11 },
              },
            },
            title: {
              display: true,
              text: "Expense Category Allocation Breakdown",
              color: textThemeColor,
              font: { family: "Inter", size: 13, weight: "bold" },
            },
          },
        },
      });
    }
  } else {
    // Line chart timeline trend view (Group by date, sorting chronological)
    const dateMap = {};

    // Get last 15 days list range
    for (let i = 14; i >= 0; i--) {
      const dStr = getOffsetDate(-i);
      dateMap[dStr] = { income: 0, expense: 0 };
    }

    // Accumulate transactions
    state.transactions.forEach((t) => {
      if (dateMap[t.date]) {
        dateMap[t.date][t.type] += parseFloat(t.amount);
      }
    });

    const sortedDates = Object.keys(dateMap).sort();
    const incomeDataset = sortedDates.map((d) => dateMap[d].income);
    const expenseDataset = sortedDates.map((d) => dateMap[d].expense);
    const readableLabels = sortedDates.map((d) => {
      const dateObj = new Date(d);
      return dateObj.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    });

    analyticsChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: readableLabels,
        datasets: [
          {
            label: "Income stream",
            data: incomeDataset,
            backgroundColor: "rgba(16, 185, 129, 0.85)",
            borderRadius: 4,
          },
          {
            label: "Expense flow",
            data: expenseDataset,
            backgroundColor: "rgba(244, 63, 94, 0.85)",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: textThemeColor,
              font: { family: "Inter", size: 10 },
            },
          },
          y: {
            grid: { color: borderThemeColor },
            ticks: {
              color: textThemeColor,
              font: { family: "Inter", size: 10 },
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: textThemeColor,
              font: { family: "Inter", size: 11 },
            },
          },
          title: {
            display: true,
            text: "15-Day Income vs Expense Timeline Trend",
            color: textThemeColor,
            font: { family: "Inter", size: 13, weight: "bold" },
          },
        },
      },
    });
  }
}

/* ==========================================================
           7. SYSTEM MODALS, PROFILE & THEME MANAGEMENT
           ========================================================== */
function toggleTheme() {
  const htmlEl = document.documentElement;
  const themeBtn = document.getElementById("theme-toggle-btn");

  if (htmlEl.classList.contains("dark")) {
    htmlEl.classList.remove("dark");
    state.theme = "light";
  } else {
    htmlEl.classList.add("dark");
    state.theme = "dark";
  }

  saveStateToLocalStorage();
  applyTheme(state.theme);
  updateChart();
}

function applyTheme(theme) {
  const htmlEl = document.documentElement;
  const themeIcon = document.getElementById("theme-icon");

  if (theme === "dark") {
    htmlEl.classList.add("dark");
    themeIcon.setAttribute("data-lucide", "moon");
  } else {
    htmlEl.classList.remove("dark");
    themeIcon.setAttribute("data-lucide", "sun");
  }
  lucide.createIcons();
}

function toggleSettingsModal(open) {
  const modal = document.getElementById("settings-modal");
  if (open) {
    initializeSettingsInputs();
    modal.classList.remove("hidden");
  } else {
    modal.classList.add("hidden");
  }
}

function initializeSettingsInputs() {
  document.getElementById("settings-username").value = state.profile.name || "";
  document.getElementById("global-currency-select").value =
    state.profile.currency || "USD";

  // Sync Profile Badge on Navigation
  const badge = document.getElementById("profile-avatar");
  const displayName = document.getElementById("profile-display-name");
  const firstLetter = (state.profile.name || "User").charAt(0).toUpperCase();
  badge.textContent = firstLetter;
  displayName.textContent = state.profile.name || "User";
}

function saveSettingsForm() {
  const nameVal = document.getElementById("settings-username").value.trim();

  if (!nameVal) {
    showToast("Profile username cannot be blank", "error");
    return;
  }

  state.profile.name = nameVal;
  saveStateToLocalStorage();
  initializeSettingsInputs();
  renderStats();
  toggleSettingsModal(false);
  showToast("Preferences updated successfully!", "success");
}

// Trigger custom non-blocking system confirmations (Alert Replacement rule)
function triggerCustomPrompt(title, message, onConfirm) {
  const promptModal = document.getElementById("prompt-modal");
  document.getElementById("prompt-title").textContent = title;
  document.getElementById("prompt-message").textContent = message;

  promptConfirmCallback = onConfirm;
  promptModal.classList.remove("hidden");
}

function closePromptModal() {
  document.getElementById("prompt-modal").classList.add("hidden");
  promptConfirmCallback = null;
}

// Bind callback executing proceed routine
document.getElementById("prompt-confirm-btn").addEventListener("click", () => {
  if (promptConfirmCallback) {
    promptConfirmCallback();
  }
  closePromptModal();
});

function promptResetAllData() {
  triggerCustomPrompt(
    "Reset All Ledger Data?",
    "WARNING: This clears all income records, expense balances, categories, and user profile metadata completely. This cannot be undone.",
    function () {
      localStorage.removeItem("fintrack_pro_state_v1");
      // Hard clear logic state & re-render
      state = {
        transactions: [],
        profile: { name: "Alpha User", currency: "USD" },
        theme: "light",
        currentFilter: "all",
        searchQuery: "",
        chartView: "donut",
        formType: "income",
      };
      saveStateToLocalStorage();
      applyTheme(state.theme);
      populateCategoryDropdown();
      renderStats();
      renderTransactionsList();
      updateChart();
      initializeSettingsInputs();
      toggleSettingsModal(false);
      showToast("Database reset. Clean state generated.", "info");
    },
  );
}

/* ==========================================================
           8. DATA BACKUPS (EXPORT/IMPORT ENGINE)
           ========================================================== */
function exportData() {
  try {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `fintrack_backup_${Date.now()}.json`);
    dlAnchorElem.click();
    showToast("System JSON file export initiated!", "success");
  } catch (e) {
    showToast("Data export failure. Browser limits reached.", "error");
  }
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed && typeof parsed === "object") {
        // Confirm essential schema values present
        if (Array.isArray(parsed.transactions) && parsed.profile) {
          state = { ...state, ...parsed };
          saveStateToLocalStorage();

          // Fully update visuals
          applyTheme(state.theme);
          populateCategoryDropdown();
          renderStats();
          renderTransactionsList();
          updateChart();
          initializeSettingsInputs();
          toggleSettingsModal(false);

          showToast("Ledger backup imported perfectly!", "success");
        } else {
          showToast(
            "Invalid JSON Schema format. Missing essential fields.",
            "error",
          );
        }
      }
    } catch (err) {
      showToast("Failed to parse file. Ensure it is valid JSON.", "error");
    }
  };
  reader.readAsText(file);
  // Clear input so upload triggers again on same file if needed
  event.target.value = "";
}

/* ==========================================================
           9. TOAST NOTIFICATION ENGINE (INTERACTION HELPERS)
           ========================================================== */
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className =
    "p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center justify-between gap-3 pointer-events-auto transform translate-y-2 opacity-0 transition-all duration-300 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100";

  // Adjust borders and indicators depending on feedback state
  let iconCode = "info";
  if (type === "success") {
    toast.classList.add("border-emerald-500/30", "dark:border-emerald-500/20");
    iconCode = "check-circle-2";
  } else if (type === "error") {
    toast.classList.add("border-rose-500/30", "dark:border-rose-500/20");
    iconCode = "x-circle";
  } else {
    toast.classList.add("border-brand-500/30", "dark:border-brand-500/20");
    iconCode = "info";
  }

  // Create notification layout
  toast.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="${type === "success" ? "text-emerald-500" : type === "error" ? "text-rose-500" : "text-brand-500"}">
                        <i data-lucide="${iconCode}" class="w-4 h-4"></i>
                    </span>
                    <span>${escapeHtml(message)}</span>
                </div>
                <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
            `;

  container.appendChild(toast);
  lucide.createIcons();

  // Animate entrance frame
  setTimeout(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  }, 10);

  // Automatic dismiss trigger
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

function showQuickTip() {
  const tipBox = document.getElementById("pro-tip-box");
  const randomIndex = Math.floor(Math.random() * FINANCIAL_TIPS.length);
  tipBox.textContent = FINANCIAL_TIPS[randomIndex];
}

// Minimalist XSS Escape validation safety utility
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
