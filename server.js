/*********************************************************************************
WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy. 
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Aditi Sharma
Student ID: ______________ 
Date: ________________
Cyclic Web App URL: _______________________________________________________
GitHub Repository URL: ______________________________________________________
********************************************************************************/
const express = require('express');
const path = require('path');
const storeService = require('./store-service');

const app = express();


app.use(express.static('public'));


app.get('/', (req, res) => {
    res.redirect('/about');
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

storeService.initialize()
    .then(() => {
        app.get('/shop', (req, res) => {
            storeService.getPublishedItems()
                .then(data => res.json(data)) 
                .catch(err => res.status(500).json({ message: err }));
        });

        app.get('/items', (req, res) => {
            storeService.getAllItems()
                .then(data => res.json(data))  
                .catch(err => res.status(500).json({ message: err }));
        });


        app.get('/categories', (req, res) => {
            storeService.getCategories()
                .then(data => res.json(data))  
                .catch(err => res.status(500).json({ message: err }));
        });


        app.get('/item/:id', (req, res) => {
            const id = parseInt(req.params.id);
            const item = items.find(i => i.id === id);
            if (!item) {
                return res.status(404).json({ message: 'Item not found.' });
            }
            res.json(item); 
        });


        app.delete('/delete-item/:id', (req, res) => {
            const id = parseInt(req.params.id);
            const index = items.findIndex(item => item.id === id);
            if (index === -1) {
                return res.status(404).json({ message: 'Item not found.' });
            }


            items.splice(index, 1);

            fs.writeFile(path.join(__dirname, 'data', 'items.json'), JSON.stringify(items, null, 2), (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Error deleting item.' });
                }
                res.json({ message: 'Item deleted successfully.' });
            });
        });

        app.get('*', (req, res) => {
            res.status(404).sendFile(path.join(__dirname, 'views', 'erroriffound.html'));
        });

        const PORT = process.env.PORT || 8080;
        app.listen(PORT, () => {
            console.log(`Express http server listening on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error(`Error initializing data: ${err}`); 
    });