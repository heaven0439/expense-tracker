firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let allTransactions = [];
let currentFilteredData = []; 
let financeChart = null;

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    document.getElementById("user-greeting").innerHTML =
      `Hello, <span class="text-blue-600 font-bold">${user.displayName || "User"}</span>`;
    document.getElementById("trans-date").valueAsDate = new Date();
    fetchTransactions();
  } else {
    window.location.href = "index.html";
  }
});


document.getElementById("logout-btn").addEventListener("click", async () => {
  await auth.signOut();
  window.location.href = "index.html";
});

const transactionForm = document.getElementById("transaction-form");
transactionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = transactionForm.querySelector('button[type="submit"]');

  const type = document.getElementById("trans-type").value;
  const amount = parseFloat(document.getElementById("trans-amount").value);
  const category = document.getElementById("trans-category").value;
  const date = document.getElementById("trans-date").value;
  const description = document.getElementById("trans-desc").value;

  btn.innerText = "Saving...";
  btn.disabled = true;

  try {
    const { error } = await supabaseClient
      .from("transactions")
      .insert([
        { user_id: currentUser.uid, type, amount, category, date, description },
      ]);

    if (error) throw error;
    transactionForm.reset();
    document.getElementById("trans-date").valueAsDate = new Date();
    fetchTransactions();
  } catch (error) {
    alert("Failed to save transaction.");
  } finally {
    btn.innerText = "Save Transaction";
    btn.disabled = false;
  }
});

async function fetchTransactions() {
  try {
    const { data, error } = await supabaseClient
      .from("transactions")
      .select("*")
      .eq("user_id", currentUser.uid)
      .order("date", { ascending: false });

    if (error) throw error;
    allTransactions = data;
    applyFilters();
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}
const filterTypeSelect = document.getElementById("filter-type");
const filterTimeSelect = document.getElementById("filter-time");
filterTypeSelect.addEventListener("change", applyFilters);
filterTimeSelect.addEventListener("change", applyFilters);

function applyFilters() {
  const typeValue = filterTypeSelect.value;
  const timeValue = filterTimeSelect.value;
  let filteredData = allTransactions;
  const today = new Date();

  if (timeValue === "today") {
    filteredData = filteredData.filter((t) => {
      const tDate = new Date(t.date);
      return tDate.toDateString() === today.toDateString();
    });
  } else if (timeValue === "week") {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    filteredData = filteredData.filter((t) => new Date(t.date) >= oneWeekAgo);
  } else if (timeValue === "month") {
    filteredData = filteredData.filter((t) => {
      const tDate = new Date(t.date);
      return (
        tDate.getMonth() === today.getMonth() &&
        tDate.getFullYear() === today.getFullYear()
      );
    });
  }

  if (typeValue === "income") {
    filteredData = filteredData.filter((t) => t.type === "income");
  } else if (typeValue === "expense") {
    filteredData = filteredData.filter((t) => t.type === "expense");
  }

  currentFilteredData = filteredData; // Save state for CSV Export

  renderTransactions(filteredData);

  calculateSummaries(filteredData);
  updateChart(filteredData);
}

document.getElementById("export-btn").addEventListener("click", () => {
  if (currentFilteredData.length === 0) {
    alert("No transactions to export in this view.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Date,Type,Category,Amount,Description\n";

  currentFilteredData.forEach((t) => {
    const desc = t.description ? `"${t.description.replace(/"/g, '""')}"` : "";
    const row = `${t.date},${t.type},"${t.category}",${t.amount},${desc}`;
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `ExpenseTracker_${new Date().toISOString().split("T")[0]}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

function renderTransactions(transactions) {
  const list = document.getElementById("transaction-list");
  if (transactions.length === 0) {
    list.innerHTML = `<div class="text-center text-slate-500 py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">No transactions match your filters.</div>`;
    return;
  }

  list.innerHTML = transactions
    .map(
      (t) => `
        <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors group">
            <div>
                <h4 class="font-semibold text-slate-800">${t.category}</h4>
                <p class="text-xs text-slate-500">${new Date(t.date).toLocaleDateString()} ${t.description ? `• ${t.description}` : ""}</p>
            </div>
            <div class="flex items-center gap-4">
                <div class="font-bold ${t.type === "income" ? "text-emerald-600" : "text-slate-800"}">
                    ${t.type === "income" ? "+" : "-"}₹${t.amount.toFixed(2)}
                </div>
                <button onclick="deleteTransaction('${t.id}')" class="text-slate-400 hover:text-red-500 transition-colors p-1 md:opacity-0 md:group-hover:opacity-100" title="Delete">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `,
    )
    .join("");
}

window.deleteTransaction = async function (id) {
  if (confirm("Are you sure you want to delete this transaction?")) {
    try {
      await supabaseClient.from("transactions").delete().eq("id", id);
      fetchTransactions();
    } catch (error) {
      alert("Failed to delete transaction.");
    }
  }
};

function calculateSummaries(transactions) {
  let income = 0;
  let expense = 0;
  transactions.forEach((t) => {
    if (t.type === "income") income += t.amount;
    if (t.type === "expense") expense += t.amount;
  });
  document.getElementById("total-income").innerText = `₹${income.toFixed(2)}`;
  document.getElementById("total-expense").innerText = `₹${expense.toFixed(2)}`;
  document.getElementById("total-balance").innerText =
    `₹${(income - expense).toFixed(2)}`;
}

function updateChart(transactions) {
  const ctx = document.getElementById("financeChart").getContext("2d");
  let income = 0;
  let expense = 0;
  transactions.forEach((t) => {
    if (t.type === "income") income += t.amount;
    if (t.type === "expense") expense += t.amount;
  });

  if (financeChart) financeChart.destroy();
  if (income === 0 && expense === 0) return;

  financeChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Income", "Expenses"],
      datasets: [
        {
          data: [income, expense],
          backgroundColor: ["#10b981", "#ef4444"],
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      cutout: "70%",
    },
  });
}
