const express = require('express');
const app = express();

const http = require("http").createServer(app);
const PORT = 8080;

let highest_score = 0;

app.use(express.static("public"));
app.use(express.json());
app.post("/scores", (req, res) => {
    highest_score = Math.max(req.body.score, highest_score);
    res.send({ score: highest_score });
});

http.listen(PORT);
