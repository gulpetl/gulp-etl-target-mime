"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const through2 = require('through2');
const PluginError = require("plugin-error");
const pkginfo = require('pkginfo')(module); // project package.json info into module.exports
const PLUGIN_NAME = module.exports.name;
const loglevel = require("loglevel");
const log = loglevel.getLogger(PLUGIN_NAME); // get a logger instance based on the project name
log.setLevel((process.env.DEBUG_LEVEL || 'warn'));
const MailComposer = require('nodemailer/lib/mail-composer');
const getStream = require('get-stream');
const replaceExt = require("replace-ext");
/** wrap incoming recordObject in a Singer RECORD Message object*/
function createRecord(recordObject, streamName) {
    return { type: "RECORD", stream: streamName, record: recordObject };
}
/* This is a gulp-etl plugin. It is compliant with best practices for Gulp plugins (see
https://github.com/gulpjs/gulp/blob/master/docs/writing-a-plugin/guidelines.md#what-does-a-good-plugin-look-like ),
and like all gulp-etl plugins it accepts a configObj as its first parameter */
function targetMime(configObj) {
    if (!configObj)
        configObj = {};
    let Attachments = (configObj.Attachments) ? configObj.Attachments : null;
    let MailObject;
    // creating a stream through which each file will pass - a new instance will be created and invoked for each file 
    // see https://stackoverflow.com/a/52432089/5578474 for a note on the "this" param
    const strm = through2.obj(function (file, encoding, cb) {
        let returnErr = null;
        if (file.isNull() || returnErr) {
            // return empty file
            return cb(returnErr);
        }
        else if (file.isBuffer()) {
            MailObject = (JSON.parse(file.contents.toString())).record;
            if (Attachments) {
                for (var i = 0; i < Attachments.length; i++) {
                    MailObject.attachments.push(Attachments[i]);
                }
            }
            var mail = new MailComposer(MailObject);
            try {
                mail.compile().build(function (err, message) {
                    try {
                        file.contents = Buffer.from(message.toString());
                        file.path = replaceExt(file.path, '.eml');
                    }
                    catch (err) {
                        console.log(err);
                    }
                    log.debug('calling callback');
                    cb(returnErr, file);
                });
            }
            catch (err) {
                returnErr = new PluginError(PLUGIN_NAME, err);
                return cb(returnErr, file);
            }
        }
        else if (file.isStream()) {
            (() => __awaiter(this, void 0, void 0, function* () {
                var contents = yield getStream.buffer(file.contents);
                let MailObject = (JSON.parse(contents.toString())).record;
                if (Attachments) {
                    for (var i = 0; i < Attachments.length; i++) {
                        MailObject.attachments.push(Attachments[i]);
                    }
                }
                var mail = new MailComposer(MailObject);
                var stream = mail.compile().createReadStream();
                file.contents = stream
                    .on('end', function () {
                    // DON'T CALL THIS HERE. It MAY work, if the job is small enough. But it needs to be called after the stream is SET UP, not when the streaming is DONE.         
                    log.debug('mime parser is done');
                })
                    .on('error', function (err) {
                    log.error(err);
                });
                file.path = replaceExt(file.path, '.eml');
                // after our stream is set up (not necesarily finished) we call the callback
                log.debug('calling callback');
                cb(returnErr, file);
            }))();
        }
    });
    return strm;
}
exports.targetMime = targetMime;
//# sourceMappingURL=plugin.js.map