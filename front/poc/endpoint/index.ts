import express from "express";

const app = express();
const PORT = 8080;

app.get("/about.json", (req, res) => {
  res.json({
    client: { host: req.ip },
    server: {
      current_time: Math.floor(Date.now() / 1000),
      services: [
        {
          name: "demo",
          actions: [{ name: "hello", description: "A test action" }],
          reactions: [{ name: "world", description: "A test reaction" }]
        }
      ]
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
