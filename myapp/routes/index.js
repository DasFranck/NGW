const { Connection, query } = require('stardog');

var fetch = require('isomorphic-fetch')
var SparqlHttp = require('sparql-http-client')
SparqlHttp.fetch = fetch

var endpoint_dbpedia = new SparqlHttp({endpointUrl: 'http://dbpedia.org/sparql'})
var endpoint_linkedgeodata = new SparqlHttp({endpointUrl: 'http://linkedgeodata.org/sparql'})

var express = require('express');
var router = express.Router();

const conn = new Connection({
  username: 'admin',
  password: 'admin',
  endpoint: 'http://localhost:5820',
});

/* GET home page. */
router.get('/', function(req, res, next) {
  query.execute(conn, 'ngw_project', 'PREFIX ngw: <local:ngwproject:> PREFIX schema: <http://schema.org/> PREFIX dbo: <http://dbpedia.org/ontology/> PREFIX foaf: <http://xmlns.com/foaf/0.1/> SELECT ?Code ?Name ?Contact_Mail ?Contact_Phone WHERE { ?Org a schema:Organisation . ?Org ngw:organisationCode ?Code . ?Org dbo:name ?Name . OPTIONAL { ?Org foaf:email ?Contact_Mail . ?Org foaf:phone ?Contact_Phone } } ORDER BY asc(?Code)'
  ).then(({ body }) => {
    var results = body.results.bindings;
    res.render('index', { title: 'NGW_Project', hospital: results });
  })
});

router.get('/hospitals/:id', function(req, res, next) {
  var hospital_id = req.params.id;

  query.execute(conn, 'ngw_project', `PREFIX ngw: <local:ngwproject:> PREFIX schema: <http://schema.org/> PREFIX foaf: <http://xmlns.com/foaf/0.1/> PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> PREFIX dbo: <http://dbpedia.org/ontology/> SELECT ?Code ?ID ?Name ?Sector ?Category ?Parent_Code ?Parent_Name ?Contact_Mail ?Contact_Phone ?Contact_Website ?Addr_Line1 ?Addr_Line2 ?Addr_Line3 ?Addr_Code ?Addr_City ?Addr_County ?Geo_Lat ?Geo_Lon ?Mod_Name WHERE { ?Org a schema:Organisation . ?Org ngw:organisationCode ?Code . ?Org ngw:organisationID ?ID . ?Org dbo:name ?Name . ?Org ngw:organisationSector ?Sector . ?Org ngw:organisationSubType ?Category . ?Org ngw:parentODSCode ?Parent_Code . ?Org ngw:parentName ?Parent_Name . OPTIONAL { ?Org foaf:email ?Contact_Mail . ?Org foaf:phone ?Contact_Phone . ?Org foaf:homepage ?Contact_Website . ?Org ngw:address1 ?Addr_Line1 . ?Org ngw:address2 ?Addr_Line2 . ?Org ngw:address3 ?Addr_Line3 . ?Org dbo:postalCode ?Addr_Code . ?Org dbo:city ?Addr_City . ?Org dbo:county ?Addr_County . ?Org geo:latitude ?Geo_Lat . ?Org geo:longitude ?Geo_Lon . } BIND(REPLACE(?Name, " ", "_") AS ?Cut_Name) . BIND(REPLACE(?Cut_Name, ",", "") AS ?Mod_Name) . FILTER (?Code = "${hospital_id}") }`
  ).then(({ body }) => {
    if (body != null)
      var result_stardog = body.results.bindings[0];
    else
      var result_stardog = {}

    var custnom_name = result_stardog.Mod_Name.value.replace("(", "").replace(")", "").replace("'", "")

    endpoint_dbpedia.selectQuery(`PREFIX dbr: <http://dbpedia.org/resource/> PREFIX dbo: <http://dbpedia.org/ontology/> PREFIX dbp: <http://dbpedia.org/property/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> SELECT ?Abstract ?BedCount ?Founded WHERE { OPTIONAL { dbr:${custnom_name} dbo:abstract ?Abstract } . OPTIONAL { dbr:${custnom_name} dbo:bedCount ?BedCount } . OPTIONAL { dbr:${custnom_name} dbr:founded ?Founded } }`
    ).then(function (res) {
      return res.json()
    }).then(function (body_dbpedia) {
      if (body_dbpedia != null)
        result_dbpedia = body_dbpedia.results.bindings[0]
      else
        result_dbpedia = {}
      endpoint_linkedgeodata.selectQuery(`Prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> Prefix ogc: <http://www.opengis.net/ont/geosparql#> Prefix geom: <http://geovocab.org/geometry#> Prefix lgdo: <http://linkedgeodata.org/ontology/> Select ?l ?lon ?lat From <http://linkedgeodata.org> { ?s a lgdo:Amenity ; rdfs:label ?l ; geom:geometry [ ogc:asWKT ?g ] . FILTER( REGEX(?l, "(pharmacy|chemist)", "i")) . FILTER(bif:st_intersects (?g, bif:st_point (${result_stardog.Geo_Lon.value}, ${result_stardog.Geo_Lat.value}), 1.2)) . FILTER( REGEX(str(?g), "point", "i")) . BIND(STRBEFORE(STRAFTER(str(?g), "POINT("), " ") AS ?lon) . BIND(STRAFTER(STRBEFORE(str(?g), ")"), " ") AS ?lat) }`
      ).then(function (res) {
        return res.json()
      }).then(function (body_linkedgeodata) {
        if (body_linkedgeodata != null)
          result_linkedgeodata = body_linkedgeodata.results.bindings
        else
          result_linkedgeodata = {}
        console.log(result_linkedgeodata)
        res.render('hospital', {title: hospital_id, hospital_id: hospital_id, hospital: result_stardog, hospital_dbpedia: result_dbpedia, hospital_lgd: result_linkedgeodata, custnom_name: custnom_name});
      })
    })
  })
});

module.exports = router;