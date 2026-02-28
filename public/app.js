async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...opts
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!res.ok) throw new Error(data.error || data.raw || "Erro no pedido");
  return data;
}

const rowsEl = document.getElementById("rows");
const healthEl = document.getElementById("health");

const STATUSES = [
  "SUBMETIDO",
  "EM_DIAGNOSTICO",
  "ORCAMENTO_ENVIADO",
  "APROVADO",
  "EM_REPARACAO",
  "CONCLUIDO",
  "LEVANTADO",
  "CANCELADO"
];

function statusSelect(current) {
  return `
    <select class="status">
      ${STATUSES.map(s => `<option value="${s}" ${s === current ? "selected" : ""}>${s}</option>`).join("")}
    </select>
  `;
}

async function loadHealth() {
  try {
    await api("/health");
    healthEl.innerHTML = `<span class="ok">API OK</span>`;
  } catch (e) {
    healthEl.innerHTML = `<span class="err">API ERRO</span>`;
  }
}

async function loadRepairs() {
  rowsEl.innerHTML = `<tr><td colspan="6">A carregar...</td></tr>`;

  const repairs = await api("/repairs");

  rowsEl.innerHTML = repairs.map(r => `
    <tr data-id="${r.id}">
      <td><code>${r.id}</code></td>
      <td>${r.clientName ?? ""}</td>
      <td>${r.device ?? ""}</td>
      <td>${r.problem ?? ""}</td>
      <td>${statusSelect(r.status)}</td>
      <td><button class="btnSave">Guardar</button></td>
    </tr>
  `).join("");

  if (repairs.length === 0) {
    rowsEl.innerHTML = `<tr><td colspan="6">Sem reparações.</td></tr>`;
  }
}

document.getElementById("btnRefresh").addEventListener("click", () => {
  loadRepairs().catch(err => alert(err.message));
});

document.getElementById("btnCreate").addEventListener("click", async () => {
  const clientName = document.getElementById("clientName").value.trim();
  const device = document.getElementById("device").value.trim();
  const problem = document.getElementById("problem").value.trim();

  if (!clientName || !device || !problem) {
    alert("Preenche cliente, dispositivo e problema.");
    return;
  }

  await api("/repairs", {
    method: "POST",
    body: JSON.stringify({ clientName, device, problem })
  });

  document.getElementById("problem").value = "";
  await loadRepairs();
});

rowsEl.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("btnSave")) return;

  const tr = e.target.closest("tr");
  const id = tr.getAttribute("data-id");
  const status = tr.querySelector("select.status").value;

  await api(`/repairs/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status })
  });

  await loadRepairs();
});

loadHealth();
loadRepairs().catch(err => alert(err.message));