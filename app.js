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
    destination: (req, file, callback) => {
        callback(null, "./uploads/images/")
    },
    filename: (req, file, callback) => {
        console.log(req.user)
        callback(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname))
    }
})
    // använd storage engine
const upload = multer({ 
    storage: storage,
    limits: {fileSize: 2000000}
}).single("profilePicture")




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

app.get("/users/:username", async (req, res) => {
    const user = await User.findOne({username: req.params.username})
    const posts = await Post.find({user: user._id}).populate("user").sort({postTime: -1})
    res.render("profilePage.ejs", {posts, user})
})

    // om man försöker accessa paths under denhär försäkrar den sig att man är inloggad,
    // annars blir man pekad till login
app.use(ensureLoggedIn("/login"))

    // gör en ny Post instans med nödvändiga parametrar och sparar ner den i databasen under posts
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

app.get("/mypage", async (req, res) => {
    const user = req.user
    const posts = await Post.find({user: user._id}).populate("user").sort({postTime: -1})
    res.render("myPage.ejs", {user, posts})
})

app.post("/mypage", (req, res) => {
    upload(req, res, async (err) => {
        if(err) {
            res.render("myPage.ejs", {
                msg: `Error: ${err}`,
                user: req.user
            })
        } else {
            if(req.file == undefined) {
                res.render("myPage.ejs", {
                    msg: "Error: Please select a file!",
                    user: req.user
                })
            } else {
                const user = await User.findOne({_id: req.user._id})
                user.profilePicture = `/images/${req.file.filename}`
                await user.save()
                res.render("myPage.ejs", {
                    msg: "File uploaded!",
                    user: req.user
                    
                })
            }
            
        }
    })
})


mongoose.connect(MONGO_URL)

app.listen(PORT, () => {
  console.log(`Started Express server on port ${PORT}`);
});
