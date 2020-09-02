const queries = {
    getVideos: `
        SELECT video.v_id, video.title, video.video_url, video.thumbnail_url_hq, video.thumbnail_url_max, video.created_at, json_agg(json_build_object(
            'name', name,
            'channel_url', channel_url,
            'icon_url', icon_url)
        ) AS vtubers
        FROM video
        JOIN vid_vtuber ON video.v_id = vid_vtuber.v_id
        JOIN vtuber ON vtuber.vt_id = vid_vtuber.vt_id
        GROUP BY video.v_id
        ORDER BY video.created_at DESC
    `,
    getFilteredVideos: `
        SELECT v.title, v.video_url, v.thumbnail_url_hq, v.thumbnail_url_max, v.created_at json_agg(json_build_object(
            'name', name,
            'channel_url', channel_url,
            'icon_url', icon_url)
        ) AS vtubers
        FROM video v
        JOIN vid_vtuber vvt ON v.v_id = vvt.v_id
        JOIN vtuber vt ON vt.vt_id = vvt.vt_id
        WHERE $1 && v.video_includes
        GROUP BY v.v_id
        HAVING COUNT(DISTINCT vt.vt_id) >= $2
        ORDER BY v.v_id DESC
    `,
    insertVideo: "INSERT INTO video(title, thumbnail_url_hq, thumbnail_url_max, video_url, video_includes) VALUES($1, $2, $3, $4, $5)",
    getInsertedVideo: "SELECT v_id FROM video WHERE title = $1",
    insertToJoin: "INSERT INTO vid_vtuber(v_id, vt_id) VALUES($1, $2)",
    getVtuber: "SELECT * FROM vtuber WHERE name = $1",
    getSelectedVideo: "SELECT * FROM video WHERE v_id = $1",
    updateSelectedVideo: "UPDATE video SET title = $1, thumbnail_url_hq = $2, thumbnail_url_max = $3, video_url = $4 WHERE v_id = $5",
    updateSelectedVideoIncludes: "UPDATE video SET video_includes = $1 WHERE v_id = $2",
    removeFromJoin: "DELETE FROM vid_vtuber WHERE v_id = $1 AND vt_id = $2",
    getVideoToUpdate: "SELECT * FROM video WHERE v_id = $1",
    deleteVideo: "DELETE FROM video WHERE v_id = $1"
}

module.exports = queries;