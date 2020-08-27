require('dotenv').config()
const express = require("express")
const app = express()
const got = require("got")
const pool = require("./db")
const queries = require("./queries")
const port = process.env.APP_PORT

// get all videos
app.get("/api/videos", async(req, res) => {
    try {
        const videos = await pool.query(queries.getVideos)
        res.json(videos.rows)
    } catch (error) {
        res.json(error)
    }
})

app.listen(port, () => {
    console.log(`server started on port ${port}`)
})