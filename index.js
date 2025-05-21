const express = require('express');
const app = express();

//Connect to Database
const mysql = require('mysql');
//Create connection to MYSQL DB
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'testdb'
});
//Connect to the database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database: ', err);
        
    }else {
        console.log('Connected to the database');
    }
});
//Server static files from the public directory
app.use(express.static('home'));

app.get('/login', function(req, res) {

const ID = req.query.rec;
    connection.query('SELECT * FROM productdata WHERE ID = ?', [ID], function(err , rows, fields) {
        if (err) {
            console.error('Error executing query: ', err);
            res.status(500).send('Error executing query');
        } else if (rows.length === 0) {
            console.log('No data found');
            res.status(404).send('No data found for ID ${ID}');
        } else {
            console.log('Query result: ', rows);
            console.log(rows[0].Name);
            console.log(rows[0].Price);
            console.log(rows[0].Gender);
            console.log(rows[0].Image);
            

            const PName = rows[0].Name;
            const PPrice = rows[0].Price;
            const PGender = rows[0].Gender;
            const PImage = rows[0].Image;

            res.render('test.ejs', {myMessage: PName, price: PPrice})
        }
    })
});
        // Inject the data into the HTML
app.post('/URL', function(req, res) {

const ID = req.body.rec2;
    connection.query('SELECT * FROM productdata WHERE ID = ?', [ID], function(err , rows, fields) {
        if (err) {
            console.error('Error executing query: ', err);
            res.status(500).send('Error executing query');
        } else if (rows.length === 0) {
            console.log('No data found');
            res.status(404).send('No data found for ID ${ID}');
        } else {
            console.log('Query result: ', rows);
            console.log(rows[0].Name);
            console.log(rows[0].Price);
            console.log(rows[0].Gender);
            console.log(rows[0].Image);
            

            const PName = rows[0].Name;
            const PPrice = rows[0].Price;
            const PGender = rows[0].Gender;
            const PImage = rows[0].Image;

            res.render('test.ejs', {myMessage: PName, price: PPrice})
        }


    })

});

//start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
}
);
