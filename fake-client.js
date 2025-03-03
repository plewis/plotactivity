//****************************************************************
//******************** createFakeClient **************************
//****************************************************************

// possibly relevant: 
//  https://stackoverflow.com/questions/62040945/how-to-access-client-socket-id-from-the-http-request
//  https://stackoverflow.com/questions/6913801/sending-message-to-specific-client-with-socket-io-and-empty-message-queue

// Creates a fake client that simulates the action of a person
// accessing http://localhost:3099/register
// https://www.geeksforgeeks.org/session-cookies-in-node-js/
// https://gist.github.com/jfromaniello/4087861
// https://chrislarson.me/blog/headless-client-connection-socketio-and-authenticated-passport.html
const createFakeClient = (data) => {
    var my_netid           = data.netid;
    var my_fname           = data.fname;
    var student_registered = false;
    var periodInMilliseconds = 100; // determines how long between heartbeats
    var timeoutId = -1;
    
    // Proportion of clients who accidentally close their window before submitting netid
    const prob_fail_early = 0.0;  

    // Proportion of clients who accidentally close their window before submitting netid
    const prob_fail_late = 0.0;  
    
    // Create client socket
    const clisock = ioclient("http://localhost:3099", { 
        autoConnect: false, 
        transports: ['websocket'], query: { scatterplot:false } 
        });
        
    // Simulate client accessing the server to register
    clisock.connect("/register");

    // Log disconnects
    clisock.on("disconnect", (reason) => {
        logger.debug("fake client received disconnect message: " + reason);
    });

    // Handle connect message sent by server in response to registering
    clisock.on("connect", () => {
        logger.debug("fake client received connect message");

        if (Math.random() < prob_fail_early) {
            logger.debug("fake client disconnected before submitting netid");
            clisock.disconnect();
        }
        
        logger.debug("fake client sending student name (" + my_fname + ") and netid (" + my_netid + ") to server");
        clisock.emit('student netid',{
            fname:my_fname,
            netid:my_netid
        });
        
        // Every periodInMilliseconds milliseconds, a heartbeat message will be 
        // sent and is the signal used by client to poke the server for a task
        var heartbeat = function() {
            clisock.emit('need task');
            timeoutId = setTimeout(heartbeat, periodInMilliseconds);
        };
    
        // Send need task message to server periodically
        timeoutId = setTimeout(heartbeat, periodInMilliseconds);
    });
    
    clisock.on("connect_error", (err) => {
        logger.debug("fake client received connect_error message");
        if (clisock.active) {
            // temporary failure, the socket will automatically try to reconnect
            logger.debug("temporary socket failure");
        } else {
            // the connection was denied by the server
            // in that case, `socket.connect()` must be manually called in order to reconnect
            logger.debug("socket error:");
            logger.debug(err.message);
        }
    });
        
    clisock.on('plot task', (p) => {
        // Just received instructions from server for this student
        logger.debug("fake client received plot task message (p = " + p + ")");
        if (Math.random() < prob_fail_late) {
            logger.debug("fake client disconnected before submitting sequence");
            clisock.disconnect();
        }

        // If server is sending a task, it means server previously received and stored the student's netid
        student_registered = true;
                
        // Calculate the mean fitness for the beta-hemoglobin gene (balancing selection)
        // for the value of p sent to us by the server
        // p = frequency of the S (sickle-cell) allele
        // q = frequency of the A (normal) allele
        // Selection coefficients from p. 121 in Futuyma and Fitzpatrick 4th ed.
        // Genotype  Frequency  Fitness  Description
        // --------  ---------  -------  ----------------------
        //       SS        p^2     0.14  sickle cell disease 
        //       SA      2*p*q      1.0  sickle cell trait
        //       AA        q^2     0.88  susceptible to malaria
        // --------  ---------  -------  ----------------------
        
        
        let f = p*p*0.14 + 2*p*(1-p)*1 + (1-p)*(1-p)*0.88;
        clisock.emit('student answer', {'myanswer':f, 'correctanswer':f});
        clearTimeout(timeoutId);
        timeoutID = -1;
    });
    
    clisock.on('dejavu', () => {
        // server had a problem with the submission of the netid
        logger.debug("fake client received dejavu message");
        
        // student remains unregistered
        student_registered = false;
    });
    
    clisock.on('error response', (data) => {
        // server had a problem with the submission of the netid
        logger.debug("fake client received error response message");
        
        // student remains unregistered
        student_registered = false;
        
        // Show the message sent by server
        logger.debug(data);
    });
    
    clisock.on("go away", () => {
        logger.debug("fake client received go away message: id " + clisock.id);
        clisock.disconnect();
    });
}   

module.exports = createFakeClient;
