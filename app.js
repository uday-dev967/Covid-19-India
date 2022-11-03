const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbpath = path.join(__dirname, "covid19India.db");

let db = null;

const initalizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server is running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initalizeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// ### GET API 1

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
        SELECT
            *
        FROM 
            state;`;
  const allStatesArray = await db.all(getStatesQuery);
  const obj = allStatesArray.map((state) =>
    convertDbObjectToResponseObject(state)
  );
  response.send(obj);
});

//### GET API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
        SELECT
            *
        FROM 
            state
        WHERE 
            state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  const obj = convertDbObjectToResponseObject(state);
  console.log(obj);
  response.send(obj);
});

//### POST API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
    INSERT INTO
        district (district_name,state_id,cases,cured,active,deaths)
    VALUES
        ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const newDistrict = await db.run(addDistrictQuery);
  const districtId = newDistrict.lastId;
  //   console.log(districtId);
  //   console.log(newDistrict);
  response.send("District Successfully Added");
});

// ### GET API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  console.log(districtId);
  const getDistrictQuery = `
        SELECT
            *
        FROM 
            district
        WHERE 
            district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  const obj = convertDbObjectToResponseObject(district);
  console.log(obj);
  response.send(obj);
});

//### DELETE API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM
        district
    WHERE
        district_id = ${districtId};`;
  const removeDistrict = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// ### PUT API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
      UPDATE 
        district
      SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
      WHERE 
        district_id = ${districtId};`;
  const updatedDistrict = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// ### GET API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
        SELECT
            SUM(cases) as totalCases,
            SUM(cured) as totalCured,
            SUM(active) as totalActive,
            SUM(deaths) as totalDeaths
        FROM
            district
        WHERE 
            state_id = ${stateId};`;
  const stats = await db.get(getStateStatsQuery);
  console.log(stats);
  response.send(stats);
});

// ### GET API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNamesQuery = `
        SELECT state_name
        FROM state
        LEFT JOIN district
            ON state.state_id = district.state_id
        WHERE district_id = ${districtId};`;
  const details = await db.get(getStateNamesQuery);
  const obj = convertDbObjectToResponseObject(details);
  console.log(obj);
  response.send(obj);
});

module.exports = app;
