import express from 'express';
import Product from '../models/Product.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all products with filtering, sorting, and pagination
router.get('/', async (req, res) => {
  try {
    console.log('Products route hit with query:', req.query);
    
    const {
      page = 1,
      limit = 12,
      search,
      minPrice,
      maxPrice,
      sortBy = 'createdAt'
    } = req.query;

    // Build query
    const query = { isActive: true };

    // Search filter
    if (search && search.trim() && search !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Price range filter
    if (minPrice && !isNaN(Number(minPrice))) {
      query.price = { ...query.price, $gte: Number(minPrice) };
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
      query.price = { ...query.price, $lte: Number(maxPrice) };
    }

    // Build sort object
    let sort = {};
    if (sortBy === 'price-asc') {
      sort.price = 1;
    } else if (sortBy === 'price-desc') {
      sort.price = -1;
    } else if (sortBy === 'name-asc') {
      sort.name = 1;
    } else if (sortBy === 'name-desc') {
      sort.name = -1;
    } else {
      sort.createdAt = -1; // Default sort
    }

    console.log('Query object:', query);
    console.log('Sort object:', sort);

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    console.log(`Found ${products.length} products out of ${total} total`);

    res.json({
      products,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalProducts: total,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    console.log('Getting product with ID:', req.params.id);
    
    const product = await Product.findOne({ 
      _id: req.params.id, 
      isActive: true 
    }).lean();
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Single product fetch error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Create product (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    console.log('Creating product with data:', req.body);
    
    const { name, description, price, category, stock, image } = req.body;

    // Validation
    if (!name || !description || !price || !category || stock === undefined) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['name', 'description', 'price', 'category', 'stock']
      });
    }

    // Validate data types
    if (isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: 'Price must be a valid positive number' });
    }

    if (isNaN(Number(stock)) || Number(stock) < 0) {
      return res.status(400).json({ message: 'Stock must be a valid non-negative number' });
    }

    const productData = {
      name: String(name).trim(),
      description: String(description).trim(),
      price: Number(price),
      category: String(category).trim(),
      stock: Number(stock),
      image: image ? String(image).trim() : '',
      isActive: true
    };

    console.log('Processed product data:', productData);

    const product = new Product(productData);
    await product.save();

    console.log('Product created successfully:', product._id);

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Product creation error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        message: 'Validation Error',
        errors
      });
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update product (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    console.log('Updating product:', req.params.id, 'with data:', req.body);
    
    const { name, description, price, category, stock, image } = req.body;
    const updateData = {};
    
    if (name !== undefined) updateData.name = String(name).trim();
    if (description !== undefined) updateData.description = String(description).trim();
    if (price !== undefined) {
      if (isNaN(Number(price)) || Number(price) < 0) {
        return res.status(400).json({ message: 'Price must be a valid positive number' });
      }
      updateData.price = Number(price);
    }
    if (category !== undefined) updateData.category = String(category).trim();
    if (stock !== undefined) {
      if (isNaN(Number(stock)) || Number(stock) < 0) {
        return res.status(400).json({ message: 'Stock must be a valid non-negative number' });
      }
      updateData.stock = Number(stock);
    }
    if (image !== undefined) updateData.image = String(image).trim();

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Product updated successfully');

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Product update error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        message: 'Validation Error',
        errors
      });
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Delete product (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    console.log('Deleting product:', req.params.id);
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Product deleted successfully');

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

export default router;