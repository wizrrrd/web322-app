/*********************************************************************************
WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy. 
No part of this assignment has been copied manually or electronically from any other source 
(including 3rd party web sites) or distributed to other students.

Name: Aditi Sharma
Student ID: 145646238 
Date: 10/9/2024
Cyclic Web App URL: https://c3a57207-d650-437d-ae7a-965177e80714-00-27w00ndpwepea.kirk.replit.dev/about 
GitHub Repository URL: https://github.com/wizrrrd/web322-app.git
********************************************************************************/

const express = require("express");
const app = express();
const path = require("path");
const storeService = require("./store-service");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const expressLayouts = require('express-ejs-layouts');

app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

cloudinary.config({ 
    cloud_name: 'dvrbaywbn', 
    api_key: '297357371274699', 
    api_secret: 'FiDXkNnH8z_c5boFj86-iPRKsBM',
    secure: true
 });

app.use(function (req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

app.get("/", (req, res) => {
    res.redirect("/about");
});

app.get("/about", (req, res) => {
    res.render("about", { title: "About Us" });
});

storeService.initialize().then(() => {
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

    app.get("/items", (req, res) => {
        if (req.query.category) {
            storeService.getItemsByCategory(req.query.category)
                .then(items => {
                    if (items.length > 0) {
                        res.render('items', { items: items });
                    } else {
                        res.render('items', { message: "no results" });
                    }
                })
                .catch(() => {
                    res.render('items', { message: "no results" });
                });
        } else {
            storeService.getAllItems()
                .then(items => {
                    if (items.length > 0) {
                        res.render('items', { items: items });
                    } else {
                        res.render('items', { message: "no results" });
                    }
                })
                .catch(() => {
                    res.render('items', { message: "no results" });
                });
        }
    });

    app.get("/items/add", (req, res) => {
        storeService.getCategories()
            .then(categories => {
                res.render("addItems", { categories: categories });
            })
            .catch(() => {
                res.render("addItems", { categories: [] });
            });
    });

    const upload = multer();
    app.post("/items/add", upload.single("featureImage"), (req, res) => {
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

            uploadImage(req).then((uploaded) => {
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

    app.get("/items/delete/:id", (req, res) => {
        storeService.deleteItemById(req.params.id)
            .then(() => {
                res.redirect("/items");
            })
            .catch(() => {
                res.status(500).send("Unable to Remove Item / Item not found");
            });
    });

    app.get("/categories", (req, res) => {
        storeService.getCategories()
            .then(categories => {
                if (categories.length > 0) {
                    res.render('categories', { categories: categories });
                } else {
                    res.render('categories', { message: "no results" });
                }
            })
            .catch(() => {
                res.render('categories', { message: "no results" });
            });
    });

    app.get("/categories/add", (req, res) => {
        res.render('addCategory');
    });

    app.post("/categories/add", (req, res) => {
        storeService.addCategory(req.body)
            .then(() => {
                res.redirect('/categories');
            })
            .catch(() => {
                res.status(500).send("Unable to Add Category");
            });
    });

    app.get("/categories/delete/:id", (req, res) => {
        storeService.deleteCategoryById(req.params.id)
            .then(() => {
                res.redirect('/categories');
            })
            .catch(() => {
                res.status(500).send("Unable to Remove Category / Category not found");
            });
    });

    app.use((req, res) => {
        res.status(404).render("404", { title: "Page Not Found" });
    });

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`Express http server listening on port ${PORT}`);
    });

}).catch(err => {
    console.error(`Could not open file: ${err}`);
});
