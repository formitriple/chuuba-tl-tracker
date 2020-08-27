const queries = {
    getVideos: `
        SELECT video.title, video.video_url, video.thumbnail_url_hq, video.thumbnail_url_max, json_agg(json_build_object(
            'name', name,
            'channel_url', channel_url,
            'icon_url', icon_url)
        ) AS vtubers
        FROM video
        JOIN vid_vtuber ON video.v_id = vid_vtuber.v_id
        JOIN vtuber ON vtuber.vt_id = vid_vtuber.vt_id
        GROUP BY video.v_id
    `,
    insertVideo: "INSERT INTO video(title, thumbnail_url_hq, thumbnail_url_max, video_url) VALUES($1, $2, $3, $4)",
    getInsertedVideo: "SELECT v_id FROM video WHERE title = $1",
    insertToJoin: "INSERT INTO vid_vtuber(v_id, vt_id) VALUES($1, $2)",
    getVtuber: "SELECT * FROM vtuber WHERE name = $1"
}

module.exports = queries;