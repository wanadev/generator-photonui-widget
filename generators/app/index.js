"use strict";

var yeoman = require("yeoman-generator");
var chalk = require("chalk");
var yosay = require("yosay");
var url = require("url");

// GitHub
var proxy = process.env.http_proxy ||
    process.env.HTTP_PROXY ||
    process.env.https_proxy ||
    process.env.HTTPS_PROXY ||
    null;

var githubOptions = {
    version: "3.0.0"
};

if (proxy) {
    var proxyUrl = url.parse(proxy);

    githubOptions.proxy = {
        host: proxyUrl.hostname,
        port: proxyUrl.port
    };
}

var GitHubApi = require("github");
var github = new GitHubApi(githubOptions);

if (process.env.GITHUB_TOKEN) {
    github.authenticate({
        type: "oauth",
        token: process.env.GITHUB_TOKEN
    });
}

var emptyGithubRes = {
    name: '',
    email: '',
    html_url: ''
};

var githubUserInfo = function (name, cb, log) {
    github.user.getFrom({
        user: name
    }, function (err, res) {
        if (err) {
            log.error("Cannot fetch your github profile. Make sure you\'ve typed it correctly.");
            res = emptyGithubRes;
        }

        cb(JSON.parse(JSON.stringify(res)));
    });
};


// Generator
module.exports = yeoman.generators.Base.extend({

    prompting: function () {
        var done = this.async();

        // Have Yeoman greet the user.
        this.log(yosay(
            "Welcome to the " + chalk.red("Photonui Widget") + " generator!"
        ));

        var prompts = [
            {
                name: "githubUser",
                message: "Would you mind telling me your username on GitHub?",
                default: "someuser"
            },
            {
                name: "widgetName",
                message: "What is the widget\'s name?",
                default: "FooWidget"
            },
            {
                name: "widgetSuperClass",
                message: "What is the widget\'s super class?",
                default: "Widget"
            },
            {
                name: "widgetType",
                message: "What is the widget\'s type?",
                type: "list",
                choices: ["Composite", "Container", "DataView", "Interactive", "Layout", "NonVisual", "Visual"],
                default: "Visual"
            },
            {
                name: "widgetDesc",
                message: "Can you give me a short sentence to describe your widget?",
                default: ""
            }
        ];

        this.prompt(prompts, function (props) {
            this.props = props;
            done();
        }.bind(this));
    },

    configuring: {
        userInfo: function () {
            var done = this.async();

            githubUserInfo(this.props.githubUser, function(res) {
                this.realname = res.name;
                this.email = res.email;
                this.githubUrl = res.html_url;
                done();
            }.bind(this), this.log);
        }
    },

    writing: {
        files: function() {
            var that = this;

            function _appendJsRef() {
                var ref = "photonui." + that.props.widgetName + ' = require("./' + that.props.widgetType.toLowerCase() + "/" + that.props.widgetName.toLowerCase() + '.js");';
                var content = that.read(that.destinationRoot() + "/src/photonui.js");
                content = content.replace(/\/\/ *\[generator\]\r?\n?/, ref + "\n// [generator]\n");
                that.write(that.destinationRoot() + "/src/photonui.js", content);
            }

            function _appendStyleBaseRef() {
                var ref = '@import "' + that.props.widgetType.toLowerCase() + "/" + that.props.widgetName.toLowerCase() + '.less";';
                var content = that.read(that.destinationRoot() + "/less/base/imports.less");
                content = content.replace(/\/\* *\[generator\] *\*\/\r?\n?/, ref + "\n/* [generator] */\n");
                that.write(that.destinationRoot() + "/less/base/imports.less", content);
            }

            function _appendStyleThemeRef() {
                var ref = '@import "' + that.props.widgetType.toLowerCase() + "/" + that.props.widgetName.toLowerCase() + '.less";';
                var content = that.read(that.destinationRoot() + "/less/theme-particle/imports.less");
                content = content.replace(/\/\* *\[generator\] *\*\/\r?\n?/, ref + "\n/* [generator] */\n");
                that.write(that.destinationRoot() + "/less/theme-particle/imports.less", content);
            }

            function _appendSpecRef(suffix) {
                suffix = (suffix) ? '-' + suffix : '';
                var ref = '<script src="spec/' + that.props.widgetType.toLowerCase() + "/" + that.props.widgetName.toLowerCase() + suffix + '.js"></script>';
                var content = that.read(that.destinationRoot() + "/test/index.html");
                content = content.replace(/<!-- *\[generator\] *-->\r?\n?/, ref + "\n        <!-- [generator] -->\n");
                that.write(that.destinationRoot() + "/test/index.html", content);
            }

            if (this.props.widgetSuperClass == "Widget" || this.props.widgetSuperClass == "Base") {
                this.superClassPath = "../" + this.props.widgetSuperClass.toLowerCase() + ".js";
            }
            else {
                this.superClassPath = "./" + this.props.widgetSuperClass.toLowerCase() + ".js";
            }

            var pathJs = "src/" + this.props.widgetType.toLowerCase() + "/" + this.props.widgetName.toLowerCase() + ".js";
            var pathStyleBase = "less/base/" + this.props.widgetType.toLowerCase() + "/" + this.props.widgetName.toLowerCase() + ".less";
            var pathStyleTheme = "less/theme-particle/" + this.props.widgetType.toLowerCase() + "/" + this.props.widgetName.toLowerCase() + ".less";
            var pathSpecWidget = "test/spec/" + this.props.widgetType.toLowerCase() + "/" + this.props.widgetName.toLowerCase() + "-widget.js";
            var pathSpecContainer = "test/spec/" + this.props.widgetType.toLowerCase() + "/" + this.props.widgetName.toLowerCase() + "-container.js";
            var pathSpecLayout = "test/spec/" + this.props.widgetType.toLowerCase() + "/" + this.props.widgetName.toLowerCase() + "-layout.js";
            var pathSpec = "test/spec/" + this.props.widgetType.toLowerCase() + "/" + this.props.widgetName.toLowerCase() + ".js";

            switch (this.props.widgetType) {
                case "Visual":
                case "Interactive":
                    this.template("widget-visual-interactive.js", pathJs);
                    this.template("style.less", pathStyleBase);
                    this.template("style.less", pathStyleTheme);
                    this.template("spec-widget.js", pathSpecWidget);
                    this.template("spec.js", pathSpec);
                    _appendJsRef();
                    _appendStyleBaseRef();
                    _appendStyleThemeRef();
                    _appendSpecRef("widget");
                    _appendSpecRef();
                    break;
                case "Composite":
                    this.template("widget-composite.js", pathJs);
                    this.template("style.less", pathStyleBase);
                    this.template("style.less", pathStyleTheme);
                    this.template("spec-widget.js", pathSpecWidget);
                    this.template("spec.js", pathSpec);
                    _appendJsRef();
                    _appendStyleBaseRef();
                    _appendStyleThemeRef();
                    _appendSpecRef("widget");
                    _appendSpecRef();
                    break;
               case "Container":
                    this.template("widget-container.js", pathJs);
                    this.template("style.less", pathStyleBase);
                    this.template("style.less", pathStyleTheme);
                    this.template("spec-widget.js", pathSpecWidget);
                    this.template("spec-container.js", pathSpecContainer);
                    this.template("spec.js", pathSpec);
                    _appendJsRef();
                    _appendStyleBaseRef();
                    _appendStyleThemeRef();
                    _appendSpecRef("widget");
                    _appendSpecRef("container");
                    _appendSpecRef();
                    break;
                case "Layout":
                    this.template("widget-layout.js", pathJs);
                    this.template("style.less", pathStyleBase);
                    this.template("style.less", pathStyleTheme);
                    this.template("spec-widget.js", pathSpecWidget);
                    this.template("spec-layout.js", pathSpecLayout);
                    this.template("spec.js", pathSpec);
                    _appendJsRef();
                    _appendStyleBaseRef();
                    _appendStyleThemeRef();
                    _appendSpecRef("widget");
                    _appendSpecRef("layout");
                    _appendSpecRef();
                    break;
                case "NonVisual":
                    this.template("widget-nonvisual.js", pathJs);
                    this.template("spec.js", pathSpec);
                    _appendJsRef();
                    _appendSpecRef();
                    break;
                case "DataView":
                    throw new Error("NotImplementedError");
                default:
                    throw this.prop.widgetType + " is not a valid widget type.";
            }
        }
    }
});
