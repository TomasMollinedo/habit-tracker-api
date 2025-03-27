//Importar express
const express = require('express');
const app = express();
const habitsRoutes = require('./routes/habits');
const PORT = 3000;

//Importar conexion a la bd
const connection = require('./config/db');

//Esto es un middleware, una funcion que se ejecuta durante el ciclo de vida de la solicitud HTTP.
//Son funciones que se ejecutan antes del controlador final.
//Los meddlewares se ejecutan en orden.

//Procesa la request antes del siguiente paso, este sirve para interpretar JSON
//Caso contrario req.body no se podría leer y sería undefined
app.use(express.json());

//redirige todas las solicitudes que comiencen con /habits a habitsRoutes
app.use('/habits',habitsRoutes);

//Mapeo del enpoint GET '/'
app.get('/',(req,res)=>{
    res.send('Servidor funcionando!');
});

//Arranca el servidor y hace que escuche en el puerto definido, una vez funcionando el servidor ejecuta el callback y muestra el mensaje
app.listen(PORT, ()=>{
    console.log(`Servidor corriendo en http://localhost:${PORT}`); //Ojo, se usan comillas invertidas ``
});