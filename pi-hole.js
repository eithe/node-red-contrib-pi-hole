/**
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 43):
 * <post  eirikh no> partly wrote this file.  As long as you retain this notice you
 * can do whatever you want with my stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return.   Eirik H
 * ----------------------------------------------------------------------------
 * 
 * Based on the exec node from node-red. Copyright JS Foundation and other contributors, http://js.foundation. 
 * The exec node is licensed under the Apache License, Version 2.0.
 * 
 */
module.exports = function(RED) {
    "use strict";
    var exec = require('child_process').exec;
    var isUtf8 = require('is-utf8');

    function PiHoleNode(n) {
        RED.nodes.createNode(this,n);

        this.command = (n.command || "").trim();
        if (n.addpay === undefined) { n.addpay = true; }
        this.addpay = n.addpay;
        this.append = (n.append || "").trim();
        this.timer = Number(n.timer || 0)*1000;
        this.activeProcesses = {};
        this.cmd = "sudo pihole " + (this.command || "");
        var node = this;

        var cleanup = function(p) {
            node.activeProcesses[p].kill();
        }

        node.on('input', function(msg) {
            if (msg.hasOwnProperty("kill")) {
                if (typeof msg.kill !== "string" || msg.kill.length === 0 || !msg.kill.toUpperCase().startsWith("SIG") ) { msg.kill = "SIGTERM"; }
                if (msg.hasOwnProperty("pid")) {
                    if (node.activeProcesses.hasOwnProperty(msg.pid) ) {
                        node.activeProcesses[msg.pid].kill(msg.kill.toUpperCase());
                        node.status({fill:"red",shape:"dot",text:"killed"});
                    }
                }
                else {
                    if (Object.keys(node.activeProcesses).length === 1) {
                        node.activeProcesses[Object.keys(node.activeProcesses)[0]].kill(msg.kill.toUpperCase());
                        node.status({fill:"red",shape:"dot",text:"killed"});
                    }
                }
            }
            else {
                var child;
                var cl = node.cmd;
                if ((node.addpay === true) && msg.hasOwnProperty("payload")) { cl += " "+msg.payload; }
                if (node.append.trim() !== "") { cl += " "+node.append; }
                /* istanbul ignore else  */
                if (RED.settings.verbose) { node.log(cl); }
                child = exec(cl, {encoding:'binary', maxBuffer:10000000}, function (error, stdout, stderr) {
                    var msg2, msg3;
                    delete msg.payload;
                    if (stderr) {
                        msg2 = RED.util.cloneMessage(msg);
                        msg2.payload = stderr;
                    }
                    msg.payload = Buffer.from(stdout,"binary");
                    if (isUtf8(msg.payload)) { msg.payload = msg.payload.toString(); }
                    node.status({});
                    
                    if (error !== null) {
                        msg3 = {payload:{code:error.code, message:error.message}};
                        if (error.signal) { msg3.payload.signal = error.signal; }
                        if (error.code === null) { node.status({fill:"red",shape:"dot",text:"killed"}); }
                        else { node.status({fill:"red",shape:"dot",text:"error:"+error.code}); }
                        node.log('error:' + error);
                    }
                    
                    if (!msg3) { node.status({}); }
                    else {
                        msg.rc = msg3.payload;
                        if (msg2) { msg2.rc = msg3.payload; }
                    }
                    node.send([msg,msg2,msg3]);
                    if (child.tout) { clearTimeout(child.tout); }
                    delete node.activeProcesses[child.pid];
                });
                node.status({fill:"blue",shape:"dot",text:"pid:"+child.pid});
                child.on('error',function() {});
                if (node.timer !== 0) {
                    child.tout = setTimeout(function() { cleanup(child.pid); }, node.timer);
                }
                node.activeProcesses[child.pid] = child;
            }
        });

        node.on('close',function() {
            for (var pid in node.activeProcesses) {
                /* istanbul ignore else  */
                if (node.activeProcesses.hasOwnProperty(pid)) {
                    if (node.activeProcesses[pid].tout) { clearTimeout(node.activeProcesses[pid].tout); }
                    
                    var process = node.activeProcesses[pid];
                    node.activeProcesses[pid] = null;
                    process.kill();
                }
            }
            node.activeProcesses = {};
            node.status({});
        });
    }
    RED.nodes.registerType("pi-hole",PiHoleNode);
}