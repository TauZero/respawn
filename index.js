var Child = require('./lib/Child'),
    utils = require('./lib/utils');

var children = {};
var respawnMax = null;
var respawnDelay = 0;
var shutdownInitiated = false;

function forkCommand( command, options ){
    if(shutdownInitiated == true) return;
    options = options || {};
    options.command = command;
    options.respawnMax = (typeof options.respawnMax === 'undefined') ? respawnMax : options.respawnMax
    options.onExit = (function(onExit){
        return function managerChildOnExit( code, signal ){
            utils.debugLog( 0, '[EXIT]',child.id, child.command, 'Code:', code, 'Signal:', signal );
            if(onExit) onExit();

            if( child.bury){
                utils.debugLog( 0, '[Info]',child.id, child.command, 'Stopped' );
                delete children[child.id];
                return;
            }
            if( !shutdownInitiated ){
                if( child.respawnMax !== null && child.respawnCount > child.respawnMax ){
                    utils.debugLog( 0, '[DEAD]',child.id, child.command, 'reached max respawn count.' );
                    return;
                }
                setTimeout(function(){
                    utils.debugLog( 0, '[INFO]',child.id, child.command, 'restarting for the', child.respawnCount+1, 'time')
                    child.respawn();
                },respawnDelay);
            }
        }
    })(options.onExit);
    options.onClose = (function(onClose){
        return function managerChildOnClose(){
            utils.debugLog( 1, '[CLOSE]', child.id, child.command );
            if(onClose) onClose();
        };
    })(options.onClose);
    options.onDisconnect = (function(onDisconnect){
        return function managerChildOnDisconnect(){
            utils.debugLog( 1, '[DISCONNECT]', child.id, child.command );
            if(onDisconnect) onDisconnect();
        };
    })(options.onDisconnect);
    options.onMessage = (function(onMessage){
        return function managerChildOnMessage( msg ){
            utils.debugLog( 2, '[MESSAGE]', child.id, child.command, JSON.stringify(msg) );
            if(onMessage) onMessage(msg);
        };
    })(options.onMessage);

    var child = new Child(options);
    child.fork();
    children[child.id] = child;
    return child.id;
};

function listTracked(){
    var list = {};
    for(var i in children){
        var rawChild = children[i];
        var child = {};
        for(var j in rawChild){
            if( j !== 'process' ) child[j] = rawChild[j];
        }
        list[i] = child;
    }
    console.log( '[INFO] Tracked Processes:', JSON.stringify(list) );
    return list;
}

function killProcess( id, signal ){
    return children[id] && children[id].kill( signal );
};

function buryProcess( id ){
    var child = children[id];
    if(child){
        child.bury = true;
        child.kill();
    }
    else return;
}

function shutdown(){
    shutdownInitiated = true;
    for(var i in children){
        children[i].kill();
    }
    process.exit();
}

function changeRespawnMax( max ){
    if(typeof respawnMax === 'null') respawnMax = 0;
    if(typeof respawnMax === 'number') respawnMax = max;
    return respawnMax;
}

function changeRespawnDelay( delay ){
    if(typeof delay === 'null') respawnDelay = 0;
    if(typeof delay === 'number') respawnDelay = delay;
    return respawnDelay;
}

module.exports = {
    forkCommand: forkCommand,
    listTracked: listTracked,
    killProcess: killProcess,
    buryProcess: buryProcess,
    shutdown: shutdown,
    debugLevel: utils.debugLevel,
    respawnMax: changeRespawnMax,
    respawnDelay: changeRespawnDelay
}
