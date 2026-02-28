const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = "repairflow";
const containerId = "repairs";

if (!endpoint || !key) {
  throw new Error("Faltam COSMOS_ENDPOINT ou COSMOS_KEY nas variáveis de ambiente.");
}

const client = new CosmosClient({ endpoint, key });

const database = client.database(databaseId);
const container = database.container(containerId);

function getContainer() {
  return container;
}

module.exports = { getContainer };