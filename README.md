# Lines

A simple web service to upload txt files and get some statistics

## Quick start

To install requirements `npm i`

The service uses [redis](https://redis.io/) to store the data, consequently you should have available connection to the db.

To start server `npm start`

There are some available environmental variables to set up the server:

- PORT – web server port (default `3000`)
- UPLOAD_DESTINATION – file upload destination (default `./uploads`)
- REDIS_URL – redis connection URL (default `redis://127.0.0.1:6379`)

Example: `PORT=3001 npm start`

When the server starts, there will be the home page at `http://localhost:3000`.

## API Reference

`POST /upload` – Receives `multipart/form-data` form with txt files

`GET /line/random?reversed=1` – Returns random line (and some extra data for `application/*` request). `reversed` param for reverse the line

`GET /line/longest` – Returns 100 the longest lines

`GET /line/longest/file` – Returns 20 the longest lines of random file