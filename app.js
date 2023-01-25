// Utiliser express
const express = require('express');
const app = express();

// Utiliser body parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

// Utiliser Bcrypt pour hacher le mdp
const bcrypt = require('bcrypt');

// Pour recuper les data dans un autre dossier (API )
const cors = require('cors');
app.use(cors());

// Création de token et cryptage mot de passe
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const { createToken, validateToken } = require('./JWT')

// Connexion à la base de donnée Mangodb Atlas
require('dotenv').config();
// .config permet d'utiliser le process.env
var port = process.env.PORT
var dbURL = process.env.DATABASE_URL;


const mongoose = require('mongoose');
// Pas de requete SQL (strictQuery)
mongoose.set("strictQuery", false);
mongoose.connect(dbURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(console.log("MongoDB connected"))
    .catch(err => console.log("Error:" + err));

// Methode Override pour utiliser PUT et DELETE
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

//Déclarer les const model

const User = require('./Models/User');
const Concert = require('./Models/Concert');



// Pour l'inscription
app.post('/api/signup', function (req, res) {
    const Data = new User({
        username: req.body.username,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10),
        age: req.body.age,
        tel: req.body.tel,
        admin: false,
    })
    Data.save().then(() => {
        console.log("User saved"),
            res.redirect("http://localhost:3000/login")
    })
        .catch(err => console.log(err))
});


// Pour le login
app.post('/api/login', function (req, res) {
    User.findOne({
        email: req.body.email
    }).then(user => {
        if (!user) {
            res.status(404).send('Email Invalid !');
        }
        // Authentification JWT token
        const accessToken = createToken(user);
        res.cookie("access-token", accessToken, { maxAge: 60 * 60 * 24 * 30 * 12, httpOnly: true });

        if (!bcrypt.compareSync(req.body.password, user.password)) {
            res.status(404).send('Password Invalid !');
        }
        res.redirect("http://localhost:3000/users/:name" + user.username)
        // res.json("LOGGED IN");

    }).catch(err => { (console.error)(err) });
});


app.get('/allusers', function (req, res) {
    User.find().then(data => {
        res.json({ data: data })
    }).catch(err => { console.log(err) });
});



// Pour les spectacles
app.post('/api/newconcert', function (req, res) {
    const Data = new Concert({
        titre: req.body.titre,
        artiste: req.body.artiste,
        description: req.body.description,
    })
    Data.save().then(() => {
        console.log("Spectacle saved"),
            res.redirect("http://localhost:3000/allconcerts")
    })
        .catch(err => console.log(err))
});

app.get('/allconcerts', function (req, res) {
    Concert.find().then(data => {
        res.json({ data: data })
    }).catch(err => { console.log(err) });
});






















// déclarer le serveur
const server = app.listen(port, function () {
    console.log('Server listening on port ' + port);
});