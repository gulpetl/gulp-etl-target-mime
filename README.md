# gulp-etl-target-mime #

This is a gulp plugin. This plugin converts a **JSON file containing a mail object** to an **actual raw email (MIME/.eml file)**. It is a **gulp** wrapper for [mailcomposer](https://nodemailer.com/extras/mailcomposer/).

### Usage
The configObj will contain any info the plugin needs. For this plugin the configObj can have one option whihc can be an array of objects:
    
* **Attachments: Array of Objects** - If you want to add extra attachments to the mail you can drop them in the directory and create a gulp task to collect all these attachments make an array of objects out of them as depicted in the example gulpfile, and then create another gulp task to pass this attachment array in the plugin to add them as attachments in teh outgoing email. By default this would be null, so no extra attachments would be passed in.

##### Sample gulpfile.js
```
let Attachments:any = []

function CollectAttachments(callback: any) {
  return gulp.src(['data/*.*','!data/mail.JSON'])
    .on('data', function (file:Vinyl) {
      Attachments.push(
        {
          filename: file.basename,
          content: file.contents
        })
    })    
}

function runtargetMime(callback: any) {
  return gulp.src('data/mail.JSON')  
    .pipe(targetMime({Attachments}))
    .pipe(gulp.dest('output/'))
}


exports.default = gulp.series(CollectAttachments, runtargetMime)
```
### Quick Start for Coding on This Plugin
* Dependencies: 
    * [git](https://git-scm.com/downloads)
    * [nodejs](https://nodejs.org/en/download/releases/) - At least v6.3 (6.9 for Windows) required for TypeScript debugging
    * npm (installs with Node)
    * typescript - installed as a development dependency
* Clone this repo and run `npm install` to install npm packages
* Debug: with [VScode](https://code.visualstudio.com/download) use `Open Folder` to open the project folder, then hit F5 to debug. This runs without compiling to javascript using [ts-node](https://www.npmjs.com/package/ts-node)
* Test: `npm test` or `npm t`
* Compile to javascript: `npm run build`

### Testing

We are using [Jest](https://facebook.github.io/jest/docs/en/getting-started.html) for our testing. Each of our tests are in the `test` folder.

- Run `npm test` to run the test suites



Note: This document is written in [Markdown](https://daringfireball.net/projects/markdown/). We like to use [Typora](https://typora.io/) and [Markdown Preview Plus](https://chrome.google.com/webstore/detail/markdown-preview-plus/febilkbfcbhebfnokafefeacimjdckgl?hl=en-US) for our Markdown work..
