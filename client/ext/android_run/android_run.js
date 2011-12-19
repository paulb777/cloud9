/**
 * Android Runner Module for the Cloud9 IDE
 *
 * @copyright 2011, Mobile Developer Solutions
 * @author Paul Beusterien
 * @license TBD
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var Buildrun = require("ext/android_run/buildrun");
var settings = require("ext/settings/settings");
var save = require("ext/save/save");
var markup = require("text!ext/android_run/android_run.xml");
var buildrun = new Buildrun();

module.exports = ext.register("ext/android_run/android_run", {
    name    : "Android Run Toolbar",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    offline : false,
    markup  : markup,
 /*   commands : {
        "resume"   : {hint: "resume the current paused process"},
        "stepinto" : {hint: "step into the function that is next on the execution stack"},
        "stepover" : {hint: "step over the current expression on the execution stack"},
        "stepout"  : {hint: "step out of the current function scope"}
    },*/
    hotitems: {},

    nodes : [],

    init : function(amlNode){
        while(tbAndroidRun.childNodes.length) {
            var button = tbAndroidRun.firstChild;
            ide.barTools.appendChild(button);
            
            if (button.nodeType == 1)
                this.nodes.push(button);
        }
        /*
        this.hotitems["resume"]   = [btnResume];
        this.hotitems["stepinto"] = [btnStepInto];
        this.hotitems["stepover"] = [btnStepOver];
        this.hotitems["stepout"]  = [btnStepOut];
*/
        var _self = this;
        mdlAndroidRunConfigurations.addEventListener("afterload", function(e) {
            _self.$updateMenu();
        });
        mdlAndroidRunConfigurations.addEventListener("update", function(e) {
            settings.save();
            if (e.action == "add" || e.action == "redo-remove" || e.action == "attribute")
                _self.$updateMenu();
        });

        ide.addEventListener("loadsettings", function(e){
            var runConfigs = e.model.queryNode("auto/androidconfigs");
            if (!runConfigs)
                runConfigs = apf.createNodeFromXpath(e.model.data, "auto/androidconfigs");

            mdlAndroidRunConfigurations.load(runConfigs);
        });

        winAndroidRunCfgNew.addEventListener("hide", function() {
            mdlAndroidRunConfigurations.data.setAttribute("debug", "0");
        });
    },

    duplicate : function() {
        var config = lstRunCfg.selected;
        if (!config)
            return;

        var duplicate = config.cloneNode(true);
        apf.b(config).after(duplicate);
        lstAndroidRunCfg.select(duplicate);
        winAndroidRunCfgNew.show();
    },

    addConfig : function() {
        var file = ide.getActivePageModel();
        var path, name;

        if (!file) {   
            path = "";
            name = "replace me with an Android project name";
        } else {
            path = file.getAttribute("path").slice(ide.davPrefix.length + 1);
            name = file.getAttribute("path").slice(ide.davPrefix.length + 1).split('/',1)[0];
        }

        var cfg = apf.n("<config />")
            .attr("path", path)
            .attr("name", name)
            .attr("args", "").node();
            
        var firstcfg = lstAndroidRunCfg.root.childNodes[0];
        if (firstcfg) {
            apf.b(firstcfg).before(cfg);
        } else {
            mdlAndroidRunConfigurations.appendXml(cfg);
        }
        winAndroidRunCfgNew.show();
        lstAndroidRunCfg.select(cfg);
    },

    showRunConfigs : function(debug) {
        mdlAndroidRunConfigurations.data.setAttribute("debug", debug ? "1": "0");
        winAndroidRunCfgNew.show();
    },

    run : function(debug) {
        var config = lstAndroidRunCfg.selected;
        mdlAndroidRunConfigurations.data.setAttribute("debug", debug ? "1": "0");
        if (!config) {
            this.addConfig();
        } else { 
            this.runConfig(config, debug);
            ide.dispatchEvent("track_action", {type: debug ? "debug" : "run"});
        } 
    },

    $updateMenu : function() {
        var menus = [mnuAndroidRunCfg /*, mnuAndroidDebugCfg */];

        for (var j=0; j<menus.length; j++) {
            var menu = menus[j];

            var item = menu.firstChild;
            while(item && item.tagName !== "a:divider") {
                menu.removeChild(item);
                item = menu.firstChild;
            }
            var divider = item;

            var configs = mdlAndroidRunConfigurations.queryNodes("config");
            if (!configs.length)
                menu.insertBefore(new apf.item({disabled:true, caption: "no run history"}), divider);
            else {
                for (var i=0,l=configs.length; i<l; i++) {
                    var item = new apf.item({
                        caption: configs[i].getAttribute("name")
                    });
                    item.$config = configs[i];

                    var _self = this;
                    item.onclick = function(debug) {
                        _self.runConfig(this.$config, debug);
                        lstAndroidRunCfg.select(this.$config);
                    }.bind(item, false /*menu == mnuAndroidDebugCfg*/);
                    menu.insertBefore(item, menu.firstChild);
                }
            }
        }
    },

    runConfig : function(config, debug) {
        var model = settings.model;
        var saveallbeforerun = model.queryValue("general/@saveallbeforerun");
        if(saveallbeforerun) save.saveall();
        
        if (debug === undefined)
            debug = config.parentNode.getAttribute("debug") == "1";

        config.parentNode.setAttribute("debug", "0");
        buildrun.buildrun(debug, config.getAttribute("name"));
 //       noderunner.run(config.getAttribute("path"), config.getAttribute("args").split(" "), debug);
    },

    stop : function() {
        buildrun.stop();
    },

    enable : function(){
        if (!this.disabled) return;
        
        this.nodes.each(function(item){
            item.setProperty("disabled", item.$lastDisabled !== undefined
                ? item.$lastDisabled
                : true);
            delete item.$lastDisabled;
        });
        this.disabled = false;
    },

    disable : function(){
        if (this.disabled) return;
        
        this.nodes.each(function(item){
            if (!item.$lastDisabled)
                item.$lastDisabled = item.disabled;
            item.disable();
        });
        this.disabled = true;
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});