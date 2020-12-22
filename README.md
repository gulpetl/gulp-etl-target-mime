# gulp-target-mime

This is a [**gulp**](https://gulpjs.com/) [plugin](https://gulpjs.com/docs/en/getting-started/using-plugins) which is a wrapper for [mailcomposer](https://nodemailer.com/extras/mailcomposer/).  It produces an standard raw **MIME/.eml** email file suitable for sending as an email using [`gulp-email-adapter`](https://github.com/gulpetl/gulp-email-adapter), and runs in one of two modes:

- `normal` mode takes a **json file** describing an email, using it to produce the email file
- [`filesAreAttachments`](#filesareattachments-mode) mode takes a file of any type and uses it as an attachment on the resulting email file

## Usage

The simplest way to get started is to start with file(s) like `mail.json` (a file whose properties match [E-mail message fields](https://nodemailer.com/extras/mailcomposer/#e-mail-message-fields)):

``` json
{
    "from": "test@test.com",
    "to": "me@gmail.com",
    "subject": "This is a test!",
    "text": "nothing really to say..."
}
```

This sample `gulpfile.js` takes `mail.json` and creates a mime file, then sends it using `gulp-email-adapter`

``` javascript
import { targetMime } from 'gulp-target-mime'
// or: var targetMime = require('gulp-target-mime').targetMime
import { emailAdapter } from 'gulp-email-adapter'
// or: var emailAdapter = require('gulp-email-adapter').emailAdapter

// options for sending using AWS SES
var emailOptions = { "accessKeyId": "(your access key)", "secretAccessKey": "(your access secret)", "region": "(enter region)" };

function createAndSendEmails(callback: any) {
  return gulp.src('data/mail.json')  
    .pipe(targetMime())                // create MIME file from incoming file (e.g. mail.json)
    .pipe(emailAdapter(emailOptions})) // send MIME files as emails using emailAdapter
}

exports.default = createAndSendEmails
```

### Parameters

- `configObj` is an optional object whose properties match [E-mail message fields](https://nodemailer.com/extras/mailcomposer/#e-mail-message-fields). You can pass a `configObj` to override properties of your email files:

``` javascript
let configObj = {from: 'myemail@live.com' }
// ...
  .pipe(targetMime({configObj}))       // every email will come from `myemail@live.com`, overriding the `from` property in `mail.json`
// ...
```

- `filesAreAttachments` is an optional second parameter (default is false) that can switch from receiving files like `mail.json` (as described above) to instead receiving
files of any type to be treaded as attachments.

#### `filesAreAttachments` mode

``` javascript
// ...
  // since `filesAreAttachments` is true, configObj must contain all information (besides attachments) for the email
  let configObj = {
      "from": "logger@test.com",
      "to": "admin@test.com",
      "subject": "Log File",
      "text": "Log file is attached"
  }
  return gulp.src('logs/**.log')  
    .pipe(targetMime({configObj}, true)) // `filesAreAttachments` is true, so each `.log` file is treated as an attachment for its own email
    .pipe(emailAdapter(emailOptions}))   // send MIME files as emails using emailAdapter
}
// ...
```

## Advanced Attachment Handling

`filesAreAttachments` mode treats each file as its own email, but what if you need to attach multiple files to a single email? You can do that using `configObj` or
with your `mail.json`-type files using [this info](https://nodemailer.com/extras/mailcomposer/#attachments) to set it up manually. But here's a fancy way to
do it with a separate `gulp` task which runs first to collect the attachments you want and make an array of objects out of them. That array can then
be used to populate the outgoing email.

``` javascript
let attachmentArr:any = []

function collectAttachments(callback: any) {
  return gulp.src(['data/*.*','!data/mail.json'])
    .on('data', function (file:Vinyl) {
      attachmentArr.push(
        {
          filename: file.basename,
          content: file.contents
        })
    })
}

function createAndSendEmails(callback: any) {
  return gulp.src('data/mail.json')  
    .pipe(targetMime({attachments: attachmentArr}))
    .pipe(gulp.dest('output/'))
}

exports.default = gulp.series(collectAttachments, createAndSendEmails)
```

## gulp-data compatibility

`configObj` can be omitted in favor of the API suggested by [gulp-data](https://www.npmjs.com/package/gulp-data). Our implementation looks for both a `targetMime`
property and `gulp-target-mime`, avoiding interference with other plugins that may look for their own config properties in similar way.

``` javascript
import { targetMime } from 'gulp-target-mime'
var data = require('gulp-data');
// ...

  return gulp.src('logs/**.log')
    .pipe(data(function(file) {
      return {
        targetMime: {
          "from": "logger@test.com",
          "to": "admin@test.com",
          "subject": file.basename,      // this property is specific to the current file, which is not possible when passing configObj to targetMime below
          "text": "Log file is attached"
        }
      }
    }))  
    .pipe(targetMime({}, true))          // we can pass a blank configObj here
// ...
```

If there is a conflict, the properties from `configObj` will be overriden, as the `targetMime`/`gulp-target-mime` properties are specific to the particular file and thus more granular.

## Quick Start for Coding on This Plugin

- Dependencies:

  - [git](https://git-scm.com/downloads)
  - [nodejs](https://nodejs.org/en/download/releases/) - At least v6.3 (6.9 for Windows) required for TypeScript debugging
  - npm (installs with Node)
  - typescript - installed as a development dependency
  - Clone this repo and run `npm install` to install npm packages
  - Debug: with [VScode](https://code.visualstudio.com/download) use `Open Folder` to open the project folder, then hit F5 to debug. This runs without compiling to javascript using [ts-node](https://www.npmjs.com/package/ts-node)
  - Test: `npm test` or `npm t`
  - Compile to javascript: `npm run build`

### Testing

We are using [Jest](https://facebook.github.io/jest/docs/en/getting-started.html) for our testing. Each of our tests are in the `test` folder.

- Run `npm test` to run the test suites

Note: This document is written in [Markdown](https://daringfireball.net/projects/markdown/). We like to use [Typora](https://typora.io/) and [Markdown Preview Plus](https://chrome.google.com/webstore/detail/markdown-preview-plus/febilkbfcbhebfnokafefeacimjdckgl?hl=en-US) for our Markdown work..
