const { MongoClient, ServerApiVersion } = require('mongodb');



let MongoMemoryServer;
try {
  MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
} catch (e) {
  MongoMemoryServer = null;
}

const MONGO_URI = process.env.MONGO_URI;
let client = null;
let memoryServerInstance = null;

// Standard Connection Options for MongoDB Stable API
const clientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
};

/**
 * Primary Connection Handler
 */
async function connectToDatabase() {
  try {
    // 1. Cloud Deployment (Production Ready)
    if (MONGO_URI) {
      client = new MongoClient(MONGO_URI, clientOptions);
      await client.connect();
      await client.db("admin").command({ ping: 1 });
      console.log("🚀 Fleetiva: Live Cluster Connected Successfully");
      return;
    }

    // 2. Development Bypass
    if (process.env.SKIP_DB === 'true') {
      console.log("⚠️ Fleetiva: Database initialization skipped by environment flag");
      return;
    }

    // 3. Automated Local Testing Fallback
    if (MongoMemoryServer) {
      memoryServerInstance = await MongoMemoryServer.create();
      const testUri = memoryServerInstance.getUri();
      client = new MongoClient(testUri, clientOptions);
      await client.connect();
      console.log("🧪 Fleetiva: Local Test Environment Started (In-Memory)");
    } else {
      throw new Error("Missing Database Configuration: Set MONGO_URI or install memory-server.");
    }

  } catch (error) {
    console.error("❌ Fleetiva Connection Error:", error.message);
    // Graceful shutdown to prevent zombie processes
    process.exit(1);
  }
}

/**
 * Graceful Teardown for Clean Restarts
 */
async function disconnectDatabase() {
  if (client) await client.close();
  if (memoryServerInstance) await memoryServerInstance.stop();
  console.log("🔌 Fleetiva: Connections Disconnected");
}

module.exports = { 
  connectToDatabase, 
  getMongoClient: () => client, 
  disconnectDatabase 
};
