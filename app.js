const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport")
const session = require("express-session")
const MongoStore = require("connect-mongo")

const { redirect } = require("statuses");
const { User } = require("./models/user")

const app = express()

    // skapar en säker autentiseringsstrategi för inloggning automatiskt m.hjälp av passport
passport.use(User.createStrategy())

    // sparar användar-Id som en cookie i webbläsaren
passport.serializeUser(User.serializeUser())

    // hämtar/laddar användar-Id från cookien som sen används för att hämta användarinfo etc
passport.deserializeUser(User.deserializeUser())

    //parsar inkommande requests från servern, tillåter användning av POST requests
app.use(express.urlencoded({extended: true}))

    // session middleware använder en "secret" för att på samma sätt som salt kryptera en sessionsnyckel
app.use(session({
    secret: "0+sdfn23324b99db32+pjncc",
    resave: false,
    saveUninitialized: false
}))

    // passport.authenticate laddar användaren från sessionen, ger tillgången till ett användarobjekt
app.use(passport.authenticate("session"))

const PORT = 3000;

app.get("/", (req, res) => {
    res.redirect("/login")
})

app.get("/signup", (req, res) => {
    res.render("signupPage.ejs");
});
app.post("/signup", async (req, res) => {
        //bryter ur username & password från request bodyn
    const {username, password} = req.body
        //definiera en ny användare utan lösenord då det ska krypteras & saltas
    const user = new User({username})
        // skicka in lösenordet för att krypteras & saltas så man kan spara det i mongo
    await user.setPassword(password)
        // spara användaren
    await user.save()
    res.redirect("/login")
})

app.get("/login", (req, res) => {
  res.render("loginPage.ejs");
});
app.post("/login", passport.authenticate("local", {
        // Passport gör en inloggningsstrategi med hjälp av middleware:en & passport.authenticate för att 
        // logga in användaren och peka dem till "/" on success
   successRedirect: "/home"
}))

app.get("/home", (req, res) => {
    if (req.user) {
        // rendera homePage.ejs och skicka med username i bodyn om man är inloggad
        res.render("homePage.ejs", {username: req.user.username})
    } else {
        res.redirect("/login")
        alert("These credentials don't match anything in our database, check inputs.")
    }
})

mongoose.connect("mongodb://localhost/backend1")

app.listen(PORT, () => {
  console.log(`Started Express server on port ${PORT}`);
});
