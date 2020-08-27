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
    `
}

module.exports = queries;