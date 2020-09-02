require('dotenv').config()
const express = require("express")
const app = express()
const got = require("got")
const bodyParser = require("body-parser")
const pool = require("./db")
const queries = require("./queries")
const port = process.env.APP_PORT

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.json())
app.use(bodyParser.urlencoded({
    extended: true
}));

const returnArray = arg => {
    return Array.isArray(arg) ? arg : [arg]
}

const returnMaxURLIfExists = async url => {
    try {
        const maxresExists = await got(url)
        if (maxresExists.statusCode === 200) return url
    } catch (error) {
        if (error.response.statusCode === 404) return null
    }
}

// get all videos
app.get("/api/videos", async (req, res) => {
    try {
        const videos = await pool.query(queries.getVideos)
        res.json(videos.rows)
    } catch (error) {
        console.log(error)
        res.json(error)
    }
})

// get all videos from x vtuber
app.get("/api/videos/filter", async (req, res) => {
    const vTUberFilterQuery = returnArray(req.query.vtuber)
    try {
        const filteredVideos = await pool.query(queries.getFilteredVideos, [vTUberFilterQuery, vTUberFilterQuery.length])
        res.json(filteredVideos.rows)
    } catch (error) {
        console.log(error)
        res.json(error)
    }
})

// post a video to db
app.post("/api/videos", async (req, res) => {
    const client = await pool.connect()
    const response = await got(`https://youtube.com/oembed?url=${req.query.url}&format=json`)
    const { title, thumbnail_url } = JSON.parse(response.body)
    try {
        await client.query("BEGIN") // insert #1 start
        const videoURL = `https://youtube.com/watch?v=${thumbnail_url.split("/vi/")[1].split("/")[0]}`
        const thumbnailMaxURL = thumbnail_url.replace(/hqdefault/gi, "maxresdefault")
        const maxUrlExists = await returnMaxURLIfExists(thumbnailMaxURL)
        const vTuberPostQuery = returnArray(req.query.vtuber)
        const insertValues = [title, thumbnail_url, maxUrlExists, videoURL, vTuberPostQuery]
        await client.query(queries.insertVideo, insertValues) // insert #1 end

        const insertedVideo = await client.query(queries.getInsertedVideo, [title]) // insert #2+ start
        const insertedVideoID = insertedVideo.rows[0].v_id
        for (const vtuber of vTuberPostQuery) {
            const getVtuber = await client.query(queries.getVtuber, [vtuber])
            const vtuberID = getVtuber.rows[0].vt_id
            await client.query(queries.insertToJoin, [insertedVideoID, vtuberID])
        }
        await client.query("COMMIT")
        res.send(`Video '${title}' was inserted successfully!`) // insert #2+ end
    } catch (error) {
        await client.query("ROLLBACK")
        throw error
    } finally {
        client.release() // finish transaction
    }
})

app.get("/api/videos/:id", async (req, res) => {
    const getVideo = await pool.query(queries.getSelectedVideo, [req.params.id])
    res.send(getVideo.rows[0])
})

app.put("/api/videos/:id", async (req, res) => {
    client = await pool.connect()
    const response = await got(`https://youtube.com/oembed?url=${req.body.new_url}&format=json`)
    const { title, thumbnail_url } = JSON.parse(response.body)
    try {
        await client.query("BEGIN")
        // get current item in db; if same title, don't rubn this
        const getcurrent = await client.query(queries.getVideoToUpdate, [req.params.id])
        if (getcurrent.rows[0].title !== title) {
            const videoURL = `https://youtube.com/watch?v=${thumbnail_url.split("/vi/")[1].split("/")[0]}`
            const thumbnailMaxURL = thumbnail_url.replace(/hqdefault/gi, "maxresdefault")
            const maxUrlExists = await returnMaxURLIfExists(thumbnailMaxURL)
            const insertValues = [title, thumbnail_url, maxUrlExists, videoURL, req.params.id]
            await client.query(queries.updateSelectedVideo, insertValues)
        }

        // updating join table //
        const getVideoToUpdate = await client.query(queries.getVideoToUpdate, [req.params.id])
        const { video_includes } = getVideoToUpdate.rows[0]
        const vtuberArr = returnArray(req.body.vtubers)
        //case #1: adding new members
        if (vtuberArr.length > getVideoToUpdate.rows[0].video_includes.length) {
            // get array of new members
            const filtered = vtuberArr.filter(item => getVideoToUpdate.rows[0].video_includes.indexOf(item) < 0)
            // insert to join table
            for (const vtuber of filtered) {
                const getVtuber = await client.query(queries.getVtuber, [vtuber])
                const vtuberID = getVtuber.rows[0].vt_id
                await client.query(queries.insertToJoin, [req.params.id, vtuberID])
            }
            // update video includes
            await client.query(queries.updateSelectedVideoIncludes, [vtuberArr, req.params.id])
        } else {
            // case #2: removing members
            // get array of new / less members / members to remove fron join
            const filtered = video_includes.filter(item => !vtuberArr.includes(item))
            // remove from join table
            for (const vtuber of filtered) {
                const getVtuber = await client.query(queries.getVtuber, [vtuber])
                const vtuberID = getVtuber.rows[0].vt_id
                await client.query(queries.removeFromJoin, [req.params.id, vtuberID])
            }
            // update video includes
            await client.query(queries.updateSelectedVideoIncludes, [vtuberArr, req.params.id])
        }
        await client.query("COMMIT")
        res.send(`Video '${title}' was updated successfully!`) // insert #2+ end

    } catch (error) {
        await client.query("ROLLBACK")
        throw error
    } finally {
        client.release()
    }
})

app.delete("/api/videos/:id", async (req, res) => {
    try {
        const deleteVideo = await pool.query(queries.deleteVideo, [req.params.id])
        res.json("video was deleted")
    } catch (error) {
        console.log(error)
        throw error
    }
})

app.listen(port, () => {
    console.log(`server started on port ${port}`)
})