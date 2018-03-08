var express = require('express')
       var app = express()

app.set("view engine", "hbs")

app.get('/', function(request, response){
        response.render('index.hbs')
})

app.get('/test', function(request, response){
    response.end("It's working!")
})

app.listen(3000, () => console.log('My website is listening on port 3000!'))