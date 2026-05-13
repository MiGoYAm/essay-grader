const express = require('express')
const app = express()
require('dotenv').config()
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 3 * 1024 * 1024
  }
})
const port = 3000

const { analyzeLanguage } = require("../cli/dist/language.js")
const { analyzeOrthography } = require("../cli/dist/orthography.js")
const { validateEnv, readEssay } = require("../cli/dist/utils.js")

app.post('/', async (req, res) => {
  const { text, specNeeds } = req.body;
  const [language, orthography] = await Promise.all([
    analyzeLanguage(text),
    analyzeOrthography(text, { specNeeds }),
  ]);
  res.json({ ...language, ...orthography });
})

app.post('/file', upload.single('file'), async (req, res) => {
  const fileString = req.file.buffer.toString("utf-8")
  const [language, orthography] = await Promise.all([
    analyzeLanguage(fileString),
    analyzeOrthography(fileString),
  ]);
  res.json({ ...language, ...orthography });
})

app.listen(port, () => {
  validateEnv()
  console.log(`Example app listening on port ${port}`)
})