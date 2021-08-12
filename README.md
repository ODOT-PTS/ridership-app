# Ridership App

This is a node.js app built with next.js for visualizing and analyzing ridership data in [GTFS-Ride](http://gtfs-ride.org) format.

## Setup

Install node.js https://nodejs.org/en/download/

Install dependencies:

    npm install

## Configuration

Create a `.env` file based off of `.env-example`

    cp .env-example .env

Add values for `SQLITE_PATH` and `NEXT_PUBLIC_REACT_APP_MAPBOX_ACCESS_TOKEN`.

`SQLITE_PATH` should be the path to a SQLite file of imported GTFS-Ride data, created using [node-gtfs-ride](https://github.com/ODOT-PTS/node-gtfs-ride).  For example, `~/Documents/sqlite/gtfs-ride`.

`NEXT_PUBLIC_REACT_APP_MAPBOX_ACCESS_TOKEN` should be a mapbox access token for use in generating maps. [Signup and get a free Mapbox account](https://docs.mapbox.com/help/getting-started/access-tokens/) and generate an access token. 

## Running Locally

Run the development server:

    npm run dev

Open [http://localhost:3000](http://localhost:3000) with your browser to use the app.


## Running in production


pm2 start server.mjs --node-args="--max-old-space-size=6144"
