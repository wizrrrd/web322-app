/*********************************************************************************
WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy. 
No part of this assignment has been copied manually or electronically from any other source 
(including 3rd party web sites) or distributed to other students.

Name: Aditi Sharma
Student ID: _145646238 
Date: _10/9/2024
Cyclic Web App URL: _______________________________________________________
GitHub Repository URL: ______________________________________________________
********************************************************************************/
const express = require("express");
const app = express();
const path = require("path");
const storeService = require("./store-service");

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.redirect("/about");
});

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "about.html"));
});

storeService.initialize().then(() => {

    app.get("/shop", (req, res) => {
        storeService.getPublishedItems()
            .then(data => res.json(data))
            .catch(err => res.status(500).json({ message: err }));
    });

    app.get("/items", (req, res) => {
        storeService.getAllItems()
            .then(data => res.json(data))
            .catch(err => res.status(500).json({ message: err }));
    });

    app.get("/categories", (req, res) => {
        storeService.getCategories()
            .then(data => res.json(data))
            .catch(err => res.status(500).json({ message: err }));
    });

    app.use((req, res) => {
        res.status(404).send("Page Not Found");
    });

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`Express http server listening on port ${PORT}`);
    });

}).catch(err => {
    console.error(`Could not open file: ${err}`);
});
