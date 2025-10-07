db = db.getSiblingDB(process.env.MONGO_DB);
db.createUser({
    user: process.env.MONGO_USER,
    pwd: process.env.MONGO_PASSWORD,
    roles: ["readWrite", "dbAdmin"]
});

const usersCollection = db.users;
usersCollection.insertOne({
    email: "admin@admin.com",
    username: "admin",
    password: "$2a$10$n.TpGvHal2b7gopgn9AErOrMKKTBm.LalREe.SaZzRHMoyGOZYXGG",
    role: "admin"
});
usersCollection.createIndex({ email: 1 }, { unique: true });

// Services are now code-defined, not stored in DB
// Only user-created areas are stored in the areas collection
const areasCollection = db.areas;
areasCollection.createIndex({ userId: 1 });
areasCollection.createIndex({ enabled: 1 });
