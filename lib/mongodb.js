import { MongoClient } from 'mongodb';

/**
 * The one MongoDB connection for VelBiz Cloud, and the one place its
 * database name is decided.
 *
 * WHY THE NAME COMES FROM AN ENV VAR AND DEFAULTS TO DEV
 *
 * The code this came from chose its database from NODE_ENV. `next start`
 * sets NODE_ENV to production even on a laptop, so a local production build
 * quietly read and wrote the live database. Here the live database is used
 * only when CLOUD_DB_NAME says so, which is set on the production Netlify
 * site and nowhere else. Anything unconfigured lands in velbiz_dev.
 *
 * Code carried over from the source repo still names a database in a few
 * calls. Every call, with any name or none, resolves to DB_NAME,
 * so no path can reach another product's database by accident.
 */
export const DB_NAME = process.env.CLOUD_DB_NAME || 'velbiz_dev';

const uri = process.env.MONGODB_URI;

if (!uri) {
    throw new Error('Please add your Mongo URI to .env.local (MONGODB_URI)');
}

let clientPromise;

// A module-level global, so the connection is reused across HMR reloads in
// development and across invocations that share a Node process in production.
if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, {});
    global._mongoClientPromise = client.connect().then(connectedClient => {
        const originalDb = connectedClient.db.bind(connectedClient);
        connectedClient.db = (_ignoredName, opts) => originalDb(DB_NAME, opts);
        return connectedClient;
    });
}
clientPromise = global._mongoClientPromise;

export default clientPromise;
