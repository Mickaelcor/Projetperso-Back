// Déclaration des const
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./Models/User.js');
const Place = require('./Models/Place.js');
const cookieParser = require('cookie-parser');
// Pour ajout photo par lien 
const imageDownloader = require('image-downloader');
// Pour upload image
const multer = require('multer');
// Pour renommer les fichiers sur le serveur
const fs = require('fs');

// Connexion à la base de donnée Mangodb Atlas
require('dotenv').config();
// .config permet d'utiliser le process.env
var port = process.env.PORT
var dbURL = process.env.DATABASE_URL;
const app = express();

// Utiliser body parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

// Utiliser Bcrypt pour hacher le mdp
const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'fasefraw4r5r3wq45wdfqw34twdfq';

// Pour recuper les data dans un autre dossier (API )
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000',
}));


// Import de moment pour gerer l'affichage des dates
const moment = require('moment');
moment().format('Do MMMM YYYY');



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


// REGISTER

app.get('/test', function (req, res) {
    res.json('test ok')
})

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userDoc = await User.create({
            name,
            email,
            password: bcrypt.hashSync(password, bcryptSalt),
        });
        res.json(userDoc);
    } catch (e) {
        res.status(422).json(e);
    }
});


// LOGIN

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const userDoc = await User.findOne({ email });
    if (userDoc) {
        const passOk = bcrypt.compareSync(password, userDoc.password);
        if (passOk) {
            jwt.sign({
                email: userDoc.email,
                id: userDoc._id
            }, jwtSecret, {}, (err, token) => {
                if (err) throw err;
                res.cookie('token', token).json(userDoc);
            });
        } else {
            res.status(422).json('pass not ok');
        }
    } else {
        res.json('not found');
    }
});

// PROFILE

app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) throw err;
            const { name, email, _id } = await User.findById(userData.id);
            res.json({ name, email, _id });
        });
    } else {
        res.json(null);
    }
});

// LOGOUT
//permet de tuer le token
app.post('/logout', (req, res) => {
    res.cookie('token', '').json(true);
});


// Ajout de photo par lien avec le package image downloader
app.post('/upload-by-link', async (req, res) => {
    const { link } = req.body;
    const newName = 'photo' + Date.now() + '.jpg';
    await imageDownloader.image({
        url: link,
        dest: __dirname + '/uploads/' + newName,
    });
    res.json(newName);
});

// Ajout de photo par Upload
const photosMiddleware = multer({ dest: 'uploads/' });
app.post('/upload', photosMiddleware.array('photos', 100), (req, res) => {
    const uploadedFiles = [];
    for (let i = 0; i < req.files.length; i++) {
        const { path, originalname } = req.files[i];
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        const newPath = path + '.' + ext;
        fs.renameSync(path, newPath);
        uploadedFiles.push(newPath.replace('uploads/', ''));
    }
    res.json(uploadedFiles);
});

// Ajout d'un nouveau concert
app.post('/places', (req, res) => {
    // On recupere l'user afin de savoir qui poste le concert
    const { token } = req.cookies;
    const {
        title, address, addedPhotos, description,
        perks, extraInfo, checkIn, checkOut, maxGuests,
    } = req.body;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        const placeDoc = await Place.create({
            owner: userData.id,
            title, address, photos: addedPhotos, description,
            perks, extraInfo, checkIn, checkOut, maxGuests,
        });
        res.json(placeDoc);
    });
});

// Recuperer des concert ajoutés par l'user connecté
app.get('/places', (req, res) => {
    const { token } = req.cookies;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        const { id } = userData;
        res.json(await Place.find({ owner: id }));
    });
});

// Recuperer les details du concert àjouter par l'user connécté afin de l'afficher dans une nouvelle page
app.get('/places/:id', async (req, res) => {
    const { id } = req.params;
    res.json(await Place.findById(id));
});

// Pour modifier les concert deja ajouter
app.put('/places', async (req, res) => {
    const { token } = req.cookies;
    const {
        id, title, address, addedPhotos, description,
        perks, extraInfo, checkIn, checkOut, maxGuests,
    } = req.body;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        const placeDoc = await Place.findById(id);
        if (userData.id === placeDoc.owner.toString()) {
            placeDoc.set({
                title, address, photos: addedPhotos, description,
                perks, extraInfo, checkIn, checkOut, maxGuests,
            });
            await placeDoc.save();
            res.json('ok');
        }
    });
});

// déclarer le serveur
const server = app.listen(port, function () {
    console.log('Server listening on port ' + port);
});