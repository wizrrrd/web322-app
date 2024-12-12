/*********************************************************************************
WEB322 – Assignment 06
I declare that this assignment is my own work in accordance with Seneca Academic Policy. 
No part of this assignment has been copied manually or electronically from any other source 
(including 3rd party web sites) or distributed to other students.

Name: Aditi Sharma
Student ID: 145646238 
Date: 10/12/2024
********************************************************************************/

const express = require("express");
const app = express();
const path = require("path");
const storeService = require("./store-service");
const authData = require("./auth-service");
const clientSessions = require("client-sessions");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const expressLayouts = require("express-ejs-layouts");

app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layouts/main");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

cloudinary.config({ 
    cloud_name: "dvrbaywbn", 
    api_key: "297357371274699", 
    api_secret: "FiDXkNnH8z_c5boFj86-iPRKsBM",
    secure: true
 });

app.use(clientSessions({
    cookieName: "session",
    secret: "random_secret_key",
    duration: 2 * 60 * 60 * 1000,
    activeDuration: 1000 * 60 * 5
}));

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

app.get("/shop", async (req, res) => {
    let viewData = {};
    try {
        let items = [];
        if (req.query.category) {
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            items = await storeService.getPublishedItems();
        }
        items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
        viewData.items = items;
        viewData.item = items[0];
    } catch (err) {
        viewData.message = "no results";
    }
    try {
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }
    res.render("shop", { data: viewData });
});

app.get("/shop/:id", async (req, res) => {
    let viewData = {};
    try {
        let items = [];
        if (req.query.category) {
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            items = await storeService.getPublishedItems();
        }
        items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
        viewData.items = items;
    } catch (err) {
        viewData.message = "no results";
    }
    try {
        viewData.item = await storeService.getItemById(req.params.id);
    } catch (err) {
        viewData.message = "no results";
    }
    try {
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }
    res.render("shop", { data: viewData });
});


app.get("/", (req, res) => {
    res.redirect("/about");
});

app.get("/about", (req, res) => {
    res.render("about", { title: "About Us" });
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get("User-Agent");
    authData.checkUser(req.body)
        .then(user => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };
            res.redirect("/items");
        })
        .catch(err => {
            res.render("login", { errorMessage: err, userName: req.body.userName });
        });
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    authData.registerUser(req.body)
        .then(() => {
            res.render("register", { successMessage: "User created" });
        })
        .catch(err => {
            res.render("register", { errorMessage: err, userName: req.body.userName });
        });
});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory", { user: req.session.user });
});

const upload = multer();

app.get("/items", ensureLogin, (req, res) => {
    if (req.query.category) {
        storeService.getItemsByCategory(req.query.category)
            .then(items => {
                res.render("items", {
                    items,
                    message: items.length > 0 ? "" : "No items found in this category."
                });
            })
            .catch(() => {
                res.render("items", {
                    items: [],
                    message: "No items found in this category."
                });
            });
    } else {
        storeService.getAllItems()
            .then(items => {
                res.render("items", {
                    items,
                    message: items.length > 0 ? "" : "No items available."
                });
            })
            .catch(() => {
                res.render("items", {
                    items: [],
                    message: "No items available."
                });
            });
    }
});


app.get("/items/add", ensureLogin, (req, res) => {
    storeService.getCategories()
        .then(categories => {
            res.render("addItems", { categories });
        })
        .catch(() => {
            res.render("addItems", { categories: [] });
        });
});

app.post("/items/add", ensureLogin, upload.single("featureImage"), (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function uploadImage(req) {
            let result = await streamUpload(req);
            return result;
        }

        uploadImage(req).then(uploaded => {
            processItem(uploaded.url);
        }).catch(() => {
            res.status(500).send("Error uploading image");
        });
    } else {
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;
        storeService.addItem(req.body).then(() => {
            res.redirect("/items");
        }).catch(() => {
            res.status(500).send("Error adding item");
        });
    }
});

app.get("/items/delete/:id", ensureLogin, (req, res) => {
    storeService.deleteItemById(req.params.id)
        .then(() => {
            res.redirect("/items");
        })
        .catch(() => {
            res.status(500).send("Unable to Remove Item / Item not found");
        });
});

app.get("/categories", ensureLogin, (req, res) => {
    storeService.getCategories()
        .then(categories => {
            console.log("Categories data:", categories); 
            res.render("categories", {
                categories,
                message: categories.length > 0 ? "" : "No categories available."
            });
        })
        .catch(err => {
            console.error("Error fetching categories:", err);
            res.render("categories", {
                categories: [],
                message: "Unable to fetch categories."
            });
        });
});




app.get("/categories/add", ensureLogin, (req, res) => {
    res.render("addCategory");
});

app.post("/categories/add", ensureLogin, (req, res) => {
    storeService.addCategory(req.body)
        .then(() => {
            res.redirect("/categories");
        })
        .catch(() => {
            res.status(500).send("Unable to Add Category");
        });
});

app.get("/categories/delete/:id", ensureLogin, (req, res) => {
    storeService.deleteCategoryById(req.params.id)
        .then(() => {
            res.redirect("/categories");
        })
        .catch(() => {
            res.status(500).send("Unable to Remove Category / Category not found");
        });
});

app.use((req, res) => {
    res.status(404).render("404", { title: "Page Not Found" });
});

const PORT = process.env.PORT || 8080;

storeService.initialize()
    .then(authData.initialize)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("Unable to start server: " + err);
    });
