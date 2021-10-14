const updateVersionKey = (updated)=>{
    if (updated.__v) {
        delete updated.__v;
    }
    const keys = ['$set', '$setOnInsert'];
    for (const key of keys) {
        if (updated[key] && updated[key].__v) {
            delete updated[key].__v;
            if (Object.keys(updated[key]).length === 0) {
                delete updated[key];
            }
        }
    }
    updated.$inc = updated.$inc || {};
    updated.$inc.__v = 1;
}

module.exports = updateVersionKey;