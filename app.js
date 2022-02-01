//jshint esversion:6
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

console.log(process.env.API_KEY)

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });  //add encryp. package as a plugin to userSchema

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
        password: req.body.password
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
    const password = req.body.password
    
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