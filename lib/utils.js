var debugLevel = 0;

module.exports.debugLog = function debugLog(){
    var level = arguments[0];
    if(debugLevel > level){
        var data = [];
        for(var i = 1, len = arguments.length; i < len; i++){
            data.push(arguments[i]);
        }
        console.log.apply(this,data);
    }
}
module.exports.debugLevel = function changeDebugLevel(level){
    if(typeof level === 'null') debugLevel = null;
    if(typeof level === 'number') debugLevel = level;
    return debugLevel;
}
