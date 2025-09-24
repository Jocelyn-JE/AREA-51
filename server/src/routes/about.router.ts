import express from "express";

const router = express.Router();

router.use("/", (req, res) => {
    res.send("Area 51 API - About Page");
});

export default router;
