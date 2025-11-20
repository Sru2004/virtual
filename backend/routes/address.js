const express = require('express');
const { body, validationResult } = require('express-validator');
const Address = require('../models/Address');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all addresses for the authenticated user
router.get('/get', auth, async (req, res) => {
  try {
    const addresses = await Address.find({ user_id: req.user._id });
    res.json({ success: true, addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch addresses' });
  }
});

// Add a new address
router.post('/add', auth, [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('street').notEmpty().withMessage('Street is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('country').notEmpty().withMessage('Country is required'),
  body('zipCode').notEmpty().withMessage('Zip code is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { firstName, lastName, email, phone, street, city, state, country, zipCode } = req.body;

    const newAddress = new Address({
      user_id: req.user._id,
      firstName,
      lastName,
      email,
      phone,
      street,
      city,
      state,
      country,
      zipCode
    });

    await newAddress.save();
    res.json({ success: true, message: 'Address added successfully', address: newAddress });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ success: false, message: 'Failed to add address' });
  }
});

// Update an address
router.put('/update/:id', auth, [
  body('street').notEmpty().withMessage('Street is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('country').notEmpty().withMessage('Country is required'),
  body('zipCode').notEmpty().withMessage('Zip code is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { street, city, state, country, zipCode } = req.body;

    const updatedAddress = await Address.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { street, city, state, country, zipCode },
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    res.json({ success: true, message: 'Address updated successfully', address: updatedAddress });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ success: false, message: 'Failed to update address' });
  }
});

// Delete an address
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    const deletedAddress = await Address.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id
    });

    if (!deletedAddress) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    res.json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ success: false, message: 'Failed to delete address' });
  }
});

module.exports = router;
