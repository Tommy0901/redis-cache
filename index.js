const express = require('express')
const axios = require('axios')
const cors = require('cors')
const Redis = require('redis')

const redisClient = Redis.createClient();

(async () => {
  await redisClient.connect()
  await redisClient.ping()
})()

const DEFAULT_EXPIRATION = 3600

const app = express()
const port = process.env.PORT || 3000

app.use(cors(), express.json())

app.get('/photos', async (req, res) => {
  const { albumId } = req.query
  const redisData = await redisClient.get(`photos?albumId=${albumId}`)
  if (redisData) {
    console.log('Cache Hit')
    return res.json(JSON.parse(redisData))
  }

  console.log('Cache Miss')
  const { data } = await axios.get(
    'https://jsonplaceholder.typicode.com/photos',
    { params: { albumId } }
  )
  redisClient
    .setEx(`photos?albumId=${albumId}`, DEFAULT_EXPIRATION, JSON.stringify(data))

  res.json(data)
})

app.get('/photos/:id', async (req, res) => {
  const { id } = req.params
  const redisData = await redisClient.get(`photos/${id}`)
  if (redisData) {
    console.log('Cache Hit')
    return res.json(JSON.parse(redisData))
  }

  console.log('Cache Miss')
  const { data } = await axios.get(
    `https://jsonplaceholder.typicode.com/photos/${id}`
  )
  redisClient
    .setEx(`photos/${id}`, DEFAULT_EXPIRATION, JSON.stringify(data))

  res.json(data)
})

app.listen(port, () => console.info(`App is running on http://localhost:${port}`))
