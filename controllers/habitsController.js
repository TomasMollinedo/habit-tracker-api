//Importar funciones desde otros archivos.
//Se usa destructing para extraer solo las funciones necesarias de cada archivo.
const { validarNombre, nombreExiste, validarId, validarIdAbs} = require('../utils/validations');
const { formatDateForMySQL } = require('../utils/dateUtils');
const pool = require("../config/db"); // Importamos la conexión a la BD

//exports hace que la función esté disponible fuera del archivo para que otros módulos la usen.
//Se agrega la función al objeto module.exports, habitsController.gerAllHabits
//Se exportan funciones flecha para manejar las solicitudes HTTP.
//exports.getAllHabits = (req, res) => { ... } es lo mismo que exports.getAllHabits = function(req, res) { ... };

exports.getAllHabits = async (req,res)=>{
    let {includeDeleted} = req.query;
    //lo convertimos en boolean porque ingresa como String
    includeDeleted = includeDeleted === "true";

    let query = "SELECT * FROM habits";
    if (!includeDeleted) {
        query += " WHERE deleted = 0"; // Filtra solo los que no están eliminados
    }
    query += " ORDER BY createdAt DESC"; // Ordena por fecha de creación

    try {
        const [rows] = await pool.query(query);
        console.log(rows);

        // Verificamos si hay resultados antes de intentar acceder a ellos
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "No hay hábitos registrados." });
        }

        res.json({ total: rows.length, habits: rows });
    } catch (error) {
        console.error("Error al obtener hábitos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};


exports.createHabit = async (req, res) =>{
    const{nombre} = req.body; //Extrae el valor de nombre del cuerpo de la solicitud

    //Validar el nombre
    if (!validarNombre(nombre)){
        return res.status(400).json({error:"El nombre del hábito es obligatorio, debe ser de 3 letras y no contener numeros."});
        /*El return hace que se termine la ejecución de la función, caso contrario se guardaria en el array porque
        sigue ejecutando el código*/
    }
    const nombreYaExiste = await nombreExiste(nombre);
    if (nombreYaExiste) {
        return res.status(409).json({ error: "El hábito con ese nombre ya existe." });
    }
    
    const progreso = "En progreso";
    const ahora = formatDateForMySQL();
    const deleted = false;

    try{
        const [result] = await pool.query(
            `INSERT INTO habits(nombre, progreso, createdAt, updatedAt, deleted)
            VALUES (?,?,?,?,?)`, 
            [nombre,progreso,ahora,ahora,deleted]);
        
        const nuevoHabito = {
            id: result.insertId,
            nombre,
            progreso,
            createdAt: ahora,
            updatedAt: ahora,
            deleted
        };

        res.status(201).json({
            mensaje:"Hábito creado correctamente",
            habit: nuevoHabito
        });
    } catch (error){
        console.error("Error al crear el hábito:", error);
        res.status(500).json({error : "Error al crear el hábito"});
    }

};

exports.updateHabit = async (req,res)=>{
    //Los dos puntos en la ruta indican un parámetro dinámico en 
    const id = parseInt(req.params.id); //Extrae el id del endpoint. No lleva {} porque estamos accediendo directo a la propiedad de req.params
    const{progreso} = req.body;
    const{nombre} = req.body;

    const valid = await validarId(id);
    //console.log(typeof(result));
    console.log(valid.valido);
    if(!valid.valido){
        return res.status(400).json({error: valid.error});
    }

    // Validar nombre si se envía
    if (nombre && !validarNombre(nombre)) {
        return res.status(400).json({ error: "El nombre es inválido." });
    }
    
    //Validar que progreso sea un valor permitido
    const estadosValidos = ["En Progreso", "Completado", "Desactivado"];
    let progresoNormalizado;

    if (progreso && typeof progreso !== "string") {
      return res.status(400).json({ error: "Progreso debe ser un string con valores válidos: 'Completado', 'En progreso' o 'Desactivado'." });
    }

    //Actualiza solo el progreso si nombre está vacío
    if(progreso){
        progresoNormalizado = progreso
        .trim() // Elimina espacios antes y después
        .replace(/\s+/g, ' ') // Reduce múltiples espacios intermedios a uno solo
        .toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase()); // Capitaliza la primera letra de cada palabra


        if (!estadosValidos.includes(progresoNormalizado)) {
            return res.status(400).json({
            error: `Estado invalido, debe ser: ${estadosValidos.join(", ")}`,
            });
        }
    }

    const ahora = formatDateForMySQL();
    // Armar consulta dinámicamente
    const campos = [];
    const valores = [];

    if (nombre) {
        campos.push("nombre = ?");
        valores.push(nombre);
    }

    if (progreso) {
        campos.push("progreso = ?");
        valores.push(progresoNormalizado);
    }

    if (campos.length === 0) {
        return res.status(400).json({ error: "No se enviaron campos para actualizar." });
    }

    campos.push("updatedAt = ?");
    valores.push(ahora);

    valores.push(id);

    //Armar la query.
    const query = `UPDATE habits SET ${campos.join(", ")} WHERE id = ?`;

    //Se manda la query con los valores. Antes escribimos la query y los valores, ahora los pasamos en variables.
    try{
        await pool.query(query,valores);

        //Devolver el habito actualizado
        const [actualizado] = await pool.query('SELECT * FROM habits WHERE id=?',[id]);

        res.status(200).json({
            mensaje: "Hábito actualizado correctamente.",
            habit: actualizado[0]
        });
    } catch (error) {
        console.error("Error al actualizar el hábito:",error);
        res.status(500).json({error: "Error al actualizar el hábito."});
    }
};

exports.deleteHabit = async (req,res)=>{
    const id = parseInt(req.params.id);

    //Validar id
    const valid = await validarId(id);
    if(!valid.valido){
        return res.status(400).json({error: valid.error});
    }

    //Hacer el borrado
    try{
        const ahora = formatDateForMySQL();

        await pool.query(
            "UPDATE habits SET deleted = true, updatedAt = ? WHERE id = ?",
            [ahora, id]);

        //Devolver el habito borrado
        const [borrado] = await pool.query("SELECT * FROM habits WHERE id=?",[id]);

        res.status(200).json({
            mensaje: "Hábito borrado correctamente.",
            habit: borrado[0]
        });
    } catch(error){
        console.error("Error al borrar el hábito:",error);
        res.status(500).json({error: "Error al borrar el hábito."});
    }
    
};

exports.restoreHabit = async (req,res)=>{
    const id = parseInt(req.params.id);

    //Validar id
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({error: "El ID es inválido."});
    }
    try{
        const [result] = await pool.execute("SELECT * FROM habits WHERE id = ?", [id]);
        if (result.length === 0) {
            return res.status(400).json({error: "El hábito no existe."});
        }
        const habit = result[0];
        if(!habit.deleted){
            return res.status(400).json({error: "El hábito nunca fue eliminado."})
        }
    } catch (error){
        console.error("Error validando ID: ", error);
        return res.status(500).json({error: "Error interno del servidor."});
    }

    //Hacer la restauración
    try{
        const ahora = formatDateForMySQL();

        await pool.query(
            "UPDATE habits SET deleted = false, updatedAt = ? WHERE id = ?",
            [ahora, id]);

        //Devolver el habito restaurado
        const [restaurado] = await pool.query("SELECT * FROM habits WHERE id=?",[id]);

        res.status(200).json({
            mensaje: "Hábito restaurado correctamente.",
            habit: restaurado[0]
        });
    } catch(error){
        console.error("Error al restaurar el hábito:",error);
        res.status(500).json({error: "Error al restaurar el hábito."});
    }

};

exports.searchHabit = async (req,res)=>{
    const {nombre} = req.query;
    if (!validarNombre(nombre)) {
        return res.status(400).json({ error: "El nombre de búsqueda es inválido." });
    }
    const nombreNormalizado = nombre.trim().toLowerCase();
    
    try{

        const [resultados] = await pool.query("SELECT * FROM habits WHERE nombre=? AND deleted=0",
            [nombreNormalizado]);

        if(resultados.length == 0){
            //Devolvemos un JSON con los resultados en lugar de un error, el json va a estar vacio
            return res.status(404).json({resultados});
        }
        res.status(200).json({resultados});
    } catch(error){
        console.error("Error al buscar el hábito:",error);
        res.status(500).json({error: "Error al buscar el hábito."});
    }
};

exports.filterHabits = async (req,res)=>{
    const {progreso} = req.query;

    if (typeof progreso !== "string") {
      return res.status(400).json({ error: "Progreso debe ser un string con valores válidos: 'Completado', 'En progreso' o 'Desactivado'." });
    }

    
    const progresoNormalizado = progreso
    .trim() // Elimina espacios antes y después
    .replace(/\s+/g, ' ') // Reduce múltiples espacios intermedios a uno solo
    .toLowerCase();

    const estadosValidos = ["en progreso", "completado", "desactivado"];

    if (!estadosValidos.includes(progresoNormalizado)) {
        return res.status(400).json({ 
            error: `Estado inválido. Debe ser: ${estadosValidos.join(", ")}.` 
        });
    }

    try{
        const [resultados] = await pool.query(
            "SELECT * FROM habits WHERE progreso=? AND deleted=0",
            [progresoNormalizado]);

        if(resultados.length == 0){
            //Devolvemos un JSON con los resultados en lugar de un error, el json va a estar vacio
            return res.status(404).json({resultados});
        }
        res.status(200).json({resultados});
    } catch(error){
        console.error("Error al buscar el hábito:",error);
        res.status(500).json({error: "Error al buscar el hábito."});
    }
};