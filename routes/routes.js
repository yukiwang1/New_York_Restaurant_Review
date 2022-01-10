const express = require('express');
const app = express();
const controller = require('../controllers/controller.js');
router = express.Router();

router.get('/', controller.restaurants);
router.get('/restaurants', controller.restaurants);
router.get('/restaurants/:id', controller.restaurant);
router.get('/infractions', controller.infractions);
router.get('/infractions/:id', controller.infraction);
router.get('/zips', controller.zips);
router.get('/zips/:id', controller.zip);



module.exports = router;
