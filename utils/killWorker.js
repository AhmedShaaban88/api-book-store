const cluster = require('cluster');
function killCurrentWorker(){
    cluster.worker.kill();
}

module.exports = killCurrentWorker;