// Creates a fake client that simulates the action of a person
// If gnetum_https is true, connects to 
//    https://gnetum.eeb.uconn.edu:3099
// otherwise, connects to 
//    http://localhost:3099
const createFakeClient = (data, gnetum_https) => {
    var my_netid           = data.netid;
    var my_fname           = data.fname;
    
    // Proportion of clients who accidentally close their window before submitting netid
    const prob_fail_early = 0.0;  

    // Proportion of clients who accidentally close their window before submitting netid
    const prob_fail_late = 0.0;  
    
    // Create client socket
    const clisock = ioclient(gnetum_https ? "https://gnetum.eeb.uconn.edu:3099" : "http://localhost:3099", { 
        autoConnect: false, 
        transports: ['websocket'], query: { scatterplot:false } 
        });
        
    // Simulate client accessing the server to register
    const netidform = clisock.connect("/register");
    console.log(netidform);
}   

module.exports = createFakeClient;
