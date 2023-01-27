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

// Import de moment pour gerer l'affichage des dates
const moment = require('moment');
moment().format('Do MMMM YYYY');

// Pour l'import d'image dans la base de donnée (via url)
const multer = require('multer');
// Dossier rendu public pour stockage d'image
app.use(express.static('public'))

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

//Déclarer les const models
const User = require('./Models/User');
const Concert = require('./Models/Concert');

// Définir l'endroit de stockage d'image
const stockage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'puclic');
    },
    filename: (req, file, callback) => {
        callback(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ stockage }).array('file')

// Route pour upload image
app.post('/upload', function (req, res) {
    upload(req, res, (err) => {

        if (err) {
            return res.status(500).json(err)
        }
        req.files.map(file => {
            console.log(req.files)
        })

        return res.status(200).json(req.files)
    });
})



// Pour l'inscription
app.post('/api/signup', function (req, res) {
    const Data = new User({
        username: req.body.username,
        prenom: req.body.prenom,
        nom: req.body.nom,
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
        res.redirect("http://localhost:3000/user/" + user.id)
        // res.json("LOGGED IN");

    }).catch(err => { (console.error)(err) });
});

// Pour afficher tous les users
app.get('/allusers', function (req, res) {
    User.find().then(data => {
        res.json({ data: data })
    }).catch(err => { console.log(err) });
});

// Pour afficher le compte utilisateur
app.get('/user/:id', function (req, res) {
    User.findOne({
        _id: req.params.id
    }).then(data => {
        res.json({ data: data })
    }).catch(err => { console.log(err) });
});


// Pour ajouter les spectacles
app.post('/api/newconcert', function (req, res) {

    // Pour modifier la forme des dates avec moment
    const date_debut = moment(req.body.date_debut);
    const date_fin = moment(req.body.date_fin);


    const Data = new Concert({
        titre: req.body.titre,
        artiste: req.body.artiste,
        description: req.body.description,
        date_debut: req.body.date_debut,
        date_fin: req.body.date_fin,
        nbr_place: req.body.nbr_place,
        reference: req.body.reference,
    })
    Data.save().then(() => {
        console.log("Spectacle saved"),
            res.redirect("http://localhost:3000/allconcerts")
    })
        .catch(err => console.log(err))
});

// Pour afficher tous les spectacles
app.get('/allconcerts', function (req, res) {
    Concert.find().then(data => {
        res.json({ data: data })
    }).catch(err => { console.log(err) });
});

// Pour afficher un seul spectacle
app.get('/oneconcert/:id', function (req, res) {
    Concert.findOne({
        _id: req.params.id
    }).then(data => {
        res.json({ data: data })
    }).catch(err => { console.log(err) });
});





















// déclarer le serveur
const server = app.listen(port, function () {
    console.log('Server listening on port ' + port);
});