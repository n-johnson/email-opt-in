email-opt-in
============

WORK IN PROGRESS

Simple email list opt-in for node.js.

index.js is an example of how to integrate into an express application.

Email.js is meant to be modular; if you want to replace mandrill with sendgrid, SES, or whatever you want, as long as the Email.send() method exists and takes an object defined in the current file, it will work just fine! If you modify this to support alternate services, submit a pull request and I will add in support natively!