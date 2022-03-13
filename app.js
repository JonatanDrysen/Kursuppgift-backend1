require("dotenv").config()
const express = require("express")
const session = require("express-session")
const multer = require("multer")
const path = require("path")

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
    // gör uploads till en static folder
app.use(express.static("./uploads"))
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


    // sätt storage engine för hur bilder sak sparas
const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, "./uploads/images/")
    },
    filename: (_req, file, callback) => {
        callback(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname))
    }
})
    // använd storage engine
const upload = multer({ 
    storage: storage,
    limits: {fileSize: 2000000}
}).single("profilePicture")




app.get("/signup", (_req, res) => {
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

app.get("/login", (_req, res) => {
  res.render("loginPage.ejs");
});

    // Passport gör en inloggningsstrategi med hjälp av middleware:en & passport.authenticate för att 
    // logga in användaren och peka dem till "/" on success
app.post("/login", passport.authenticate("local", {
   successRedirect: "/",
   failureRedirect: "/login",
}))

    // kallar logout() funktionen som raderar sessionen när man klickar på en länk med path till "/logout"
app.get("/logout", (req, res) => {
    req.logout()
    res.redirect("/login")
})

    // sparar modellen Post som "joinas" med User m.h.a .populate, sorterar posts nyast först,
    // renderar homePage och skickar med posts för att kunna ladda in posts, username osv
app.get("/", async (req, res) => {
    const posts = await Post.find({}).populate("user").sort({postTime: -1})
    res.render("homePage.ejs", {posts})
})

    // renderar ut profilsidan för andra användare.
    // user hämtas ut genom att hitta 1 användare som matchar med username i URL:et (params)
    // posts hämtas genom att hitta alla posts med korrekt user._id, joinas samman med "user", sorteras
app.get("/users/:username", async (req, res) => {
    const user = await User.findOne({username: req.params.username})
    const posts = await Post.find({user: user._id}).populate("user").sort({postTime: -1})
    res.render("profilePage.ejs", {posts, user})
})

    // om man försöker accessa paths under denhär försäkrar den sig att man är inloggad,
    // annars blir man pekad till login
app.use(ensureLoggedIn("/login"))

    // för att göra ett inlägg hämtas title, content ur request body:n,
    // man gör en "post" av title, content, req.user som innehåller tex username & PFP,
    // för att sedan spara denna nya post till mongo, och peka om användaren till "/" som laddar om alla inlägg igen
app.post("/", async (req, res) => {
    const { title, content } = req.body
    const post = new Post({ 
        title,
        content,
        user: req.user
    })
    await post.save()
    res.redirect("/")
})

    // Tar in user & posts för att kunna rendera ut inloggade användarens inlägg,
    // renderar ut mypage och skickar med "user" & "posts" till ejs templaten
app.get("/mypage", async (req, res) => {
    const user = req.user
    const posts = await Post.find({user: user._id}).populate("user").sort({postTime: -1})
    res.render("myPage.ejs", {user, posts})
})

    // använder "upload" metoden för att ladda upp profilbild, namn, email genom att 
    // först hantera ev fel, sedan skapa en "user" instans som innehåller inloggade användarens _id.
    // Sedan skickar in eventuell profilbild, namn & email för att sen spara användaren med uppdaterad info,
    // peka användaren till "/mypage" som sedan laddar om sidan med uppdaterad info.
app.post("/mypage", (req, res) => {
    upload(req, res, async (err) => {
        if(err) {
            res.render("myPage.ejs", {
                msg: `Error: ${err}`,
                user: req.user
            })
        } else {
            const user = await User.findOne({_id: req.user._id})
            if(req.file) {
                user.profilePicture = `/images/${req.file.filename}`
            }
            user.fullName = req.body.fullName
            user.email = req.body.email
            await user.save()
            res.redirect("/mypage")
        }
    })
})

    // initierar koppling till databas
mongoose.connect(MONGO_URL)

    // lyssnar efter koppling till databas
app.listen(PORT, () => {
  console.log(`Started Express server on port ${PORT}`);
});
