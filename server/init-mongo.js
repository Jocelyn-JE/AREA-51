db = db.getSiblingDB(process.env.MONGO_DB);
db.createUser({
    user: process.env.MONGO_USER,
    pwd: process.env.MONGO_PASSWORD,
    roles: ["readWrite", "dbAdmin"]
});

db.createCollection("tokens", {});

const tokensCollection = db.tokens;
tokensCollection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 600 });

const usersCollection = db.users;
usersCollection.insertOne({
    email: "admin@admin.com",
    password: "$2a$10$n.TpGvHal2b7gopgn9AErOrMKKTBm.LalREe.SaZzRHMoyGOZYXGG",
    role: "admin",
    name: "Administrator",
    id: 0
});
