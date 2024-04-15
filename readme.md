# Welcome to this project

This project aims to create a message exchange service which utilises distributed systems which runs replicas of the server and database layer.
Messages will also be encrypted before and decrypted after send, obfuscating the information sent.

## How to run

To run this project some tools are needed which are:

-   npm
-   docker

To run this project follow the steps below:

-   Navigate to the client folder using `cd client`
-   Install all npm dependencies using `npm install`
-   Build the client using `npm run build`
-   Navigate back to the root using `cd ..`
-   Build the docker containers using `docker compose build`
-   Start the docker containers using `docker compose up -d`
-   Marvel at the wonders of this applications
