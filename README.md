# Chuuba TL Tracker

Web app that tracks translated videos of virtual Youtubers ("Vtubers", or "Chuubas"), currently exclusively for Hololive. 

### Tech

*[Node.js](https://nodejs.org/en/)
*[Express](https://github.com/expressjs/express)
*[PostgresQL](https://www.postgresql.org)
*[oEmbed](https://oembed.com)
*[React](https://github.com/facebook/react/)

### Notes

Initially, this app was meant to use Youtube's API to fetch data about the videos. The somewhat strict quota limits, however, seemed like it could pose an issue. As a workaround, this app uses oEmbed to fetch data about videos. oEmbed does not return all the data Youtube's API does, but has been sufficient for this app. Further testing with Youtube's API may lead to its implementation.