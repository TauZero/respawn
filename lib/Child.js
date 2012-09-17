var cp_fork = require('child_process').fork;

// Identify this better
var id = 0;

function Child ( options ){
    var self = this;
    self.id = id++;
    self.options = options || {};
    self.command = self.options.command || null;
    self.args = self.options.args || undefined;
    self.process = undefined;
    self.respawnCount = 0;
    self.respawnMax = self.options.respawnMax;
    self.debugLevel = self.options.debugLevel || 0;
    self.onExit = function childOnExit( code, signal){
        self.process = undefined;
        self.pid = undefined;
        if(typeof self.options.onExit === 'function') self.options.onExit( code, signal );
    };
    self.onClose = function childOnClose(){
        if(typeof self.options.onClose === 'function') self.options.onClose();
    };
    self.onDisconnect = function childOnDisconnect(){
        if(typeof self.options.onDisconnect === 'function') self.options.onDisconnect();
    }
    self.onMessage = function childOnMessage( msg ){
        if(typeof self.options.onMessage === 'function') self.options.onMessage( msg );
    }
}

Child.prototype.fork = function fork(){
    var self = this;
    self.process = cp_fork( self.command, self.args, self.options );
    self.pid = self.process.pid;
    self.process.on('exit',self.onExit);
    self.process.on('close',self.onClose);
    self.process.on('disconnect',self.onDisconnect);
    self.process.on('message',self.onMessage);
}

Child.prototype.respawn = function respawn(){
    var self = this;
    self.respawnCount++;
    self.fork();
}

Child.prototype.kill = function kill( signal ){
    var self = this;
    if( self.process ) self.process.kill( signal );
}

module.exports = Child
