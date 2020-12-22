"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.targetMime = void 0;
const through2 = require('through2');
const PluginError = require("plugin-error");
const pkginfo = require('pkginfo')(module); // project package.json info into module.exports
const PLUGIN_NAME = module.exports.name;
const loglevel = require("loglevel");
const log = loglevel.getLogger(PLUGIN_NAME); // get a logger instance based on the project name
log.setLevel((process.env.DEBUG_LEVEL || 'info'));
const MailComposer = require('nodemailer/lib/mail-composer');
const getStream = require('get-stream');
const replaceExt = require("replace-ext");
const merge_1 = require("merge");
const camelcase_1 = require("camelcase");
function addFileAsAttachment(file, config) {
    // file is an attachment; add it to MailObject.attachments
    let mailObject = {};
    merge_1.default.recursive(mailObject, config);
    mailObject.attachments = mailObject.attachments || [];
    mailObject.attachments.push({
        // path: file.path, // this would load from file on disk (if it hasn't been renamed), not from our current in-memory gulp file
        filename: file.basename,
        content: file.contents
    });
    return mailObject;
}
const mergeFileAsMailObject = (file, config) => __awaiter(void 0, void 0, void 0, function* () {
    // file is an email object; parse it and then merge with configObj
    let mailObject = {};
    let contents;
    if (file.isBuffer())
        contents = file.contents;
    else
        contents = yield getStream.buffer(file.contents);
    try {
        mailObject = (JSON.parse(contents.toString()));
    }
    catch (_a) {
        log.warn('Unable to parse ' + file.basename + ' as json; attempting to continue with configObj');
        mailObject = {};
    }
    return merge_1.default.recursive(mailObject, config); // override fields of mailObject with those from config
});
/**
 * Create a MIME file from each incoming gulp file, which may be either a json file like [E-mail message fields](https://nodemailer.com/extras/mailcomposer/#e-mail-message-fields)
 * or a file of any type to be used as an attachment
 * @param configObj optional object whose properties match [E-mail message fields](https://nodemailer.com/extras/mailcomposer/#e-mail-message-fields)
 * @param filesAreAttachments if false (the default), files will be json files like [E-mail message fields](https://nodemailer.com/extras/mailcomposer/#e-mail-message-fields)
 * describing the email to be created, with configObj properties overriding those of the json files; if true, files will become attachments and configObj will
 * otherwise fully describe the email
 */
function targetMime(configObj, filesAreAttachments = false) {
    // if (!configObj) configObj = {}
    // creating a stream through which each file will pass - a new instance will be created and invoked for each file 
    // see https://stackoverflow.com/a/52432089/5578474 for a note on the "this" param
    const strm = through2.obj(function (file, encoding, cb) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let mailObject = {};
            let config = {};
            let returnErr = null;
            if (file.isNull() || returnErr) {
                // return empty file
                return cb(returnErr);
            }
            // create a config object for this file taking configObj and overriding with any gulp-data-compatible settings from this specific file
            // we don't use file.data directly; we look for our config object as a property UNDER file.data (so other plugins can do the same);
            // tries for both full and shortened-camelcased versions of THIS plugin's name, e.g. "gulp-plugin-name" and "pluginName"
            merge_1.default.recursive(config, configObj, (_a = file === null || file === void 0 ? void 0 : file.data) === null || _a === void 0 ? void 0 : _a[PLUGIN_NAME], (_b = file.data) === null || _b === void 0 ? void 0 : _b[camelcase_1.default(PLUGIN_NAME.replace(/^gulp-/, ''))]);
            if (filesAreAttachments) {
                mailObject = addFileAsAttachment(file, config); // uses current file.basename as the name of the attachment
                file.path = file.path + '.eml'; // rename current file (which is becoming a mime file rather than an attachment), e.g. asdf.pdf -> asdf.pdf.eml
            }
            else {
                mailObject = yield mergeFileAsMailObject(file, config);
                file.path = replaceExt(file.path, '.eml'); // e.g. one-email.json -> one-email.eml
            }
            let mail = new MailComposer(mailObject);
            try {
                if (file.isBuffer()) {
                    mail.compile().build(function (err, message) {
                        try {
                            if (!err)
                                file.contents = Buffer.from(message.toString());
                            else
                                returnErr = err;
                        }
                        catch (err) {
                            log.error(err);
                        }
                        log.debug('calling callback');
                        cb(returnErr, file);
                    });
                }
                else if (file.isStream()) {
                    var stream = mail.compile().createReadStream();
                    file.contents = stream
                        .on('end', function () {
                        log.debug('mime parser is done');
                    })
                        .on('error', function (err) {
                        log.error(err);
                    });
                    // after our stream is set up (not necesarily finished) we call the callback
                    log.debug('calling callback');
                    cb(returnErr, file);
                }
            }
            catch (err) {
                returnErr = new PluginError(PLUGIN_NAME, err);
                return cb(returnErr, file);
            }
        });
    });
    return strm;
}
exports.targetMime = targetMime;
//# sourceMappingURL=plugin.js.map