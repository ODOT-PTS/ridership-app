# Ridership App

Visualize transit ridership data. Ridership App is a webapp that loads transit ridership data in [GTFS-Ride](https://gtfsride.org) format and creates web-based visualization and data exports.

It is built with [next.js](https://nextjs.org).

<img width="1564" alt="" src="https://user-images.githubusercontent.com/96217/134407005-12a145b7-f892-4067-a812-28d8eec7f6e2.png">

The app supports graphing, mapping, aggregating and exporting data as CSV format. Ridership data can be grouped by:

- Route
- Day
- Day of Week
- Weekday vs Sat vs Sun
- Time of day
- Trip
- Stop

<img width="971" alt="" src="https://user-images.githubusercontent.com/96217/134409974-54f7dd25-cbc8-474d-b997-cdfc6218788b.png">
>

## Setup

Install node.js https://nodejs.org/en/download/

Download the Ridership app code:

    git clone https://github.com/ODOT-PTS/ridership-app.git

OR download https://github.com/ODOT-PTS/ridership-app/archive/refs/heads/main.zip

Install dependencies:

    npm install

## Configuration

Create a `.env` file based off of `.env-example`

    cp .env-example .env

Add values for `SQLITE_PATH` and `NEXT_PUBLIC_REACT_APP_MAPBOX_ACCESS_TOKEN`.

`SQLITE_PATH` should be the path to a SQLite file of imported GTFS-Ride data, created using [node-gtfs-ride](https://github.com/ODOT-PTS/node-gtfs-ride). For example, `~/Documents/sqlite/gtfs-ride`.

`NEXT_PUBLIC_REACT_APP_MAPBOX_ACCESS_TOKEN` should be a mapbox access token for use in generating maps. [Signup and get a free Mapbox account](https://docs.mapbox.com/help/getting-started/access-tokens/) and generate an access token.

## Import Data

Import GTFS Ride data to be visualized into a sqlite database. You can use the [node-gtfs-ride](https://github.com/ODOT-PTS/node-gtfs-ride) tool to create GTFS ride data or the [node-gtfs] tool to import existing GTFS ride data.

When importing, be sure to use the same `SQLITE_PATH` to the local database.

### Create GTFS-Ride data with `node-gtfs-ride`

    npm install gtfs-ride -g

    gtfs-ride --gtfsPath /path/to/gtfs --apcPath /path/to/apc/data.csv

See full [documentation of node-gtfs-ride](https://github.com/ODOT-PTS/node-gtfs-ride).

### Import existing GTFS-Ride data to SQLite with `node-gtfs`

    npm install gtfs -g

    gtfs-import --gtfsPath /path/to/your/unzipped/gtfs-ride-data

See full [documentaion of node-gtfs](https://github.com/BlinkTagInc/node-gtfs).

## Running Locally

Run the development server:

    npm run dev

Open [http://localhost:3000](http://localhost:3000) with your browser to use the app.

## Running in production

    pm2 npm run start
