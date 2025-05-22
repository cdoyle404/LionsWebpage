// cartModule.js - Custom module for cart and checkout functionality

class CartManager {
    constructor(connection) {
        this.db = connection;
    }

    // Initialize cart if it doesn't exist
    initializeCart(session) {
        if (!session.cart) {
            session.cart = [];
        }
        return session.cart;
    }

    // Add item to cart
    async addToCart(session, productId, quantity = 1) {
        return new Promise((resolve, reject) => {
            this.initializeCart(session);
            
            const query = 'SELECT * FROM productdata WHERE ID = ?';
            
            this.db.query(query, [productId], (err, results) => {
                if (err) {
                    return reject({ success: false, message: 'Database error' });
                }
                
                if (results.length === 0) {
                    return reject({ success: false, message: 'Product not found' });
                }
                
                const product = results[0];
                const qty = parseInt(quantity) || 1;
                
                // Check if item already in cart
                const existingItem = session.cart.find(item => item.id == productId);
                
                if (existingItem) {
                    existingItem.quantity += qty;
                } else {
                    session.cart.push({
                        id: product.ID,
                        name: product.Name,
                        price: product.Price,
                        image: product.Image,
                        quantity: qty
                    });
                }
                
                const cartCount = this.getCartCount(session);
                resolve({ 
                    success: true, 
                    message: 'Item added to cart', 
                    cartCount: cartCount 
                });
            });
        });
    }

    // Remove item from cart
    removeFromCart(session, productId) {
        this.initializeCart(session);
        session.cart = session.cart.filter(item => item.id != productId);
        return { success: true, message: 'Item removed from cart' };
    }

    // Update item quantity in cart
    updateCartItem(session, productId, quantity) {
        this.initializeCart(session);
        const qty = parseInt(quantity);
        
        if (qty <= 0) {
            return this.removeFromCart(session, productId);
        }
        
        const item = session.cart.find(item => item.id == productId);
        if (item) {
            item.quantity = qty;
            return { success: true, message: 'Cart updated' };
        }
        
        return { success: false, message: 'Item not found in cart' };
    }

    // Get cart count (total items)
    getCartCount(session) {
        this.initializeCart(session);
        return session.cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    // Get cart total (price)
    getCartTotal(session) {
        this.initializeCart(session);
        return session.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Get cart items
    getCartItems(session) {
        this.initializeCart(session);
        return session.cart;
    }

    // Clear entire cart
    clearCart(session) {
        session.cart = [];
        return { success: true, message: 'Cart cleared' };
    }

    // Validate checkout data
    validateCheckoutData(data) {
        const required = ['address', 'city', 'state', 'zip', 'phone'];
        const missing = required.filter(field => !data[field] || data[field].trim() === '');
        
        if (missing.length > 0) {
            return {
                isValid: false,
                message: `Missing required fields: ${missing.join(', ')}`
            };
        }
        
        // Basic phone validation
        const phoneDigits = data.phone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            return {
                isValid: false,
                message: 'Please enter a valid phone number'
            };
        }
        
        return { isValid: true };
    }

    // Process order (simulation)
    processOrder(session, user, orderData) {
        const cartItems = this.getCartItems(session);
        
        if (cartItems.length === 0) {
            return {
                success: false,
                message: 'Cart is empty'
            };
        }
        
        // Validate data
        const validation = this.validateCheckoutData(orderData);
        if (!validation.isValid) {
            return {
                success: false,
                message: validation.message
            };
        }
        
        // Calculate order details
        const total = this.getCartTotal(session);
        const orderSummary = cartItems.map(item => `${item.name} x${item.quantity}`).join(', ');
        const shippingAddress = `${orderData.address}, ${orderData.city}, ${orderData.state} ${orderData.zip}`;
        const orderNumber = Math.floor(Math.random() * 100000);
        
        // Log order (in real app, save to database)
        console.log('=== ORDER PROCESSED ===');
        console.log('Order Number:', orderNumber);
        console.log('Customer:', user.name, user.email);
        console.log('Items:', orderSummary);
        console.log('Total: $', total.toFixed(2));
        console.log('Shipping:', shippingAddress);
        console.log('Phone:', orderData.phone);
        if (orderData.notes) console.log('Notes:', orderData.notes);
        console.log('=====================');
        
        // Clear cart after successful order
        this.clearCart(session);
        
        return {
            success: true,
            orderNumber: orderNumber,
            total: total.toFixed(2),
            orderSummary: orderSummary,
            shippingAddress: shippingAddress
        };
    }
}

// Export the module
module.exports = CartManager;