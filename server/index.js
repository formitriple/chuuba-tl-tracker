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

// post a video to db
app.post("/api/videos", async(req, res) => {
    const client = await pool.connect()
    const response = await got(`https://youtube.com/oembed?url=${req.query.url}&format=json`)
    const {title, thumbnail_url} = JSON.parse(response.body)
    try {
        await client.query("BEGIN") // insert #1 start
        const videoURL = `https://youtube.com/watch?v=${thumbnail_url.split("/vi/")[1].split("/")[0]}`
        const thumbnailMaxURL = thumbnail_url.replace(/hqdefault/gi, "maxresdefault")
        const insertValues = [title, thumbnail_url, thumbnailMaxURL, videoURL]
        await client.query(queries.insertVideo, insertValues) // insert #1 end

        const insertedVideo = await client.query(queries.getInsertedVideo, [title]) // insert #2+ start
        const insertedVideoID = insertedVideo.rows[0].v_id
        const vTuberQueryArr = Array.isArray(req.query.vtuber) ? req.query.vtuber : [req.query.vtuber]
        for (const vtuber of vTuberQueryArr) {
            const getVtuber = await client.query(queries.getVtuber, [vtuber])
            const vtuberID = getVtuber.rows[0].vt_id
            await client.query(queries.insertToJoin, [insertedVideoID, vtuberID])
        }
        await client.query("COMMIT") // insert #2+ end
    } catch (error) {
        await client.query("ROLLBACK")
        res.json(error);
    } finally {
        client.release() // finish transaction
        res.send(`Video '${title}' was inserted successfully!`)
    }
})

app.listen(port, () => {
    console.log(`server started on port ${port}`)
})