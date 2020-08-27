require('dotenv').config()
const express = require("express")
const app = express()
const got = require("got")
const pool = require("./db")
const port = process.env.APP_PORT

app.listen(port, () => {
    console.log(`server started on port ${port}`)
})