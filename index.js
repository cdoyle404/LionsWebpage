const express = require('express');
const path = require('path');
const mysql = require('mysql');
const session = require('express-session');
const app = express();

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1 hour
}));

// Serve static files from public directory
app.use(express.static('public'));

// Database connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'testdb'
});

// Connect to database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to the database');
    }
});

// Routes

// Home page route
app.get('/', (req, res) => {
    // Check if user is logged in
    if (req.session.user) {
        // Serve homepage if logged in
        res.sendFile(path.join(__dirname, 'public', 'homepage.html'));
    } else {
        // Redirect to login if not logged in
        res.redirect('/login');
    }
});

// Login page route (GET - show the login form)
app.get('/login', (req, res) => {
    // If already logged in, redirect to home
    if (req.session.user) {
        return res.redirect('/');
    }
    
    // Serve login page
    res.sendFile(path.join(__dirname, 'public', 'LoginP.html'));
});

// Login form submission (POST - process login)
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('Login attempt:', email);
    
    // Validate input
    if (!email || !password) {
        return res.send(`
            <script>
                alert('Please enter both email and password');
                window.location.href = '/login';
            </script>
        `);
    }
    
    // Check user in database
    const query = 'SELECT * FROM user WHERE email = ? AND password = ?';
    
    connection.query(query, [email, password], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.send(`
                <script>
                    alert('Database error occurred');
                    window.location.href = '/login';
                </script>
            `);
        }
        
        if (results.length > 0) {
            // Login successful
            const user = results[0];
            
            // Store user in session
            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email
            };
            
            console.log('Login successful for:', user.email);
            
            // Redirect to homepage
            res.send(`
                <script>
                    alert('Login successful! Welcome ${user.name}');
                    window.location.href = '/';
                </script>
            `);
        } else {
            // Login failed
            console.log('Invalid credentials for:', email);
            res.send(`
                <script>
                    alert('Invalid email or password');
                    window.location.href = '/login';
                </script>
            `);
        }
    });
});
// Squad signup page route
app.get('/squad-signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'SquadSignup.html'));
});
// Products listing page route - USING EJS
app.get('/products', (req, res) => {
    const typeFilter = req.query.type;
    const genderFilter = req.query.gender;
    
    // Build dynamic query based on filters
    let query = 'SELECT * FROM productdata WHERE 1=1';
    let queryParams = [];
    
    if (typeFilter && typeFilter !== 'all') {
        query += ' AND Type = ?';
        queryParams.push(typeFilter);
    }
    
    if (genderFilter && genderFilter !== 'all') {
        query += ' AND Gender = ?';
        queryParams.push(genderFilter);
    }
    
    query += ' ORDER BY ID';
    
    console.log('Query:', query);
    console.log('Params:', queryParams);
    
    connection.query(query, queryParams, (err, products) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).send('Error fetching products');
        }
        
        // Get unique types and genders for filter dropdowns
        const typesQuery = 'SELECT DISTINCT Type FROM productdata WHERE Type IS NOT NULL ORDER BY Type';
        const gendersQuery = 'SELECT DISTINCT Gender FROM productdata WHERE Gender IS NOT NULL ORDER BY Gender';
        
        connection.query(typesQuery, (err, types) => {
            if (err) {
                console.error('Error fetching types:', err);
                types = [];
            }
            
            connection.query(gendersQuery, (err, genders) => {
                if (err) {
                    console.error('Error fetching genders:', err);
                    genders = [];
                }
                
                res.render('products', {
                    products: products,
                    types: types,
                    genders: genders,
                    selectedType: typeFilter || 'all',
                    selectedGender: genderFilter || 'all'
                });
            });
        });
    });
});

// Single product detail page - FIXED VERSION
app.get('/product/:id', (req, res) => {
    const productId = req.params.id;
    
    console.log('Viewing product ID:', productId);
    
    // Get the specific product from database
    const query = 'SELECT * FROM productdata WHERE ID = ?';
    
    connection.query(query, [productId], (err, results) => {
        if (err) {
            console.error('Error fetching product:', err);
            return res.status(500).send('Error fetching product details');
        }
        
        if (results.length === 0) {
            return res.status(404).send('Product not found');
        }
        
        const product = results[0];
        
        // Get related products (same type or gender)
        const relatedQuery = `
            SELECT * FROM productdata 
            WHERE (Type = ? OR Gender = ?) 
            AND ID != ? 
            LIMIT 3
        `;
        
        connection.query(relatedQuery, [product.Type, product.Gender, productId], (err, relatedProducts) => {
            if (err) {
                console.error('Error fetching related products:', err);
                relatedProducts = [];
            }
            
            // Render the EJS template with product data
            res.render('product-detail', {
                product: product,
                relatedProducts: relatedProducts
            });
        });
    });
});
// Squad signup form submission
app.post('/squad-signup', (req, res) => {
    const { name, email, phone } = req.body;
    
    console.log('Squad signup attempt:', { name, email, phone });
    
    // Validate input
    if (!name || !email || !phone) {
        return res.send(`
            <script>
                alert('All fields are required');
                window.history.back();
            </script>
        `);
    }
    
    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Insert new user with phone as ID
    const insertQuery = 'INSERT INTO user (id, name, email, phone) VALUES (?, ?, ?, ?)';
    
    connection.query(insertQuery, [cleanPhone, name, email, cleanPhone], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.send(`
                <script>
                    alert('Signup failed. Please try again.');
                    window.history.back();
                </script>
            `);
        }
        
        console.log('Squad signup successful:', { name, email, phone: cleanPhone });
        
        // Simple success alert
        res.send(`
            <script>
                alert('You have signed up! Welcome to the squad, ${name}!');
                window.history.back();
            </script>
        `);
    });
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destroy error:', err);
        }
        res.redirect('/login');
    });
});

// Protected homepage route
app.get('/home', (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
        return res.redirect('/login');
    }
    
    res.sendFile(path.join(__dirname, 'public', 'homepage.html'));
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access your login at: http://localhost:${PORT}/login`);
    console.log(`Access your products at: http://localhost:${PORT}/products`);
    console.log(`Do NOT access files directly - use the routes above`);
});