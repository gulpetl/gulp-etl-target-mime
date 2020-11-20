let gulp = require('gulp')
import { targetMime } from '../src/plugin'

import * as loglevel from 'loglevel'
const log = loglevel.getLogger('gulpfile')
log.setLevel((process.env.DEBUG_LEVEL || 'info') as loglevel.LogLevelDesc)
// if needed, you can control the plugin's logging level separately from 'gulpfile' logging above
// const pluginLog = loglevel.getLogger(PLUGIN_NAME)
// pluginLog.setLevel('debug')

const errorHandler = require('gulp-error-handle'); // handle all errors in one handler, but still stop the stream if there are errors

const pkginfo = require('pkginfo')(module); // project package.json info into module.exports
const PLUGIN_NAME = module.exports.name;

import Vinyl = require('vinyl')

let gulpBufferMode = false;

function switchToBuffer(callback: any) {
  gulpBufferMode = true;

  callback();
}

let attachmentArr: any = []

function collectAttachments(callback: any) {
  return gulp.src(['../testdata/*.*', '!../testdata/mail.json'], { buffer: gulpBufferMode })
    .pipe(errorHandler(function (err: any) {
      log.error('Error: ' + err)
      callback(err)
    }))
    .on('data', function (file: Vinyl) {
      attachmentArr.push(
        {
          filename: file.basename,
          content: file.contents
        })
    })
}


function runtargetMime(callback: any) {
  log.info('gulp task starting for ' + PLUGIN_NAME)

  return gulp.src('../testdata/mail.json', { buffer: gulpBufferMode })
    .pipe(errorHandler(function (err: any) {
      log.error('Error: ' + err)
      callback(err)
    }))
    .on('data', function (file: Vinyl) { // using 'data' callback as a shortcut way to update file.data
      log.info('Starting processing on ' + file.basename)

      file.data = { 
        targetMimeConfig: { from: "testo@test.com" } // this `from` will prevail
      }
    })
    .pipe(targetMime({ attachments: attachmentArr, from: "harry@test.com" })) // this `from` will be overridden by that from `file.data`
    .pipe(gulp.dest('../testdata/processed'))
    .on('data', function (file: Vinyl) {
      log.info('Finished processing on ' + file.basename)
    })
    .on('end', function () {
      log.debug('gulp task complete')
      callback()
    })
}


exports.default = gulp.series(collectAttachments, runtargetMime)
exports.runtargetMimeBuffer = gulp.series(switchToBuffer, collectAttachments, runtargetMime)