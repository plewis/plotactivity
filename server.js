// Inspired by https://socket.io/get-started/chat

// session middleware info
// https://www.geeksforgeeks.org/how-to-handle-sessions-in-express/?ref=ml_lbp
// https://www.npmjs.com/package/express-session

// This express-sessions tutorial might be useful to watch in its entirety:
//https://youtu.be/J1qXK66k1y4?si=FRoXeyVx8zK2Qs9v

// https://stackoverflow.com/questions/13426800/express-session-not-persisting

//https://stackoverflow.com/questions/9291548/how-can-i-find-the-session-id-when-using-express-connect-and-a-session-store

const gnetum_https = false;

// e.g. clients[netid] = {netid:pol02003, fname:"Paul", x:0.122, y:.345, y0:0.679}
var netid_clients = {};

// Number of times clients has been saved to clients-<++nsaves>.cjs
var nsaves = 0;

// These variables should both be set to undefined for production
// Defining values for them simply saves time when testing
// as they are used to fill out form fields in advance
let test_fname = "Paul";
let test_netid = "pol02003";

// Stores information about completed points, computed by recreateVertices from netid_clients
// whenever scatterplot requests new data
// e.g. vertices[i] = {x:0.122, y:0.897}
var vertices = [];

// Recomputes vertices using information in netid_clients
// It is called whenever scatterplot issues a "send points" message to the server
function recreateVertices() {
    vertices = [];
    for (let k in netid_clients) {
        let xval = netid_clients[k].x;
        let yval = netid_clients[k].y;
        if (xval && yval) {
            // Some clients may have been given an x value but have not yet
            // computed their y value
            vertices.push({x:xval, y:yval});
        }
    }
}

// Utility function returning random element from choices
function getRandomChoice(choices) {
    const random_index = Math.floor(Math.random() * choices.length);
    return choices[random_index];
}

// Load settings
const { axisinfo, log_heartbeat_messages, fx, dfx } = require('./public/settings.js');

// Load fake client data
// (brackets around Server is shorthand for "const test = require('./test.cjs').test"
const { fakeclients } = require('./fakeclients.cjs');      // first name and netid only
const { createFakeClient } = require('./fake-client.js'); 

// Load real client data from past run
// (brackets around Server is shorthand for "const saveddata = require('./saveddata.cjs').saveddata"
const { saveddata } = require('./saveddata.cjs');  

// Set up logger
// logger levels: ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF 
// Note: OFF is not a level (e.g. don't call logger.off)
var log4js = require("log4js");
log4js.configure({
    appenders: { 
        console: { type: "console" },
        logout: { type: "file", filename: "output.txt" } 
    },
    categories: { 
        default: { appenders: ["logout","console"], level: "debug" } 
    },
});
var logger = log4js.getLogger();

// Set up session middleware
// https://www.geeksforgeeks.org/how-to-handle-sessions-in-express/
const express = require('express');
const session = require('express-session');

// https://www.geeksforgeeks.org/what-is-mongodb-working-and-features/
//const MongoStore = require('connect-mongo')(session);

// Create an express app, which is a Javascript function designed to be passed to Node's HTTP server 
// as a callback to handle requests
const app = express();

// Make the public directory available to the browser-based client
app.use(express.static('public'))

// The source code at https://github.com/expressjs/session/blob/master/index.js 
// shows that session(options) is a function that sets options and then returns 
// a middleware function that is added to the current router
//
// https://www.cloudzilla.ai/dev-education/session-management-in-nodejs-using-expressjs-and-express-session/
// 
const oneDay = 1000 * 60 * 60 * 24; // 1000 millisecs/sec * 60 secs/min * 60 mins/hour * 24 hours/day

// https://socket.io/how-to/use-with-express-session
const sessionMiddleware = session({
    secret: 'jvlNKyuFLBXY',   // used to sign the session ID cookie 
                              // Can store secret in an environmental variable and retrieve
                              // like this "secret: process.env.SECRET" (but this seems to be
                              // overkill for a server that will be running only a short time
    resave: false,            // do not save the session if it's not modified
                              // true is the default, but false is better because if resave=true then
                              // a modification made on the session of the first request by a client
                              // may be overwritten when the second request ends if the two requests 
                              // are close together in time
    saveUninitialized: false, // do not save new sessions that have not been modified
    
    // A cookie is stored in the set cookie HTTP header in the browser. Every time the
    // browser (client) refreshes, the stored cookie will be a part of that request
    cookie: {
        maxAge: oneDay,      // cookies live for just one day at most
        secure: false,       // Enable for HTTP
        httpOnly: true,      // Prevent client-side access to cookies
        sameSite: 'strict'   // Mitigate CSRF attacks
    } //,
    
    //store: new MongoStore({
    //        url: 'mongodb://localhost/session-store'
    //})
});

// app.use defines a middleware function and adds it to the list of "routes" (i.e. middleware functions)
//
// This particular app.use should come first to ensure that every middleware function has access
// to the session information
app.use(sessionMiddleware);

// Add middleware function for logging session data
// The function next() invokes the next middleward function in the list
// Can pass errors on to next (e.g. next(error))
// Can stop the middleware chain by invoking send() or json() and not calling next()
// Can use next('route') to skip remaining route callbacks in the current router
//app.use((req, res, next) => {
//    logger.info('server session log: ', req.session);
//    next();
//});

// from https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
// A cookie with the HttpOnly attribute can't be accessed by JavaScript, 
// for example using Document.cookie; it can only be accessed when it 
// reaches the server. Cookies that persist user sessions for example 
// should have the HttpOnly attribute set — it would be really insecure 
// to make them available to JavaScript. This precaution helps mitigate 
// cross-site scripting (XSS) attacks.

// Load Node.js File System module
var fs = require('fs');

let mywebserver = undefined;
if (gnetum_https) {
    // Load the https module
    const https = require('https');
    
    // Specify location of SSL certificate and private key
    // see https://stackoverflow.com/questions/5998694/how-to-create-an-https-server-in-node-js
    const certDir = "/etc/letsencrypt/live";
    const domain = "gnetum.eeb.uconn.edu";
    const options = {
      key: fs.readFileSync(`${certDir}/${domain}/privkey.pem`),
      cert: fs.readFileSync(`${certDir}/${domain}/fullchain.pem`)
    };
    
    // Create an http server, supplying the express app as the callback function (request handler)
    // app is a function called a requestListener. It handles requests from the user as well
    // as the response back to the user
    mywebserver = https.createServer(options, app).listen(3099, () => {logger.debug("listening on *:3099");});
} else {
    // Load the http module
    const http = require('http');

    // Create an http server, supplying the express app as the callback function (request handler)
    // app is a function called a requestListener. It handles requests from the user as well
    // as the response back to the user
    mywebserver = http.createServer(app).listen(3099, () => {logger.debug("listening on *:3099");});
}

// Load the socket.io module
// (brackets around Server is shorthand for "const Server = require('socket.io').Server"
const { Server } = require("socket.io");

// Load the socket.io-client module
const ioclient = require("socket.io-client").io;

// Create a websocket server. Without this layer, there would be no way to access
// the mywebserver from outside the machine it is running on
// cors = cross origin resource sharing
// const io = new Server(mywebserver, {cors:{origin:"http://192.168.4.55:3099", credentials:true}});
const io = new Server(mywebserver);

// Share the session context with the Socket.IO server
io.engine.use(sessionMiddleware);

// https://expressjs.com/en/guide/routing.html
// Browser set to http://localhost:3099/scatterplot gets to see the plot being built
app.get('/scatterplot', plothandler);

// Browser set to http://localhost:3099/register gets to see the form for submitting
// first name and NetID
app.get('/register', registerhandler);

// Browser set to http://localhost:3099/xtask gets to see the form for submitting
// a user-calculated y value for an assigned x value
app.get('/xtask', xtaskhandler);

// Browser set to http://localhost:3099/yvalue gets to see the response by the server
// after user submits their y value
app.get('/yvalue', yvaluehandler);

// This handler function is called whenever the server gets a request to /register
// Returns contents of file netidform.html, which is a form with a field for first name
// and a field for NetID.
function registerhandler(request, response) {
    // request is an IncomingMessage object (https://www.w3schools.com/nodejs/obj_http_incomingmessage.asp)
    // response is a ServerResponse object (https://www.w3schools.com/nodejs/obj_http_serverresponse.asp)
    var sid = request.sessionID;
    logger.debug('registerhandler called with sid = ' + sid)
    
    // Read the netidform.html file and return its contents to the client who connected
    fs.readFile(__dirname + '/netidform.html', 'utf8',
        // callback function: data is the contents of the netidform.html file
        function(err, data) {
            if (err) {
                // Sends a 500 (Internal Server Error) response to the client
                // https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
                response.writeHead(500);
                return response.end('Error loading netidform.html');
            }
            
            if (test_fname)
                data = data.replace(/__TESTFNAME__/, test_fname)
            if (test_netid)
                data = data.replace(/__TESTNETID__/, test_netid)

            // ServerResponse.writeHead sends status and response headers to the client
            // https://www.geeksforgeeks.org/node-js-response-writehead-method/
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
            // https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
            response.writeHead(200);

            // ServerResponse.end signals that the server should consider that the response is complete
            response.end(data);
        }
    );
}

// This handler function is called whenever the server gets a request to /xtask
// Returns contents of file xtaskform.html, which is a form with header specifying 
// an x value and a form field for supplying a y value
function xtaskhandler(request, response) {
    let freq = Math.random();
    request.session.fname = request.query.fname;
    request.session.netid = request.query.netid;
    request.session.xvalue = freq;
    logger.debug('xtaskhandler called with first = ' + request.session.fname + ' and netid = ' + request.session.netid + '; assigned x = ' + request.session.xvalue.toFixed(3));
    
    // Read the xtask.html file and return its contents to the client who connected
    fs.readFile(__dirname + '/xtaskform.html', 'utf8',
        // callback function: data is the contents of the xtaskform.html file
        function(err, data) {
            if (err) {
                // Sends a 500 (Internal Server Error) response to the client
                // https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
                response.writeHead(500);
                return response.end('Error loading xtaskform.html');
            }
            
            // Replace __PVALUE__ with a random number between 0 and 1
            data = data.replace(/__PVALUE__/, freq.toFixed(3))

            // ServerResponse.writeHead sends status and response headers to the client
            // https://www.geeksforgeeks.org/node-js-response-writehead-method/
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
            // https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
            response.writeHead(200);

            // ServerResponse.end signals that the server should consider that the response is complete
            response.end(data);
        }
    );
}

// This handler function is called whenever the server gets a request to /yvalue
// Returns contents of file feedback.html, which gives the client feedback on the
// y value they submitted
function yvaluehandler(request, response) {
    request.session.yvalue = parseFloat(request.query.yvalue);
    logger.debug('yvaluehandler called with first = ' + request.session.fname + ', netid = ' + request.session.netid + ', x = ' + request.session.xvalue.toFixed(3) + ", y = " + request.session.yvalue.toFixed(3));
    
    let netid = request.session.netid;
    let fname = request.session.fname;
    let x = request.session.xvalue;
    let y = request.session.yvalue;
    let y0 = fx(x);
    netid_clients[netid] = {netid:netid, fname:fname, x:x, y:y, y0:y0 };
    
    // Read the xtask.html file and return its contents to the client who connected
    fs.readFile(__dirname + '/feedback.html', 'utf8',
        // callback function: data is the contents of the feedback.html file
        function(err, data) {
            if (err) {
                // Sends a 500 (Internal Server Error) response to the client
                // https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
                response.writeHead(500);
                return response.end('Error loading xtaskform.html');
            }
            
            // Replace __SUCCESS__ with either "Great!" or "Oops!" depending on how well the client did
            let diff = Math.abs(y - y0);
            let great = (diff < 0.01);
            if (great) {
                data = data.replace(/__SUCCESS__/, "Great!")
            }
            else {
                data = data.replace(/__SUCCESS__/, "Oops!")
            }
            
            // Replace __FEEDBACK__ with actual feedback
            let feedback = "You entered a mean fitness value " + request.session.yvalue.toFixed(3);
            feedback += " for an allele frequency " + request.session.xvalue.toFixed(3) + ".<br/><br/>";
            feedback += "The true y value was " + y0.toFixed(3);
            if (great)
                feedback += ". Congratulations! You got within 0.01 of the right answer.";
            else
                feedback += ", so you were a little off. Please review and contact us if you need help understanding what went wrong.";
            feedback += "<br/><br/>You can go ahead and close your browser at any time.";
                        
            data = data.replace(/__FEEDBACK__/, feedback)

            // ServerResponse.writeHead sends status and response headers to the client
            // https://www.geeksforgeeks.org/node-js-response-writehead-method/
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
            // https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
            response.writeHead(200);

            // ServerResponse.end signals that the server should consider that the response is complete
            response.end(data);
        }
    );
}

// This handler function is called whenever the server gets a request to /scatterplot
// request is an IncomingMessage object (https://www.w3schools.com/nodejs/obj_http_incomingmessage.asp)
// response is a ServerResponse object (https://www.w3schools.com/nodejs/obj_http_serverresponse.asp)
function plothandler(request, response) {
    request.session.netid = "scatterplot";
    var sid = request.sessionID;
    logger.debug('plothandler called with sid = ' + sid)
    
    // Send scatterplot client the contents of the scatterplot.html file
    fs.readFile(__dirname + '/scatterplot.html',
        // callback function: data is the contents of the scatterplot.html file
        function(err, data) {
            if (err) {
                // Sends a 500 (Internal Server Error) response to the client
                // https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
                response.writeHead(500);
                return response.end('Error loading scatterplot.html');
            }

            // ServerResponse.writeHead sends status and response headers to the client
            // https://www.geeksforgeeks.org/node-js-response-writehead-method/
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
            // https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
            response.writeHead(200);
            
            // Replace {{ settings }} with settings object imported from settings.cjs
            //let original_string = data.toString()
            //const axisinfo_json = JSON.stringify(settings.axisinfo);
            //let new_string = original_string.replace(new RegExp(`\\{\\{\\s*settings\\s*\\}\\}`), "let axisinfo = " + axisinfo_json + ";");
            //let modified_data = Buffer.alloc(new_string.length);
            //modified_data.write(new_string);

            // ServerResponse.end signals that the server should consider that the response is complete
            //response.end(modified_data);
            response.end(data);
        }
    );
}

//****************************************************************
//********************** on connection ***************************
//****************************************************************

// Handle a connection from either scatterplot or a client
io.on('connection', function(socket) {
    if (socket.request.session.netid === "scatterplot") {
        logger.debug("server says that scatterplot connected");
    } else {
        logger.debug("server says that a client connected (sid = " + sid + ")");
    }
    
    socket.on('disconnect', () => {
        if (socket.request.session.netid === "scatterplot") {
            logger.debug("server received disconnect message from scatterplot");
            
            // could use "process.exit(0)" to stop the server programmatically here
            // if there was only one plot window
        }
        else {
            logger.debug("server received disconnect message from sid " + sid);
        }
    });
    
    // Handle request to log an error message
    // logger levels: DEBUG < INFO < ERROR
    socket.on('log error', (msg) => {
        logger.error(msg);
    });
    
    // Handle request to log an informational message
    // logger levels: DEBUG < INFO < ERROR
    socket.on('log info', (msg) => {
        logger.info(msg);
    });
    
    // Handle request to log a debugging message
    // logger levels: DEBUG < INFO < ERROR
    socket.on('log debug', (msg) => {
        logger.debug(msg);
    });
    
    socket.on('send points', () => {
        if (socket.request.session.netid === "scatterplot") {
            recreateVertices();
            socket.emit('points', vertices);
        }
    });

    socket.on('clear points', () => {
        if (socket.request.session.netid === "scatterplot") {
            logger.debug("server asked to delete all current clients by scatterplot: no. points cleared = " + vertices.length + ")");
            netid_clients = {};
        }
    });

    socket.on('save data', () => {
        // Save data to file named clients.cjs    
        if (socket.request.session.netid === "scatterplot") {
            logger.debug("server received save data message: creating clients.cjs file");
            let fn = "clients-" + (++nsaves) + ".cjs";
            fs.writeFile(fn, "exports.clients = " + JSON.stringify(netid_clients, null, "\t"), (err) => {
                if (err) {
                    logger.debug("server encountered error while attempting to write clients to clients.cjs file:");
                    logger.error(err);
                }
            });            
        }
    });
    
    // Handle request by phylo for testing registration
    socket.on('fake register', () => {
        logger.debug("server received test register message: creating fake clients for all entries in fakeclients.cjs");
        let nfakeclients = 1; //fakeclients.length;
        for (let i = 0; i < nfakeclients; i++)
            createFakeClient(fakeclients[i], gnetum_https);
    });
            
    // Handle request by phylo to load saved clients
    socket.on('load saved clients', () => {
        logger.debug("server received load saved clients message; loading data from savedclients.cjs");
        netid_clients = savedclients;
    });
            
});