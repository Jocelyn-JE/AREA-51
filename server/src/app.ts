import express from "express";
import swaggerRouter from "./routes/swagger";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api-docs", swaggerRouter);
app.get("/", (req, res) => {
    res.send("Home Page");
});

app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});
