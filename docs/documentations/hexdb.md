### RESTful

Aircraft Information

##### Endpoint

GET `https://hexdb.io/api/v1/aircraft/{hex}`

---

##### Examples

GET `https://hexdb.io/api/v1/aircraft/4010ee`

Response

`{"ICAOTypeCode":"A319","Manufacturer":"Airbus","ModeS":"4010EE","OperatorFlagCode":"EZY","RegisteredOwners":"easyJet Airline","Registration":"G-EZBZ","Type":"A319 111"}`

GET `https://hexdb.io/api/v1/aircraft/000000`

Response

`{"status":"404","error":"Aircraft not found."}`

Route Information

##### Endpoint

GET `https://hexdb.io/api/v1/route/**icao**/{callsign}`

GET `https://hexdb.io/api/v1/route/**iata**/{callsign}`

---

##### Examples

GET `https://hexdb.io/api/v1/route/icao/EIN17A`

Response

`{"flight":"EIN17A","route":"EIDW-EGLL","updatetime":1397991739}`

GET `https://hexdb.io/api/v1/route/icao/ABC123`

Response

`{"status":"404","error":"Route not found."}`

Airport Information

##### Endpoint

GET `https://hexdb.io/api/v1/airport/**icao**/{icao}`

GET `https://hexdb.io/api/v1/airport/**iata**/{iata}`

---

##### Examples

GET `https://hexdb.io/api/v1/airport/icao/EGLL`

Response

`{"airport":"Heathrow Airport","country_code":"GB","iata":"LHR","icao":"EGLL","latitude":51.4706,"longitude":-0.461941,"region_name":"England"}`

GET `https://hexdb.io/api/v1/airport/icao/AAAA`

Response

`{"status":"404","error":"Airport not found."}`
