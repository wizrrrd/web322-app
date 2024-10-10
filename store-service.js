const fs = require('fs');
const path = require('path');

let items = [];    
let categories = []; 

module.exports.initialize = function() {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, 'data', 'items.json'), 'utf8', (err, data) => {
            if (err) {
                return reject('Unable to read items.json'); 
            }
            items = JSON.parse(data); 

            fs.readFile(path.join(__dirname, 'data', 'categories.json'), 'utf8', (err, data) => {
                if (err) {
                    return reject('Unable to read categories.json');
                }
                categories = JSON.parse(data); 

                resolve();
            });
        });
    });
};

module.exports.getAllItems = function() {
    return new Promise((resolve, reject) => {
        if (items.length === 0) {
            return reject('No results returned'); 
        }
        resolve(items);
    });
};

module.exports.getPublishedItems = function() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published === true); 
        if (publishedItems.length === 0) {
            return reject('No results returned');
        }
        resolve(publishedItems);
    });
};

module.exports.getCategories = function() {
    return new Promise((resolve, reject) => {
        if (categories.length === 0) {
            return reject('No results returned'); 
        }
        resolve(categories); 
    });
};