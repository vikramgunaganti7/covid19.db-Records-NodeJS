const express = require('express')
const app = express()

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initlizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running in http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initlizeDBAndServer()
app.use(express.json())
module.exports = app

const convertDbObjectToResponseObjectState = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}
const convertDbObjectToResponseObjectDistrict = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}
app.get('/states/', async (request, response) => {
  const getDetailsOfAllStates = `
    SELECT *
    FROM 
    state;`
  const dbResponse = await db.all(getDetailsOfAllStates)
  response.send(
    dbResponse.map(allStates =>
      convertDbObjectToResponseObjectState(allStates),
    ),
  )
})
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const stateDetails = `
  SELECT *
  FROM 
  state
  WHERE
  state_id=${stateId};`
  const dbStateDetails = await db.get(stateDetails)
  response.send(dbStateDetails)
})

app.post('/districts/', async (request, response) => {
  const requestBody = request.body
  const {districtName, stateId, cases, cured, active, deaths} = requestBody
  const insertQuery = `
  INSERT INTO
  district (district_name, state_id, cases, cured, active, deaths)
  VALUES ('${districtName}', ${stateId}, ${cases},${cured}, ${active}, ${deaths});`
  await db.run(insertQuery)
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districDetails = `
  SELECT *
  FROM district
  WHERE
  district_id=${districtId};`
  const responseStateDetails = await db.get(districDetails)
  response.send(responseStateDetails)
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrict = `
  DELETE 
  FROM 
  district
  WHERE 
  district_id=${districtId};`
  await db.run(deleteDistrict)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateQuery = `
  UPDATE district
  SET 
  district_name='${districtName}',
  state_id=${stateId},
  cases=${cases},
  cured=${cured},
  active=${active},
  deaths=${deaths}
  WHERE 
  district_id=${districtId};`
  await db.run(updateQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const gettingStatesStats = `
  SELECT 
  SUM(cases),
  SUM(cured),
  SUM(active),
  SUM(deaths)
  FROM 
  district 
  WHERE 
  state_id=${stateId};`
  const stats = await db.get(gettingStatesStats)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})
app.use(express.json())
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
    select state_id from district
    where district_id = ${districtId};`
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery)
  const getStateNameQuery = `
    select state_name as stateName from state
    where state_id = ${getDistrictIdQueryResponse.state_id};`
  const getStateNameQueryResponse = await db.get(getStateNameQuery)
  response.send(getStateNameQueryResponse)
})
