const express = require('express');
const { getDiamondsByShape, filterDiamondsByShape, clearDiamondCache } = require('../controllers/diamondController');

const router = express.Router();

router.get('/diamonds/:shape', getDiamondsByShape);
router.post('/diamonds/:shape', filterDiamondsByShape);
router.post('/cache/clear', clearDiamondCache);

module.exports = router;
