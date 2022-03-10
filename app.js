require("dotenv").config()
const express = require("express")
const session = require("express-session")
const passport = require("passport")
const mongoose = require("mongoose")
const MongoStore = require("connect-mongo")

const { Post } = require("./models/post")
const { User } = require("./models/user")

const { ensureLoggedIn } = require("connect-ensure-login")

const app = express()
const PORT = 3000
    // definierar känsliga .environment variabler från lokal .env fil 
const MONGO_URL = process.env.MONGO_URL
const SESSION_SECRET = process.env.SESSION_SECRET

    //parsar inkommande requests från servern, tillåter användning av POST requests
app.use(express.urlencoded({extended: true}))
    // skapar en säker autentiseringsstrategi för inloggning automatiskt m.hjälp av passport
passport.use(User.createStrategy())
    // sparar användar-Id som en cookie i webbläsaren
passport.serializeUser(User.serializeUser())
    // hämtar/laddar användar-Id från cookien som sen används för att hämta användarinfo etc
passport.deserializeUser(User.deserializeUser())
    // session middleware använder en "secret" för att på samma sätt som salt kryptera en sessionsnyckel
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URL })
}))
    // passport.authenticate laddar användaren från sessionen, ger tillgången till ett användarobjekt
app.use(passport.authenticate("session"))




app.get("/signup", (req, res) => {
    res.render("signupPage.ejs");
});

app.post("/signup", async (req, res) => {
        // bryter ur username & password från request bodyn
    const {username, password} = req.body
        // definiera en ny användare utan lösenord då det ska krypteras & saltas
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
   successRedirect: "/",
   failureRedirect: "/login",
}))

app.get("/logout", (req, res) => {
    req.logout()
    res.redirect("/login")
})

app.get("/", async (req, res) => {
    const posts = await Post.find({}).populate("user").sort({postTime: -1})
    res.render("homePage.ejs", {posts})
})

app.use(ensureLoggedIn("/login"))

app.post("/", async (req, res) => {
    const { title, content } = req.body
    const post = new Post({ 
        title,
        content,
        user: req.user
    })
    await post.save()
    res.redirect("/")
    console.log(req.body)
})

mongoose.connect(MONGO_URL)

app.listen(PORT, () => {
  console.log(`Started Express server on port ${PORT}`);
});