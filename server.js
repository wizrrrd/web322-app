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
const cloudinary = require('cloudinary').v2; // Cloudinary configuration
const streamifier = require('streamifier');
const expressLayouts = require('express-ejs-layouts');

app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Make sure views path is set correctly

//layout path explicitly to "layouts/main.ejs"
app.set('layout', 'layouts/main'); 

app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));


app.get("/", (req, res) => {
    res.redirect("/about");
});

app.get("/about", (req, res) => {
    res.render("about", { title: "About Us" });
});

storeService.initialize().then(() => {
    app.get("/shop", (req, res) => {
        storeService.getPublishedItems()
            .then(data => res.render("shop", { items: data, title: "Shop" }))
            .catch(err => res.status(500).render("error", { message: err, title: "Error" }));
    });

    app.get("/items", (req, res) => {
        storeService.getAllItems()
            .then(data => res.render("items", { items: data, title: "Items" }))
            .catch(err => res.status(500).render("error", { message: err, title: "Error" }));
    });

    app.get("/categories", (req, res) => {
        storeService.getCategories()
            .then(data => res.render("categories", { categories: data, title: "Categories" }))
            .catch(err => res.status(500).render("error", { message: err, title: "Error" }));
    });

    app.get("/items/add", (req, res) => {
        res.render("addItems", { title: "Add Item" });
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
            }).catch((err) => {
                console.error(err);
                res.status(500).send("Error uploading image");
            });
        } else {
            processItem("");
        }

        function processItem(imageUrl) {
            req.body.featureImage = imageUrl;
            storeService.addItem(req.body).then(() => {
                res.redirect("/items");
            }).catch((err) => {
                console.error(err);
                res.status(500).send("Error adding item");
            });
        }
    });

    // Handling  errors
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
