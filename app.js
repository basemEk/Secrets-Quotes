//jshint esversion:6
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const md5 = require('md5');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));


console.log(md5("123456"));    //the same as the one in the database

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


const User = new mongoose.model('User', userSchema);

app.get('/', (req, res) => {
    res.render("home")
});

app.get('/register', (req, res) => {
    res.render("register")
});

app.post('/register', (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    })
    
    newUser.save((err) => {
        if(err) {
            console.log(err)
        } else {
            res.render("secrets")
        }
    });
});


app.get('/login', (req, res) => {
    res.render("login")
});

app.post('/login', (req, res) => {
    const username = req.body.username
    const password = md5(req.body.password)
    
    User.findOne({email: username}, (err, foundUser) => {
        if(err) {
            console.log(err)
        } else {
            if(foundUser) {
                if(foundUser.password === password) {
                    // console.log(foundUser.password)
                    res.render("secrets")
                }
            }
        }
    })
})

app.get('/secrets', (req, res) => {
    res.render("secrets")
});

app.get('/submit', (req, res) => {
    res.render("submit")
});


app.listen(3000, function() {
    console.log("App is listening at port 3000")
})