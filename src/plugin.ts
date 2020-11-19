const through2 = require('through2')
import Vinyl = require('vinyl')
import PluginError = require('plugin-error');
const pkginfo = require('pkginfo')(module); // project package.json info into module.exports
const PLUGIN_NAME = module.exports.name;
import * as loglevel from 'loglevel'
const log = loglevel.getLogger(PLUGIN_NAME) // get a logger instance based on the project name
log.setLevel((process.env.DEBUG_LEVEL || 'debug') as loglevel.LogLevelDesc)

const MailComposer = require('nodemailer/lib/mail-composer');
const getStream = require('get-stream')
import replaceExt = require('replace-ext')
import { merge } from 'merge'

/**
 * Create a mime format file from the incoming gulp files, which may be either json files like [E-mail message fields](https://nodemailer.com/extras/mailcomposer/#e-mail-message-fields)
 * or attachment files
 * @param configObj optional object whose properties match [E-mail message fields](https://nodemailer.com/extras/mailcomposer/#e-mail-message-fields)
 * @param filesAreAttachments if false (the default), files will be json files like [E-mail message fields](https://nodemailer.com/extras/mailcomposer/#e-mail-message-fields)
 * describing the email to be created, with configObj properties overriding those of the json files; if true, files will become attachments and configObj will 
 * otherwise fully describe the email
 */
export function targetMime(configObj?: Object, filesAreAttachments: boolean = false) {
  if (!configObj) configObj = {}
  // let Attachments: Array<Object> | null = (configObj.Attachments)? configObj.Attachments : null
  let MailObject: any = {}

  function addFileAsAttachment(file: Vinyl) {
    // file is an attachment; add it to MailObject.attachments
    merge(MailObject, configObj)
    MailObject.attachments = MailObject.attachments ? MailObject.attachments : []
    MailObject.attachments.push({
      path: file.path,
      content: file.contents
    })
  }

  async function mergeFileAsMailObject(file: Vinyl) {
    // file is an email object; parse it and then merge with configObj
    let contents: Buffer;
    if (file.isBuffer())
      contents = file.contents
    else
      contents = await getStream.buffer(file.contents)

    try {
      MailObject = (JSON.parse(contents.toString()))
    }
    catch {
      log.warn('Unable to parse ' + file.basename + ' as json; attempting to continue with configObj')
      MailObject = {};
    }
    merge(MailObject, configObj) // override fields of MailObject with those from configObj    
  }

  // creating a stream through which each file will pass - a new instance will be created and invoked for each file 
  // see https://stackoverflow.com/a/52432089/5578474 for a note on the "this" param
  const strm = through2.obj(async function (this: any, file: Vinyl, encoding: string, cb: Function) {
    let returnErr: any = null

    if (file.isNull() || returnErr) {
      // return empty file
      return cb(returnErr)
    }


    file.path = replaceExt(file.path, '.eml')

    if (filesAreAttachments)
      addFileAsAttachment(file)
    else
      await mergeFileAsMailObject(file)

    let mail = new MailComposer(MailObject)

    try {

      if (file.isBuffer()) {

        mail.compile().build(function (err: any, message: any) {
          try {
            file.contents = Buffer.from(message.toString())
          }
          catch (err) {
            log.error(err)
          }
          log.debug('calling callback')
          cb(returnErr, file);
        })
      }
      else if (file.isStream()) {
        var stream = mail.compile().createReadStream()

        file.contents = stream
          .on('end', function () {
            log.debug('mime parser is done')
          })
          .on('error', function (err: any) {
            log.error(err)
          })

        // after our stream is set up (not necesarily finished) we call the callback
        log.debug('calling callback')
        cb(returnErr, file);
      }
    }
    catch (err) {
      returnErr = new PluginError(PLUGIN_NAME, err);
      return cb(returnErr, file)
    }

  })

  return strm
}