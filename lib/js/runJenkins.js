"use strict";

require("core-js/modules/es.array.concat");

require("core-js/modules/es.array.find");

require("core-js/modules/es.array.includes");

require("core-js/modules/es.function.name");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

require("core-js/modules/es.regexp.exec");

require("core-js/modules/es.string.includes");

require("regenerator-runtime/runtime");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var sh = require('shelljs');

var apolloConfig = require('./apollo');

var _require = require('./index'),
    success = _require.success,
    mapTemplate = _require.mapTemplate;

module.exports = function () {
  var _runJenkins = _asyncToGenerator(regeneratorRuntime.mark(function _callee(_ref) {
    var env, project, _ref$app, app, buildConfig, cfg, p, url;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            env = _ref.env, project = _ref.project, _ref$app = _ref.app, app = _ref$app === void 0 ? 'all' : _ref$app;
            _context.next = 3;
            return apolloConfig();

          case 3:
            buildConfig = _context.sent;
            cfg = buildConfig[env];

            if (cfg) {
              _context.next = 9;
              break;
            }

            sh.echo(error('请输入正确的环境名称'));
            sh.exit(1);
            return _context.abrupt("return");

          case 9:
            p = cfg.list.find(function (el) {
              return el.name === project;
            });

            if (p) {
              _context.next = 14;
              break;
            }

            sh.echo(error('请输入正确的项目名称'));
            sh.exit(1);
            return _context.abrupt("return");

          case 14:
            if (!(app && p.apps && !p.apps.includes(app))) {
              _context.next = 18;
              break;
            }

            sh.echo(error('请输入正确的应用名称'));
            sh.exit(1);
            return _context.abrupt("return");

          case 18:
            if (buildConfig.template) {
              _context.next = 22;
              break;
            }

            sh.echo(error('请配置Jenkins构建地址模板'));
            sh.exit(1);
            return _context.abrupt("return");

          case 22:
            url = mapTemplate(buildConfig.template, {
              line: cfg.line,
              project: p.project,
              token: cfg.token,
              app: app
            });
            sh.exec("curl -u ".concat(buildConfig.username, ":").concat(buildConfig.password, " \"").concat(url, "\""), {
              silent: true
            });
            sh.echo(success('成功调起Jenkins构建'));

          case 25:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  function runJenkins(_x) {
    return _runJenkins.apply(this, arguments);
  }

  return runJenkins;
}();