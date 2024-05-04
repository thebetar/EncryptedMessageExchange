# Welcome to this project

This project aims to create a message exchange service which utilises distributed systems which runs replicas of the server and database layer.
Messages will also be encrypted before and decrypted after send, obfuscating the information sent.

## How to run

To run this project some tools are needed which are:

-   npm
-   docker

To run this project follow the steps below (with docker compose):

-   Navigate to the client folder using `cd client`
-   Install all npm dependencies using `npm install`
-   Build the client using `npm run build`
-   Navigate back to the root using `cd ..`
-   Build the docker containers using `docker compose build`
-   Start the docker containers using `docker compose up -d`
-   Marvel at the wonders of this applications

To run this project in development mode follow the following steps

-   Start the redis docker container using `docker run --publish=6379:6379 --name=ressilient-hosting-db -d redis`
-   Navigate to the client folder using `cd client`
-   Install all npm dependencies using `npm install`
-   Run the client using `npm run dev`
-   Open a new terminal
-   Navigate back to the server using `cd server`
-   Install all npm dependencies using `npm install`
-   Run the client using `npm run dev`

## Todos

-   [ ] Check if all requests are correctly send to all replicas (from different users)
-   [ ] Check if keys are correctly stored and shared
-   [ ] Check if encryption and decryption works successfully over the replications
-   [ ] Check if websockets work well over replication
