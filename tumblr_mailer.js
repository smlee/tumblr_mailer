var fs = require('fs');
var ejs = require('ejs');
var tumblr = require('tumblr.js');
var mandrill = require('mandrill-api/mandrill');

var client = tumblr.createClient({
    consumer_key: 'xxxxx',
    consumer_secret: 'xxxxx',
    token: 'xxxxx',
    token_secret: 'xxxxx'
});
var mandrill_client = new mandrill.Mandrill('xxxxx');

var csvFile = fs.readFileSync("friend_list.csv","utf8");
var emailTemplate = fs.readFileSync('email_template.html', 'utf8');

function csvParse(csvFile){
    var arrayOfObjects = [];
    var arr = csvFile.split("\n");
    var newObj;

    keys = arr.shift().split(",");

    arr.forEach(function(contact){
        contact = contact.split(",");
        newObj = {};

        for(var i =0; i < contact.length; i++){
            newObj[keys[i]] = contact[i];
        }

        arrayOfObjects.push(newObj);

    });

    return arrayOfObjects;
}

friendList = csvParse(csvFile);

// Make the request
client.posts('smleefs.tumblr.com', function (err, blog) {
    var latestPosts = [];
    var today = Date.now();

    blog.posts.forEach(function(post){
        var postDate = new Date(post.date);
        var diff = (today - postDate)/24/60/60/1000; //Time difference in milliseconds / 24h / 60m / 60s/ 1000ms
        if (Math.floor(diff) <= 7) {
            latestPosts.push({'href': post.short_url, 'title': post.title})
        }
    });

    friendList.forEach(function(row){

        var firstName = row["firstName"];
        var fullName = row["firstName"] + row["lastName"];
        var email = row["emailAddress"];
        var numMonthsSinceContact = row["numMonthsSinceContact"];

        // we make a copy of the emailTemplate variable to a new variable to ensure
        // we don't edit the original template text since we'll need to us it for
        // multiple emails

        var customizedTemplate = ejs.render(emailTemplate,
            { firstName: firstName,
                numMonthsSinceContact: numMonthsSinceContact,
                latestPosts: latestPosts
            });

        sendEmail(fullName, email, 'Sangmin Lee', 'sangmlee23@gmail.com', 'My Experiences at FullStack Academy Blog', customizedTemplate)

    });
});

function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
    var message = {
        "html": message_html,
        "subject": subject,
        "from_email": from_email,
        "from_name": from_name,
        "to": [{
            "email": to_email,
            "name": to_name
        }],
        "important": false,
        "track_opens": true,
        "auto_html": false,
        "preserve_recipients": true,
        "merge": false,
        "tags": [
            "Fullstack_Tumblrmailer_Workshop"
        ]
    };
    var async = false;
    var ip_pool = "Main Pool";
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
        // console.log(message);
        // console.log(result);
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
}