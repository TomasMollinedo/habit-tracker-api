exports.formatDateForMySQL = () => {
    const now = new Date();
    const fecha = now.toISOString().slice(0, 19).replace('T', ' ');
    return fecha;
};