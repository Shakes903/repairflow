require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const crypto = require("crypto");
const { getContainer } = require("./cosmos");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.use(morgan("dev"));

const VALID_STATUS = new Set([
  "SUBMETIDO",
  "EM_DIAGNOSTICO",
  "ORCAMENTO_ENVIADO",
  "APROVADO",
  "EM_REPARACAO",
  "CONCLUIDO",
  "LEVANTADO",
  "CANCELADO",
]);

app.get("/health", (_req, res) => {
  res.json({ status: "RepairFlow API running" });
});

app.post("/repairs", async (req, res) => {
  const { clientName, device, problem } = req.body;

  if (!clientName || !device || !problem) {
    return res.status(400).json({ error: "Campos obrigatórios em falta." });
  }

  const newRepair = {
    id: crypto.randomUUID(),
    clientName,
    device,
    problem,
    status: "SUBMETIDO",
    createdAt: new Date().toISOString(),
  };

  try {
    const container = getContainer();
    await container.items.create(newRepair);
    res.status(201).json(newRepair);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/repairs", async (_req, res) => {
  try {
    const container = getContainer();
    const { resources } = await container.items.readAll().fetchAll();
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/repairs/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!VALID_STATUS.has(status)) {
    return res.status(400).json({ error: "Status inválido." });
  }

  try {
    const container = getContainer();
    const { resource } = await container.item(id, id).read();

    resource.status = status;
    resource.updatedAt = new Date().toISOString();

    await container.items.upsert(resource);
    res.json(resource);
  } catch (err) {
    res.status(404).json({ error: "Reparação não encontrada." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));