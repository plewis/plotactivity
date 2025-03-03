# Plotting Activity

Node.js client-server classroom activity allowing students to participate in plotting a function

This is a work in progress. Documentation will be created once everything has been tested.

Initialize Node.js project

    npm init -y

Edit _package.json_ file to look like this:

    {
      "name": "plotactivity",
      "version": "1.0.0",
      "description": "Node.js client-server classroom activity allowing students to participate in plotting a function",
      "main": "server.js",
      "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1",
        "start": "node server.js"
      },
      "repository": {
        "type": "git",
        "url": "git+https://github.com/plewis/plotactivity.git"
      },
      "keywords": [],
      "author": "Paul O. Lewis",
      "license": "ISC",
      "bugs": {
        "url": "https://github.com/plewis/plotactivity/issues"
      },
      "homepage": "https://github.com/plewis/plotactivity#readme"
    }

Install dependencies:

    npm install express express-session http https log4js socket.io socket.io-client
    
Generate fake clients for testing:

    cd scripts
    python3 gen-fake-clients.py
    mv fakeclients.cjs ..
    cd ..
    
Generate fake data for testing:

    cd scripts
    python3 gen-saved-data.py
    mv saveddata.cjs ..
    cd ..
    
Start server:

    npm start
