const fs = require('fs');
const path = require('path');
let items = [];
let categories = [];

function initialize() {
    return new Promise((resolve, reject) => {
        const itemsFilePath = path.join(__dirname, "data", "items.json");
        const categoriesFilePath = path.join(__dirname, "data", "categories.json");

        fs.readFile(itemsFilePath, 'utf8', (err, data) => {
            if (err) {
                return reject("unable to read file: items.json");
            }
            try {
                items = JSON.parse(data);
            } catch (parseErr) {
                return reject("error parsing items.json");
            }

            fs.readFile(categoriesFilePath, 'utf8', (err, data) => {
                if (err) {
                    return reject("unable to read file: categories.json");
                }
                try {
                    categories = JSON.parse(data);
                } catch (parseErr) {
                    return reject("error parsing categories.json");
                }

                resolve("Data initialized successfully");
            });
        });
    });
}

function getAllItems() {
    return new Promise((resolve, reject) => {
        if (items.length === 0) {
            return reject("no results returned");
        }
        resolve(items);
    });
}

function addItem(itemData) {
    return new Promise((resolve, reject) => {
        if (!itemData) {
            reject("Item data is required");
        } else {
            itemData.published = itemData.published ? true : false;
            itemData.id = items.length + 1;
            const date = new Date();
            itemData.postDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            items.push(itemData);
            resolve(itemData);
        }
    });
}

// Get items by category
/*function getItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item => item.category === parseInt(category));
        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("no results ");
        }
    });
} */
function getItemsByCategory(category, items) {
    return new Promise((resolve, reject) => {
        const categoryInt = parseInt(category);

        if (isNaN(categoryInt)) {
            reject(new Error("Category invalid"));
            return;
        }

        const filteredItems = items.filter(item => item.category === categoryInt);

        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject(new Error("No results"));
        }
    });
}


function getItemsByMinDate(minDateStr) {
    return new Promise((resolve, reject) => {
        const minDate = new Date(minDateStr);
        const filteredItems = items.filter(item => new Date(item.postDate) >= minDate);
        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("no results returned");
        }
    });
}

function getItemById(id) {
    return new Promise((resolve, reject) => {
        const item = items.find(item => item.id === parseInt(id));
        if (item) {
            resolve(item);
        } else {
            reject("no result returned");
        }
    });
}

function getPublishedItems() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published === true);
        if (publishedItems.length === 0) {
            return reject("no results returned");
        }
        resolve(publishedItems);
    });
}

function getCategories() {
    return new Promise((resolve, reject) => {
        if (categories.length === 0) {
            return reject("no results returned");
        }
        resolve(categories);
    });
}

function getPublishedItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item =>
            item.published === true && item.category === parseInt(category)
        );

        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("no results returned");
        }
    });
}

module.exports = {
    initialize,
    getAllItems,
    getPublishedItems,
    getCategories,
    getItemsByCategory,
    getItemsByMinDate,
    getItemById,
    addItem,
    getPublishedItemsByCategory
};
