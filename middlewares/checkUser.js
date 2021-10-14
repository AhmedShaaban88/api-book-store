const catchError = require("http-errors");
const {ObjectId} = require('mongoose').Types;
const checkRole = (userRole) => {
    return function checkUserRole(req, res, next) {
        const {role} = req.user;
        if(!role || !userRole || role.trim().toLowerCase() !== userRole.trim().toLowerCase()) return next(catchError.Forbidden('Authenticated user but not allowed to perform action'))
        next()
    }
}
const checkIdParam = (idKey) => {
    return function checkId(req, res, next) {
        const {id} = req.params;
        if(!id) return next(catchError.BadRequest(`${idKey} is required`));
        if(!ObjectId.isValid(id) || (String)(new ObjectId(id)) !== id){
            return next(catchError.BadRequest(`${idKey} has invalid format`));
        }
        next()
    }
}

module.exports = {checkRole, checkIdParam};