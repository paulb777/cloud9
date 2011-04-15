/**
 * Phonegap Wizard Module for the Cloud9 IDE
 *
 * @copyright 2011, Mobile Developer Solutions
 * @author Paul Beusterien
 * @license TBD
 */
var Plugin = require("cloud9/plugin");
var sys = require("sys");
var async = require("asyncjs");

var PhonegapWizardPlugin = module.exports = function(ide) {
    this.ide = ide;
    this.hooks = ["command"];
    this.name = "phonegap_wizard";
};

sys.inherits(PhonegapWizardPlugin, Plugin);

(function() {
    
    this.command = function(user, message, client) {
        if (message.command != "phonegap_wizard")
            return false;
        console.log("Copy 1 ", this.ide.options.mountDir);
        async.copyfile(__dirname + "/package.json", this.ide.options.mountDir, function (err) {
            console.log("Error creating PhoneGap project. Template copy failed. " + err);
        });
        console.log("Copy 2 ");        
    };
}).call(PhonegapWizardPlugin.prototype);
