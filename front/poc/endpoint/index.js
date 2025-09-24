import express from "express";
import cors from "cors";

const app = express();
const PORT = 8080;

app.use(cors());

app.get("/about.json", (req, res) => {
  res.json({
    client: {
      host: req.ip,
    },
    server: {
      current_time: Math.floor(Date.now() / 1000),
      services: [
        {
          name: "facebook",
          actions: [
            {
              name: "new_message_in_group",
              description: "A new message is posted in the group",
            },
            {
              name: "new_message_inbox",
              description: "A new private message is received by the user",
            },
            {
              name: "new_like",
              description:
                "The user gains a like from one of their messages",
            },
          ],
          reactions: [
            {
              name: "like_message",
              description: "The user likes a message",
            },
          ],
        },
      ],
    },
  });
});

app.listen(PORT, () => {
  console.log(`AREA backend running at http://localhost:${PORT}`);
});
