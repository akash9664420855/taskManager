import mongoose from 'mongoose';
import { env } from '../config/env';

async function run() {
  console.log('[cleanup] connecting…');
  await mongoose.connect(env.MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error('No database handle');

  console.log(`[cleanup] target database: ${db.databaseName}`);

  const collections = await db.listCollections().toArray();
  if (collections.length === 0) {
    console.log('[cleanup] no collections found — nothing to do');
  } else {
    console.log(`[cleanup] found ${collections.length} collection(s):`);
    for (const c of collections) {
      const count = await db.collection(c.name).estimatedDocumentCount();
      console.log(`  - ${c.name} (${count} docs)`);
    }
    console.log('[cleanup] dropping all collections…');
    for (const c of collections) {
      try {
        await db.dropCollection(c.name);
        console.log(`  ✓ dropped ${c.name}`);
      } catch (err) {
        console.warn(`  ✗ failed to drop ${c.name}:`, (err as Error).message);
      }
    }
  }

  // Also list other non-system DBs on the cluster for visibility (read-only)
  try {
    const admin = mongoose.connection.getClient().db().admin();
    const dbs = await admin.listDatabases();
    const others = dbs.databases.filter(
      (d) => !['admin', 'local', 'config'].includes(d.name) && d.name !== db.databaseName,
    );
    if (others.length > 0) {
      console.log('[cleanup] (info) other databases on cluster — left untouched:');
      for (const d of others) console.log(`  - ${d.name}`);
    }
  } catch {
    // listDatabases requires elevated permission; ignore if not granted
  }

  await mongoose.disconnect();
  console.log('[cleanup] done');
}

run().catch(async (err) => {
  console.error('[cleanup] failed:', err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
