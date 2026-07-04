
        let currentAuthMode = 'login';
        let currentUser = null;
        let transactions = [];
        let currentFilter = 'all';

        window.addEventListener('DOMContentLoaded', () => {
            initTheme();
            checkSession();
            lucide.createIcons();
        });

        function initTheme() {
            const isDark = localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
            if (isDark) {
                document.documentElement.classList.add('dark');
                document.getElementById('dark-mode-toggle').checked = true;
            } else {
                document.documentElement.classList.remove('dark');
                document.getElementById('dark-mode-toggle').checked = false;
            }
        }

        function toggleDarkMode() {
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            }
        }

        function switchAuthTab(tab) {
            currentAuthMode = tab;
            const loginTab = document.getElementById('tab-login');
            const registerTab = document.getElementById('tab-register');
            const fullnameGroup = document.getElementById('fullname-group');
            const currencyGroup = document.getElementById('currency-group');
            const authBtn = document.getElementById('auth-btn');

            if (tab === 'login') {
                loginTab.className = "flex-1 pb-2 font-medium border-b-2 border-indigo-600 text-indigo-600 uppercase tracking-wider";
                registerTab.className = "flex-1 pb-2 font-medium border-b-2 border-transparent text-slate-400 uppercase tracking-wider";
                fullnameGroup.classList.add('hidden');
                currencyGroup.classList.add('hidden');
                authBtn.innerText = "Sign In";
            } else {
                registerTab.className = "flex-1 pb-2 font-medium border-b-2 border-indigo-600 text-indigo-600 uppercase tracking-wider";
                loginTab.className = "flex-1 pb-2 font-medium border-b-2 border-transparent text-slate-400 uppercase tracking-wider";
                fullnameGroup.classList.remove('hidden');
                currencyGroup.classList.remove('hidden');
                authBtn.innerText = "Create Account";
            }
        }

        function handleAuth(e) {
            e.preventDefault();
            const username = document.getElementById('auth-username').value.trim().toLowerCase();
            const password = document.getElementById('auth-password').value;
            
            if (!username || !password) return;

            if (currentAuthMode === 'register') {
                const name = document.getElementById('auth-name').value.trim();
                const currency = document.getElementById('auth-currency').value;
                if (!name) { alert('Please supply full name string asset'); return; }

                if (localStorage.getItem(`user_${username}`)) {
                    alert('Username already registered globally');
                    return;
                }

                const userData = { username, name, password, currency, transactions: [] };
                localStorage.setItem(`user_${username}`, JSON.stringify(userData));
                alert('Registration committed successfully. Moving to Sign In layout views.');
                switchAuthTab('login');
            } else {
                // Login Flow handling matching encryption keys checks
                const accountRaw = localStorage.getItem(`user_${username}`);
                if (!accountRaw) {
                    alert('Account profile username signature not found.');
                    return;
                }
                const parsedUser = JSON.parse(accountRaw);
                if (parsedUser.password !== password) {
                    alert('Invalid configuration credentials password mismatch error.');
                    return;
                }
                
                localStorage.setItem('active_session', username);
                checkSession();
            }
        }

        function checkSession() {
            const sessionKey = localStorage.getItem('active_session');
            if (sessionKey) {
                const sessionRecord = JSON.parse(localStorage.getItem(`user_${sessionKey}`));
                if (sessionRecord) {
                    currentUser = sessionRecord;
                    transactions = sessionRecord.transactions || [];
                    document.getElementById('auth-section').classList.add('hidden');
                    document.getElementById('app-section').classList.remove('hidden');
                    
                    document.getElementById('profile-name').innerText = currentUser.name;
                    document.getElementById('profile-currency').innerText = currentUser.currency;
                    
                    updateDashboard();
                    return;
                }
            }
            document.getElementById('auth-section').classList.remove('hidden');
            document.getElementById('app-section').classList.add('hidden');
        }

        function logout() {
            localStorage.removeItem('active_session');
            currentUser = null;
            transactions = [];
            checkSession();
        }

        function switchView(target) {
            const dashView = document.getElementById('view-dashboard');
            const addView = document.getElementById('view-add-tx');
            
            // Sidebar selectors classes logic updates
            const sDash = document.getElementById('side-nav-dashboard');
            const sAdd = document.getElementById('side-nav-add-tx');
            const mDash = document.getElementById('mob-nav-dashboard');
            const mAdd = document.getElementById('mob-nav-add-tx');

            const activeSide = "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400";
            const inactiveSide = "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50";

            if (target === 'dashboard') {
                dashView.classList.remove('hidden');
                addView.classList.add('hidden');
                sDash.className = activeSide;
                sAdd.className = inactiveSide;
                mDash.className = "flex flex-col items-center justify-center gap-1 text-indigo-600 font-medium";
                mAdd.className = "flex flex-col items-center justify-center gap-1 text-slate-400 font-medium";
                updateDashboard();
            } else {
                dashView.classList.add('hidden');
                addView.classList.remove('hidden');
                sDash.className = inactiveSide;
                sAdd.className = activeSide;
                mDash.className = "flex flex-col items-center justify-center gap-1 text-slate-400 font-medium";
                mAdd.className = "flex flex-col items-center justify-center gap-1 text-indigo-600 font-medium";
            }
            lucide.createIcons();
        }

        function updateDashboard() {
            let incomeTotal = 0;
            let expenseTotal = 0;

            transactions.forEach(t => {
                if (t.type === 'income') incomeTotal += t.amount;
                else expenseTotal += t.amount;
            });

            const net = incomeTotal - expenseTotal;
            const currencySymbol = currentUser.currency;

            document.getElementById('val-balance').innerText = `${currencySymbol}${net.toFixed(2)}`;
            document.getElementById('val-income').innerText = `${currencySymbol}${incomeTotal.toFixed(2)}`;
            document.getElementById('val-expense').innerText = `${currencySymbol}${expenseTotal.toFixed(2)}`;
            document.getElementById('val-count').innerText = transactions.length;

            renderTransactions();
            renderVectorVisualization();
        }

        function handleAddTransaction(e) {
            e.preventDefault();
            const desc = document.getElementById('tx-desc').value.trim();
            const cat = document.getElementById('tx-category').value.trim();
            const amt = parseFloat(document.getElementById('tx-amount').value);
            const type = document.getElementById('tx-type').value;

            if (!desc || !cat || isNaN(amt) || amt <= 0) return;

            const entry = {
                id: 'tx_uuid_' + Date.now(),
                description: desc,
                category: cat,
                amount: amt,
                type: type,
                date: new Date().toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})
            };

            transactions.unshift(entry);
            saveStateToStorage();
            
            // Input resets
            document.getElementById('tx-desc').value = '';
            document.getElementById('tx-category').value = '';
            document.getElementById('tx-amount').value = '';
            
            switchView('dashboard');
        }

        function deleteTransaction(id) {
            transactions = transactions.filter(t => t.id !== id);
            saveStateToStorage();
            updateDashboard();
        }

        function setFilter(val) {
            currentFilter = val;
            renderTransactions();
        }

        function renderTransactions() {
            const tbody = document.getElementById('transaction-rows');
            tbody.innerHTML = '';
            
            const searchQuery = document.getElementById('tx-search').value.toLowerCase();

            const parsedRows = transactions.filter(t => {
                const matchType = currentFilter === 'all' || t.type === currentFilter;
                const matchSearch = t.description.toLowerCase().includes(searchQuery) || t.category.toLowerCase().includes(searchQuery);
                return matchType && matchSearch;
            });

            if (parsedRows.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400 italic">No corresponding balance logs found</td></tr>`;
                return;
            }

            parsedRows.forEach(t => {
                const isInc = t.type === 'income';
                const amtColor = isInc ? 'text-emerald-600' : 'text-rose-600';
                const prefix = isInc ? '+' : '-';

                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-all";
                tr.innerHTML = `
                    <td class="py-3 px-2 text-slate-400 text-[11px] whitespace-nowrap">${t.date}</td>
                    <td class="py-3 px-2 font-medium text-slate-900 dark:text-white">${t.description}</td>
                    <td class="py-3 px-2"><span class="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-[10px]">${t.category}</span></td>
                    <td class="py-3 px-2 text-right font-bold ${amtColor} whitespace-nowrap">${prefix}${currentUser.currency}${t.amount.toFixed(2)}</td>
                    <td class="py-3 px-2 text-center">
                        <button onclick="deleteTransaction('${t.id}')" class="text-slate-300 hover:text-rose-600 p-1 transition-colors" title="Instantly Delete Entry">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            lucide.createIcons();
        }

        function renderVectorVisualization() {
            const svg = document.getElementById('visualization-svg');
            svg.innerHTML = '';

            if (transactions.length === 0) {
                svg.innerHTML = `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="11">Data pipeline offline</text>`;
                return;
            }

            // Generate analytical vector arrays tracking lines paths
            let reversed = [...transactions].reverse();
            let incomePoints = [{x: 0, y: 120}];
            let expensePoints = [{x: 0, y: 120}];
            
            let accumulatedInc = 0;
            let accumulatedExp = 0;

            reversed.forEach((t, i) => {
                if (t.type === 'income') accumulatedInc += t.amount;
                else accumulatedExp += t.amount;
            });

            const topPeak = Math.max(accumulatedInc, accumulatedExp, 10);
            
            let runningInc = 0;
            let runningExp = 0;
            const segment = 400 / (reversed.length || 1);

            reversed.forEach((t, index) => {
                const x = (index + 1) * segment;
                if (t.type === 'income') runningInc += t.amount;
                else runningExp += t.amount;

                const yInc = 110 - (runningInc / topPeak) * 90;
                const yExp = 110 - (runningExp / topPeak) * 90;

                incomePoints.push({x, y: yInc});
                expensePoints.push({x, y: yExp});
            });

            const drawPath = (pts) => {
                let d = `M ${pts[0].x} ${pts[0].y}`;
                for (let i = 1; i < pts.length; i++) { d += ` L ${pts[i].x} ${pts[i].y}`; }
                return d;
            };

            const appendLine = (pathStr, color) => {
                const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
                p.setAttribute("d", pathStr);
                p.setAttribute("fill", "none");
                p.setAttribute("stroke", color);
                p.setAttribute("stroke-width", "2.5");
                p.setAttribute("stroke-linecap", "round");
                svg.appendChild(p);
            };

            appendLine(drawPath(incomePoints), "#3f51b5");
            appendLine(drawPath(expensePoints), "#f43f5e");
        }

        function saveStateToStorage() {
            if (currentUser) {
                currentUser.transactions = transactions;
                localStorage.setItem(`user_${currentUser.username}`, JSON.stringify(currentUser));
            }
        }

        function resetAllData() {
            if (confirm("Confirm complete ledger database reset action?")) {
                transactions = [];
                saveStateToStorage();
                updateDashboard();
            }
        }
