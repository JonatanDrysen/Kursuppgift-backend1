const express = require("express");

const app = express()
const PORT = 3000;

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.listen(PORT, () => {
  console.log(`Started Express server on port ${PORT}`);
});