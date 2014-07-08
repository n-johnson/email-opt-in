var Email = function(API_TOKEN) {
    var mandrill = require('mandrill-api/mandrill');
    this.mandrill_client = new mandrill.Mandrill(API_TOKEN);
    this.validator = require("email-validator");
};

/*
message expected as object in the format
{
    to: {
        email: 'bsmith@test.com',
        name: 'Bob Smith'
    },
    from: {
        email: 'info@company.com',
        name: 'Company Inc'
    },
    subject: 'Confirm your signup',
    body: {
        html: '<p>HTML version here</p>',
        plain: 'Plain text content here.',
    }
}

callback via the format cb(error, result)
    - NOTE: A result does not guarntee email sent successfully. An error is only reported if we can't even connect
    to mandrill.
*/
Email.prototype.send = function(input, callback) {
    var self = this;
    //Verify minimum requirements
    if (!input.from || !input.from.email || !input.to || !input.to.email)
        return callback('Missing information', null);

    var message = {};
    message.html = input.body.html || '';
    message.text = input.body.plain || '';
    message.subject = input.subject || '';
    message.from_email = input.from.email;
    if (input.from.name)
        message.from_name = input.from.name;

    var to = {
        'type': 'to'
    };
    to.email = input.to.email;
    if (input.to.name)
        to.name = input.to.name;
    message.to = [to];

    message.headers = {
        'Reply-To': input.from.email
    };
    self.mandrill_client.messages.send({
        "message": message,
        "async": true
    }, function(result) {
        //console.log(result);
        return callback(null, result);
    }, function(e) {
        //console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        return callback(e, null);
    });
};

Email.prototype.validate = function(email) {
    return this.validator.validate(email);
};


module.exports = function(API_TOKEN) {
    return new Email(API_TOKEN);
};