const express = require("express");
const cors = require("cors");
const multer = require("multer");

require("dotenv").config();

const app = express();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
});

app.use(cors());

let analyzeEssay;

app.post("/", upload.none(), async (req, res) => {
  const { text, specNeeds = false } = req.body;
  const analysis = await analyzeEssay(text, {
    specNeeds: parseBoolean(specNeeds),
  });

  res.json(analysis);
});

app.post("/file", upload.single("file"), async (req, res) => {
  const { specNeeds = false } = req.body;
  const fileString = req.file.buffer.toString("utf-8");
  const analysis = await analyzeEssay(fileString, {
    specNeeds: parseBoolean(specNeeds),
  });

  res.json(analysis);
});

const port = 3000;

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  validateEnv();
  ({ analyzeEssay } = await import("mature-ts/analyze"));

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
}

function validateEnv() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Brak OPENAI_API_KEY w srodowisku");
  }
}

function parseBoolean(value) {
  return value === true || value === "true" || value === "1" || value === "on";
}
