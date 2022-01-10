const express = require('express');
const app = express();
const routes = require('./routes/routes')
const path = require('path')
const ejs_mate = require('ejs-mate')

app.engine('ejs', ejs_mate)
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: true }))

app.use('/', routes)

app.listen(8080, () => {
    console.log('Listening on port 8080')
})
