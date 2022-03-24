if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const ip = require('ip');
const bcrypt = require('bcrypt')
const passport = require('passport')
const fs = require('fs-extra')
const methodOverride = require('method-override')
const flash = require('express-flash')
const session = require('express-session')
const { ping } = require('bedrock-protocol')

const userpath = './users/index.json'
const intitializePassport = require('./passport-config')

intitializePassport(
    passport,
    username => users.find(user => user.username === username),
    id => users.find(user => user.id === id)
)


// Loading in users.json and loading into local var

let users = []
var user = JSON.parse('{"id":" ", "username":" ", "password":""}')

// Add User

function addUser(id, username, password) {
    fs.readFile('./users/index.json', 'utf-8', function(err, data) {
        if (err) throw err

        var arrayOfObjects = JSON.parse(data)
        arrayOfObjects.user.push({
            id: id,
            username: username,
            password: password
        })

        console.log(arrayOfObjects)

        fs.writeFile('./users/index.json', JSON.stringify(arrayOfObjects), 'utf-8', function(err) {
            if (err) throw err
            console.log('Done!')
        })
    })
}

// Retrieve Users

function returnJson() {
    fs.readFile('./users/index.json', 'utf-8', function(err, data) {
        console.log('Reading in users.')
        if (err) throw err
        var arrayOfObjects = JSON.parse(data)
        for (var x in arrayOfObjects.user) {
            var id = arrayOfObjects.user[x].id
            var username = arrayOfObjects.user[x].username
            var hash = arrayOfObjects.user[x].password

            users.push({
                id: id,
                username: username,
                password: hash
            })

            console.log('\nid:' + id, '\nusername:' + username, '\nhash: ****')
        }
    })
    console.log('Success!\n')
}

let minecraftServerName = ''
let minecraftServerVersion = ''
let minecraftServerPlayers = ''

function checkMinecraft() {
    try {
        ping({ host: 'mc.whiterabbit.pw', port: 19132 }).then(res => {
            minecraftServerName = res.motd
            minecraftServerVersion = res.version
            minecraftServerPlayers = res.playersOnline + '/' + res.playersMax
            console.log(minecraftServerName + minecraftServerVersion + minecraftServerPlayers)
        })

    } catch (e) {
        console.log(e)
        return null
    }
}
checkMinecraft()

// Get users
returnJson()


// Express intitialization

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitizalized: false
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(express.static("public"))


// Routing under Here

//Index page

app.get('/', checkAuthenticated, (req, res) => {
    var minecraftCheck = checkMinecraft()
    res.render('index.ejs', {
        name: req.user.username,
        title: minecraftServerName,
        version: minecraftServerVersion,
        players: minecraftServerPlayers
    })
    const ipinfo = req.ip.split(':')
    console.log('User IP: ' + ipinfo[3])
})


// Login page

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.post('/login', checkNotAuthenticated, (req, res) => {
    req.body.username
})


// Register page

app.get('/register', checkAuthenticated, (req, res) => {
    res.render('register.ejs')
})

app.post('/register', checkAuthenticated, async(req, res) => {
    req.body.username
    var id = Date.now().toString()
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        addUser(id, req.body.username, hashedPassword)
        console.log('User IP: ' + req.ip.toString())
        users.push({
            id: id,
            username: req.body.username,
            password: hashedPassword
        })


        // Saving to JSON file



        // Redirecting to login page after new user added

        res.redirect('/login')
    } catch {
        res.redirect('/register')
    }
})

// Robot Car
app.get('/robotcar', (req, res) => {
    res.render('robotcar.ejs')
})


// Logout

app.delete('/logout', (req, res) => {

    req.logOut()
    res.redirect('/login')
})


// Checkauth functions

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }

    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}

console.log(ip.address())

app.listen(3000)