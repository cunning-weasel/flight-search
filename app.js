const Amadeus = require("amadeus");
const express = require("express");
require("dotenv").config();

// initialize express app and amadeus SDK
const app = express();
const amadeus = new Amadeus({
  clientId: process.env.API_KEY,
  clientSecret: process.env.API_SECRET,
});

const port = 3000;

// static middleware func to serve frontend files
app.use(express.static("public"));

// autocomplete location names endpoint
// https://developers.amadeus.com/self-service/category/air/api-doc/airport-and-city-search
app.get("/api/autocomplete", async (req, res) => {
  try {
    const { query } = req;
    const { data } = await amadeus.referenceData.locations.get({
      keyword: query.keyword,
      subType: Amadeus.location.city,
    });
    res.json(data);
  } catch (error) {
    console.error(error.res);
    res.json([]);
  }
});

// search flight offers endpoint
// https://developers.amadeus.com/self-service/category/air/api-doc/flight-offers-search
app.get("/api/search", async (req, res) => {
  try {
    const { query } = req;
    console.log(query);
    const { data } = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: query.origin,
      destinationLocationCode: query.destination,
      departureDate: query.departureDate,
      adults: query.adults,
      children: query.children,
      infants: query.infants,
      travelClass: query.travelClass,
      // when returnDate isn't provided, API inteprets that
      // as a one-way flight, otherwise it's a roundtrip
      ...(query.returnDate ? { returnDate: query.returnDate } : {}),
    });
    // check out res from amadeus api - need to implement 
    // backend pagination, also to avoid api limits
    console.log(data.slice(0, 2));
    res.json(data);
  } catch (error) {
    console.error(error.res);
    res.json([]);
    console.log(res.json());
  }
});

// start server
app.listen(port, () => {
  console.log(
    `🐃🐃 Nyati search-app listening at ➡️ http://localhost:${port} ⬅️`
  );
});
