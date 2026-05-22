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
const { analyzePunctuation } = require("../cli/dist/punctuation.js")
const { validateEnv, readEssay } = require("../cli/dist/utils.js")

app.post('/', async (req, res) => {
  const { text, specNeeds } = req.body;
  const [language, orthography, punctuation] = await Promise.all([
    analyzeLanguage(text),
    analyzeOrthography(text, { specNeeds }),
    analyzePunctuation(text),
  ]);
  res.json({ ...language, ...orthography, ...punctuation });
})

app.post('/file', upload.single('file'), async (req, res) => {
  const fileString = req.file.buffer.toString("utf-8")
  const [language, orthography, punctuation] = await Promise.all([
    analyzeLanguage(fileString),
    analyzeOrthography(fileString),
    analyzePunctuation(fileString),
  ]);
  res.json({ ...language, ...orthography, ...punctuation });
})

app.listen(port, () => {
  validateEnv()
  console.log(`Example app listening on port ${port}`)
})
