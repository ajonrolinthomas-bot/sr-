import React, { useMemo, useState } from "react";

const starterTransactions = [
  {
    id: 1,
    date: "2026-05-01",
    type: "Income",
    category: "Salary",
    description: "Monthly income",
    amount: 2200,
    account: "Main Bank",
  },
  {
    id: 2,
    date: "2026-05-03",
    type: "Expense",
    category: "Rent",
    description: "Monthly rent",
    amount: 750,
    account: "Main Bank",
  },
  {
    id: 3,
    date: "2026-05-06",
    type: "Expense",
    category: "Food",
    description: "Groceries",
    amount: 84.5,
    account: "Main Bank",
  },
];

const categories = [
  "Salary",
  "Business Support",
  "Rent",
  "Food",
  "Transport",
  "Subscriptions",
  "Utilities",
  "Family Support",
  "Shopping",
  "Savings",
  "Other",
];

function calculateTotals(transactions) {
  const income = transactions
    .filter((item) => item.type === "Income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const expenses = transactions
    .filter((item) => item.type === "Expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const balance = income - expenses;
  const savingsRate = income > 0 ? Number(((balance / income) * 100).toFixed(1)) : 0;

  return { income, expenses, balance, savingsRate };
}

function getCategoryBreakdown(transactions) {
  const expenseItems = transactions.filter((item) => item.type === "Expense");

  return categories
    .map((category) => ({
      category,
      amount: expenseItems
        .filter((item) => item.category === category)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

function filterTransactions(transactions, search, filterType) {
  const cleanSearch = search.trim().toLowerCase();

  return transactions.filter((item) => {
    const searchableText = `${item.description || ""} ${item.category || ""} ${item.account || ""}`.toLowerCase();
    const matchesSearch = cleanSearch === "" || searchableText.includes(cleanSearch);
    const matchesType = filterType === "All" || item.type === filterType;

    return matchesSearch && matchesType;
  });
}

function runDashboardTests() {
  const sample = [
    { type: "Income", category: "Salary", amount: 1000 },
    { type: "Expense", category: "Rent", amount: 300 },
    { type: "Expense", category: "Food", amount: 100 },
  ];

  const totals = calculateTotals(sample);
  const breakdown = getCategoryBreakdown(sample);
  const searchResults = filterTransactions(
    [
      { type: "Income", category: "Salary", description: "Main pay", account: "Main Bank", amount: 1000 },
      { type: "Expense", category: "Food", description: "Groceries", account: "Main Bank", amount: 50 },
    ],
    "groc",
    "All"
  );
  const expenseOnlyResults = filterTransactions(sample, "", "Expense");

  return [
    {
      name: "Income total should equal 1000",
      pass: totals.income === 1000,
    },
    {
      name: "Expense total should equal 400",
      pass: totals.expenses === 400,
    },
    {
      name: "Balance should equal 600",
      pass: totals.balance === 600,
    },
    {
      name: "Savings rate should equal 60%",
      pass: totals.savingsRate === 60,
    },
    {
      name: "Breakdown should show Rent before Food",
      pass: breakdown[0]?.category === "Rent" && breakdown[1]?.category === "Food",
    },
    {
      name: "Search should find groceries transaction",
      pass: searchResults.length === 1 && searchResults[0].description === "Groceries",
    },
    {
      name: "Expense filter should return two expense entries",
      pass: expenseOnlyResults.length === 2,
    },
    {
      name: "Empty income should create 0% savings rate",
      pass: calculateTotals([{ type: "Expense", category: "Food", amount: 20 }]).savingsRate === 0,
    },
  ];
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(Number(value || 0));
}

export default function BankExpenseDashboardApp() {
  const [transactions, setTransactions] = useState(starterTransactions);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [activeTab, setActiveTab] = useState("transactions");
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "Expense",
    category: "Food",
    description: "",
    amount: "",
    account: "Main Bank",
  });

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, search, filterType),
    [transactions, search, filterType]
  );

  const totals = useMemo(() => calculateTotals(transactions), [transactions]);
  const categoryBreakdown = useMemo(() => getCategoryBreakdown(transactions), [transactions]);
  const testResults = useMemo(() => runDashboardTests(), []);
  const passedTests = testResults.filter((test) => test.pass).length;

  const addTransaction = () => {
    const amount = Number(form.amount);

    if (!form.date || !form.type || !form.category || !form.account.trim() || !Number.isFinite(amount) || amount <= 0) {
      setErrorMessage("Please enter a valid date, type, category, account and amount above £0.");
      return;
    }

    const newTransaction = {
      id: Date.now(),
      date: form.date,
      type: form.type,
      category: form.category,
      description: form.description.trim() || form.category,
      amount,
      account: form.account.trim(),
    };

    setTransactions((currentTransactions) => [newTransaction, ...currentTransactions]);
    setForm((currentForm) => ({
      ...currentForm,
      description: "",
      amount: "",
    }));
    setErrorMessage("");
    setActiveTab("transactions");
  };

  const removeTransaction = (id) => {
    setTransactions((currentTransactions) => currentTransactions.filter((item) => item.id !== id));
  };

  const exportCsv = () => {
    const headers = ["Date", "Type", "Category", "Description", "Account", "Amount"];
    const rows = transactions.map((item) => [
      item.date,
      item.type,
      item.category,
      item.description,
      item.account,
      item.amount,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "personal-bank-expenses.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-yellow-400 tracking-wide uppercase">Personal Bank Tracker</p>
            <h1 className="text-3xl md:text-5xl font-semibold mt-2">Expense Dashboard</h1>
            <p className="text-neutral-400 mt-3 max-w-2xl">
              Track personal bank income, spending, categories, balance, and monthly savings in one simple dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center justify-center rounded-2xl bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-yellow-400 transition"
          >
            <Icon name="download" className="w-4 h-4 mr-2" /> Export CSV
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard title="Current Balance" value={formatCurrency(totals.balance)} icon="wallet" />
          <SummaryCard title="Total Income" value={formatCurrency(totals.income)} icon="trendingUp" />
          <SummaryCard title="Total Expenses" value={formatCurrency(totals.expenses)} icon="trendingDown" />
          <SummaryCard title="Savings Rate" value={`${totals.savingsRate}%`} icon="piggyBank" />
        </section>

        <section className="space-y-4">
          <nav className="flex flex-wrap gap-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-2">
            <TabButton active={activeTab === "transactions"} onClick={() => setActiveTab("transactions")}>Transactions</TabButton>
            <TabButton active={activeTab === "add"} onClick={() => setActiveTab("add")}>Add Entry</TabButton>
            <TabButton active={activeTab === "insights"} onClick={() => setActiveTab("insights")}>Insights</TabButton>
            <TabButton active={activeTab === "tests"} onClick={() => setActiveTab("tests")}>Tests</TabButton>
          </nav>

          {activeTab === "transactions" && (
            <Card>
              <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-3 mb-5">
                  <div className="relative flex-1">
                    <Icon name="search" className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search transactions..."
                      className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-yellow-500"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(event) => setFilterType(event.target.value)}
                    className="rounded-2xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm outline-none focus:border-yellow-500 md:w-48"
                  >
                    <option value="All">All</option>
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-neutral-400 border-b border-neutral-800">
                        <th className="py-3 pr-4">Date</th>
                        <th className="pr-4">Type</th>
                        <th className="pr-4">Category</th>
                        <th className="pr-4">Description</th>
                        <th className="pr-4">Account</th>
                        <th className="text-right pr-4">Amount</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((item) => (
                          <tr key={item.id} className="border-b border-neutral-800/70">
                            <td className="py-4 pr-4 text-neutral-300">{item.date}</td>
                            <td className="pr-4">
                              <span className={`px-3 py-1 rounded-full text-xs ${item.type === "Income" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="pr-4">{item.category}</td>
                            <td className="pr-4 text-neutral-300">{item.description}</td>
                            <td className="pr-4 text-neutral-400">{item.account}</td>
                            <td className="text-right pr-4 font-medium">{formatCurrency(item.amount)}</td>
                            <td className="text-right">
                              <button
                                type="button"
                                onClick={() => removeTransaction(item.id)}
                                aria-label={`Delete ${item.description}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-800 hover:text-red-400"
                              >
                                <Icon name="trash" className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-neutral-500">
                            No transactions found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "add" && (
            <Card>
              <div className="p-4 md:p-6 space-y-4">
                <h2 className="text-xl font-semibold">Add New Transaction</h2>
                {errorMessage && (
                  <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {errorMessage}
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm({ ...form, date: event.target.value })}
                    className="rounded-2xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm outline-none focus:border-yellow-500"
                  />
                  <select
                    value={form.type}
                    onChange={(event) => setForm({ ...form, type: event.target.value })}
                    className="rounded-2xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm outline-none focus:border-yellow-500"
                  >
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                  <select
                    value={form.category}
                    onChange={(event) => setForm({ ...form, category: event.target.value })}
                    className="rounded-2xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm outline-none focus:border-yellow-500"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <input
                    placeholder="Description"
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    className="rounded-2xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm outline-none focus:border-yellow-500"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount"
                    value={form.amount}
                    onChange={(event) => setForm({ ...form, amount: event.target.value })}
                    className="rounded-2xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm outline-none focus:border-yellow-500"
                  />
                  <input
                    placeholder="Account name"
                    value={form.account}
                    onChange={(event) => setForm({ ...form, account: event.target.value })}
                    className="rounded-2xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm outline-none focus:border-yellow-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={addTransaction}
                  className="inline-flex items-center justify-center rounded-2xl bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-yellow-400 transition"
                >
                  <Icon name="plus" className="w-4 h-4 mr-2" /> Add Transaction
                </button>
              </div>
            </Card>
          )}

          {activeTab === "insights" && (
            <Card>
              <div className="p-4 md:p-6">
                <h2 className="text-xl font-semibold mb-4">Expense Breakdown</h2>
                <div className="space-y-4">
                  {categoryBreakdown.length > 0 ? (
                    categoryBreakdown.map((item) => {
                      const percentage = totals.expenses > 0 ? (item.amount / totals.expenses) * 100 : 0;
                      return (
                        <div key={item.category}>
                          <div className="flex justify-between text-sm mb-2">
                            <span>{item.category}</span>
                            <span className="text-neutral-400">{formatCurrency(item.amount)}</span>
                          </div>
                          <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-neutral-500">No expense data yet.</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {activeTab === "tests" && (
            <Card>
              <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-xl font-semibold">Dashboard Logic Tests</h2>
                    <p className="text-neutral-400 text-sm mt-1">
                      {passedTests} of {testResults.length} tests passed.
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs w-fit ${passedTests === testResults.length ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {passedTests === testResults.length ? "All passing" : "Needs review"}
                  </span>
                </div>
                <div className="space-y-3">
                  {testResults.map((test) => (
                    <div key={test.name} className="flex items-center justify-between border border-neutral-800 rounded-2xl p-3">
                      <span className="text-sm text-neutral-300">{test.name}</span>
                      <span className={test.pass ? "text-green-400 text-sm" : "text-red-400 text-sm"}>
                        {test.pass ? "Pass" : "Fail"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}

function Card({ children }) {
  return <div className="rounded-3xl border border-neutral-800 bg-neutral-900 shadow-xl">{children}</div>;
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm transition ${
        active ? "bg-yellow-500 text-black font-semibold" : "text-neutral-300 hover:bg-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}

function SummaryCard({ title, value, icon }) {
  return (
    <Card>
      <div className="p-5">
        <div className="text-yellow-400">
          <Icon name={icon} className="w-5 h-5" />
        </div>
        <p className="text-neutral-400 text-sm mt-5">{title}</p>
        <p className="text-2xl font-semibold mt-2">{value}</p>
      </div>
    </Card>
  );
}

function Icon({ name, className = "w-5 h-5" }) {
  const commonProps = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  const icons = {
    plus: (
      <svg {...commonProps}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
    search: (
      <svg {...commonProps}>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
    wallet: (
      <svg {...commonProps}>
        <path d="M20 7H5a3 3 0 0 0 0 6h15v6H5a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h13a2 2 0 0 1 2 2v2Z" />
        <path d="M16 13h.01" />
      </svg>
    ),
    trendingUp: (
      <svg {...commonProps}>
        <path d="m3 17 6-6 4 4 8-8" />
        <path d="M14 7h7v7" />
      </svg>
    ),
    trendingDown: (
      <svg {...commonProps}>
        <path d="m3 7 6 6 4-4 8 8" />
        <path d="M14 17h7v-7" />
      </svg>
    ),
    piggyBank: (
      <svg {...commonProps}>
        <path d="M19 8a3 3 0 0 1 2 3v2" />
        <path d="M2 12a7 7 0 0 1 7-7h5a6 6 0 0 1 6 6v3a6 6 0 0 1-6 6H9a7 7 0 0 1-7-7v-1Z" />
        <path d="M7 20v2" />
        <path d="M17 20v2" />
        <path d="M8 9h.01" />
        <path d="M13 5V3h-3" />
      </svg>
    ),
    download: (
      <svg {...commonProps}>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
    ),
    trash: (
      <svg {...commonProps}>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
    ),
  };

  return icons[name] || icons.wallet;
}
