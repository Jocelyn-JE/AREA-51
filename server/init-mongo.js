db = db.getSiblingDB(process.env.MONGO_DB);
db.createUser({
    user: process.env.MONGO_USER,
    pwd: process.env.MONGO_PASSWORD,
    roles: ["readWrite", "dbAdmin"]
});

const usersCollection = db.users;
usersCollection.insertOne({
    email: "admin@admin.com",
    password: "$2a$10$n.TpGvHal2b7gopgn9AErOrMKKTBm.LalREe.SaZzRHMoyGOZYXGG",
    role: "admin"
});
usersCollection.createIndex({ email: 1 }, { unique: true });

const servicesCollection = db.services;
servicesCollection.insertOne({
    name: "example_service",
    actions: [
        { id: 1, name: "example_action", description: "An example action" }
    ],
    reactions: [
        { id: 1, name: "example_reaction", description: "An example reaction" }
    ]
});
servicesCollection.createIndex({ name: 1 }, { unique: true });
