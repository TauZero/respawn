var fs = require('fs'),
    Child = require('./lib/Child'),
    util = require('util');

var children = {};
var respawnMax = null;
var respawnDelay = 0;
var shutdownInitiated = false;
var debugLevel = 0;

function forkCommand( command, options ){
    if(shutdownInitiated == true) return;
    options = options || {};
    options.command = command;
    options.respawnMax = (typeof options.respawnMax === 'undefined') ? respawnMax : options.respawnMax
    options.onExit = function endlessChildOnExit( code, signal ){
        if( debugLevel > 0 ){
            console.log( '[EXIT]',child.id, child.command, 'Code:', code, 'Signal:', signal );
        }
        if( !shutdownInitiated ){
            if( child.respawnMax !== null && child.respawnCount > child.respawnMax ){
                if( debugLevel >= 0 ){
                    console.log( '[DEAD]',child.id, child.command, 'reached max respawn count.');
                }
                return;
            }
            setTimeout(function(){child.respawn();},respawnDelay);
        }
    };
    if( debugLevel > 0 ){
        options.onClose = function endlessChildOnClose(){
            console.log( '[CLOSE]', child.id, child.command );
        }
    };
    if( debugLevel > 0 ){
        options.onDisconnect = function endlessChildOnDisconnect(){
            console.log( '[DISCONNECT]', child.id, child.command );
        }
    };
    if( debugLevel > 1 ){
        options.onMessage = function endlessChildOnMessage( msg ){
            console.log( '[MESSAGE]', child.id, child.command, JSON.stringify(msg) );
        }
    };
    var child = new Child(options);
    child.fork();
    children[child.id] = child;
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

function shutdown(){
    shutdownInitiated = true;
    for(var i in children){
        children[i].kill();
    }
    process.exit();
}

function changeDebugLevel( level ){
    if(typeof level === 'null') debugLevel = null;
    if(typeof level === 'number') debugLevel = level;
    return debugLevel;
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
    shutdown: shutdown,
    debugLevel: changeDebugLevel,
    respawnMax: changeRespawnMax,
    respawnDelay: changeRespawnDelay
}
