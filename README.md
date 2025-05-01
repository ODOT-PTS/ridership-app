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

Create a `config.json` file based off of `config-example.json`

    cp config-example.json config.json

Add values for `databases`.

`databases` should be an array of objects that contain the path to a SQLite file of imported GTFS-Ride data, created using [node-gtfs-ride](https://github.com/ODOT-PTS/node-gtfs-ride). For example, 

```json
{
    "sqlitePath": "~/Documents/sqlite/gtfs-ride",
    "startDate": "2024-02-01",
    "endDate": "2024-02-25"
}
```

## Import Data

Import GTFS Ride data to be visualized into a sqlite database. You can use the [node-gtfs-ride](https://github.com/ODOT-PTS/node-gtfs-ride) tool to create GTFS ride data or the [node-gtfs] tool to import existing GTFS ride data.

When importing, be sure to use the same path to the local database.

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

    pm2 start npm --name "ridership" -- start
