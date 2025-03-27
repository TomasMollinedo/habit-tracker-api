const pool = require("../config/db");

exports.validarNombre = (nombre) => {

    // Check if the value is a string
    if (typeof nombre !== 'string') {
    return false;
    }

    const nombreLimpio = nombre.trim();

    if (nombreLimpio.length === 0) {
        return false;
    }

    // Check if the value contains numbers or empty spaces
    if (!/^[a-zA-ZáéíóúüÁÉÍÓÚÜ\s]+$/.test(nombreLimpio)) {
        return false; // Rechaza caracteres especiales
    }

    //Verifica que tenga al menos 3 letras permitiendo espacios en el medio

    const letras = nombreLimpio.replace(/[^a-zA-ZáéíóúüÁÉÍÓÚÜ]/g, '');

    // Verificar que tenga al menos 3 letras en total
    if (letras.length < 3) {
        return false;
    }
    return true;
};

//Que hacer con este modulo?
// exports.validarId = (id,res) => {
//     const data = require('./fileHandler').leerDatos();

//     const contadorglobal = data.nextId;

//     if(id<=0){
//         return res.status(400).json({error : "El id del habito es invalido."});
//     } else if(id>=contadorglobal){
//         return res.status(400).json({error : "El hábito nunca existió."});
//     }
//     return false;
// };

exports.validarId = async (id) => {
    //isNaN significa is Not a Nunber.
    if (isNaN(id) || id <= 0) {
        return { valido: false, error: "El ID es inválido." };
    }
    try{
        const [result] = await pool.execute("SELECT * FROM habits WHERE id = ? AND deleted=0", [id]);
        if (result.length === 0) {
            return { valido: false, error: "El hábito no existe." };
        }
        return { valido: true, habit: result[0] };
    } catch (error){
        console.error("Error validando ID: ", error);
        return {valido:false, error: "Error interno del servidor."};
    }
}

exports.nombreExiste = async (nombre) => {
    const [rows] = await pool.query('SELECT id FROM habits WHERE nombre = ? AND deleted = false', [nombre]);
    return rows.length > 0;
};