const express = require('express');
//Crear un enrutador para manejar las rutas de forma modular.
const router = express.Router();
//Importar el controlador habitsController que tiene la lógica para manejar las solicitudes HTTP.
//Define funciones como getAllHabits, etc. y cada una se ejecuta cuando se llame a esa ruta.
const habitsController = require('../controllers/habitsController');

// Rutas o endpoints para CRUD de hábitos
//Cada router.METHOD() define una ruta y asocia una función del controlador que manejará la solicitud.
router.get('/', habitsController.getAllHabits);
router.post('/', habitsController.createHabit);
router.put('/:id', habitsController.updateHabit);
router.delete('/:id', habitsController.deleteHabit);
router.patch('/:id/restore', habitsController.restoreHabit);
router.get('/search', habitsController.searchHabit);
router.get('/filter', habitsController.filterHabits);

//Exporta el router para que pueda ser usado en otro archivo index.js o server.js
module.exports = router;