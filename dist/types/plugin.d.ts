import mailer from 'nodemailer/lib/mailer';
/**
 * Create a MIME file from each incoming gulp file, which may be either a json file like [E-mail message fields](https://nodemailer.com/extras/mailcomposer/#e-mail-message-fields)
 * or a file of any type to be used as an attachment
 * @param configObj optional object whose properties match [E-mail message fields](https://nodemailer.com/extras/mailcomposer/#e-mail-message-fields)
 * @param filesAreAttachments if false (the default), files will be json files like [E-mail message fields](https://nodemailer.com/extras/mailcomposer/#e-mail-message-fields)
 * describing the email to be created, with configObj properties overriding those of the json files; if true, files will become attachments and configObj will
 * otherwise fully describe the email
 */
export declare function targetMime(configObj?: mailer.Options, filesAreAttachments?: boolean): any;
//# sourceMappingURL=plugin.d.ts.map