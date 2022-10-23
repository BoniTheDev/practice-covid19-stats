const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

app.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});

let database = null;
const intializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (e) {
    console.log(`DB Eroor: ${e.message}`);
    process.exit(1);
  }
};
intializeDbAndServer();

const eachStateDbIntoStateResponse = (eachStateDb) => {
  return {
    stateId: eachStateDb.state_id,
    stateName: eachStateDb.state_name,
    population: eachStateDb.population,
  };
};

// Get States API

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
                         SELECT
                            * 
                         FROM 
                           state;`;
  const getStatesArray = await database.all(getStatesQuery);
  response.send(
    getStatesArray.map((eachStateDb) =>
      eachStateDbIntoStateResponse(eachStateDb)
    )
  );
});

// Get a State API

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
                         SELECT
                            * 
                         FROM 
                           state
                         WHERE 
                          state_id = ${stateId};`;
  const getSateDb = await database.get(getStateQuery);
  response.send(eachStateDbIntoStateResponse(getSateDb));
});

// Create District API
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `
                      INSERT INTO
                          district (district_name,state_id,cases,cured,active,deaths)
                      VALUES
                       ('${districtName}', ${stateId}, '${cases}', ${cured},'${active}','${deaths}');`;
  const newDistrict = await database.run(createDistrictQuery);
  response.send("District Successfully Added");
});

//Get a District API
const convertDistrictDbToResponse = (getDistrictDb) => {
  return {
    districtId: getDistrictDb.district_id,
    districtName: getDistrictDb.district_name,
    stateId: getDistrictDb.state_id,
    cases: getDistrictDb.cases,
    cured: getDistrictDb.cured,
    active: getDistrictDb.active,
    deaths: getDistrictDb.deaths,
  };
};

app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetailsQuery = `
                                   SELECT 
                                       * 
                                    FROM 
                                       district
                                    WHERE 
                                      district_id = ${districtId};`;
  const getDistrictDb = await database.get(getDistrictDetailsQuery);
  response.send(convertDistrictDbToResponse(getDistrictDb));
});

// Delete District API

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId};`;
  await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

// Update District API

app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
                      UPDATE
                          district 
                      SET
                       district_name = '${districtName}',
                        state_id = '${stateId}',
                        cases = '${cases}',
                        cured = '${cured}',
                        active = '${active}',
                        deaths = '${deaths}'
                      WHERE 
                       district_id = ${districtId};`;
  const updatedDistrict = await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// Get Specific State id API
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  //console.log(stateId);
  const getStateSpecificQuery = `
                                SELECT 
                                   SUM(cases) AS totalCases,
                                   SUM(cured) AS totalCured,
                                   SUM(active) AS totalActive,
                                   SUM(deaths) AS totalDeaths
                                 FROM 
                                    district NATURAL JOIN state
                                 WHERE 
                                    state_id = ${stateId};`;

  const getSpecificDistrict = await database.get(getStateSpecificQuery);
  response.send(getSpecificDistrict);
});

// Get StateName API
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getSpecificStateName = `
                                SELECT 
                                   state_name AS stateName
                                 FROM 
                                    district NATURAL JOIN state
                                 WHERE 
                                    district_id = ${districtId};`;

  const getStateName = await database.get(getSpecificStateName);
  response.send(getStateName);
});

module.exports = app;
