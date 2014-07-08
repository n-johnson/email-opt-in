var config = {
    MANDRILL_API_KEY: 'API_KEY_HERE',
    REDIS: {
        SELECT: 1,
        HOSTNAME: '127.0.0.1',
        PORT: 6379
    },
    EMAIL: {
        SENDER_NAME: 'Test Inc',
        SENDER_EMAIL: 'info@company.com',
        SUBJECT: 'Confirm Email for Test Inc',
        MESSAGE_HTML: "Please confirm your email subscription to the Test Inc<br /><br />" +
            '<a href="http://test.com/confirmEmail?email=%%EMAIL%%&code=%%CONFIRMATION_CODE%%">Click here to confirm your subscription</a><br /><br />' +
            "If you received this email by mistake, simply delete it and you won't hear back from us!<br />" +
            "For any questions please contact questions@test.com"
    }
};

module.exports = config;