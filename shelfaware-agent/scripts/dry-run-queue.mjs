// One in-memory run: incomplete agent_queue doc -> fix -> write products
// and product_templates, then delete the queue doc. No Firebase, no providers.

import { setFirestoreForTest } from '../lib/firestore.js';
import handler, { setResolveForTest } from '../api/process-queue.js';

function createMemoryDb() {
  const cols = new Map();
  function bucket(name) {
    if (!cols.has(name)) cols.set(name, new Map());
    return cols.get(name);
  }
  function docRef(name, id) {
    return {
      id,
      async get() {
        const data = bucket(name).get(id);
        return {
          id,
          exists: data !== undefined,
          data: () => (data ? { ...data } : undefined),
        };
      },
      async set(data, opts) {
        const prev = bucket(name).get(id) || {};
        bucket(name).set(id, opts?.merge ? { ...prev, ...data } : { ...data });
      },
      async delete() {
        bucket(name).delete(id);
      },
    };
  }
  function query(name) {
    return {
      orderBy() {
        return this;
      },
      limit() {
        return this;
      },
      async get() {
        const docs = [...bucket(name).entries()].map(([id, data]) => ({
          id,
          data: () => ({ ...data }),
        }));
        return { empty: docs.length === 0, docs, size: docs.length };
      },
      count() {
        return {
          get: async () => ({ data: () => ({ count: bucket(name).size }) }),
        };
      },
      doc(id) {
        return docRef(name, id);
      },
    };
  }
  return {
    collection(name) {
      return query(name);
    },
    batch() {
      const ops = [];
      return {
        set(ref, data, opts) {
          ops.push(() => ref.set(data, opts));
          return this;
        },
        async commit() {
          for (const op of ops) await op();
        },
      };
    },
    size(name) {
      return bucket(name).size;
    },
    read(name, id) {
      return bucket(name).get(id);
    },
  };
}

const prevSecret = process.env.CRON_SECRET;
process.env.CRON_SECRET = 'dry-run-local';

const db = createMemoryDb();
setFirestoreForTest(db, {
  Timestamp: { now: () => ({ seconds: 1, nanoseconds: 0 }) },
  FieldValue: { serverTimestamp: () => ({ seconds: 1, nanoseconds: 0 }) },
});
setResolveForTest(async () => ({
  success: true,
  data: {
    product_name: 'Dry Run Milk',
    brand: 'Fixture',
    category: 'dairy',
    typical_shelf_life_days: 7,
  },
  source: 'AGENT:DryRun',
  attempts: [],
}));

const barcode = '0001112223334';
await db.collection('agent_queue').doc(barcode).set({
  country: 'BD',
  createdAt: 1,
});

const res = {
  _code: 200,
  body: null,
  status(code) {
    this._code = code;
    return this;
  },
  json(body) {
    this.body = body;
  },
};

try {
  await handler(
    { headers: { authorization: 'Bearer dry-run-local' }, method: 'POST' },
    res
  );
  const product = db.read('products', barcode);
  const template = db.read('product_templates', barcode);
  const queueLeft = db.size('agent_queue');
  if (res._code !== 200 || !res.body || res.body.resolved !== 1 || res.body.processed !== 1) {
    console.log('agent dry-run failed');
    process.exit(1);
  }
  if (!product || product.product_name !== 'Dry Run Milk' || product.category !== 'dairy') {
    console.log('agent dry-run failed');
    process.exit(1);
  }
  if (!template || template.name !== 'Fixture Dry Run Milk' || template.country_code !== 'BD') {
    console.log('agent dry-run failed');
    process.exit(1);
  }
  if (typeof template.updated_at !== 'number' || queueLeft !== 0) {
    console.log('agent dry-run failed');
    process.exit(1);
  }
  console.log('agent dry-run ok resolved=1 queue=0');
} catch {
  console.log('agent dry-run failed');
  process.exit(1);
} finally {
  if (prevSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = prevSecret;
}
