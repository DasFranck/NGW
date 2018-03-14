const { Connection, query } = require('stardog');

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
  query.execute(conn, 'ngw_project', `PREFIX ngw: <local:ngwproject:> PREFIX schema: <http://schema.org/> PREFIX dbo: <http://dbpedia.org/ontology/> SELECT ?Code ?Name ?Sector ?Category ?Parent_Code ?Parent_Name ?Contact_Mail ?Contact_Phone ?Contact_Website ?Addr_Line1 ?Addr_Line2 ?Addr_Line3 ?Addr_Code ?Addr_City ?Addr_County WHERE { ?Org a schema:Organisation . ?Org ngw:organisationCode ?Code . ?Org dbo:name ?Name . ?Org ngw:organisationSector ?Sector . ?Org ngw:organisationSubType ?Category . ?Org ngw:parentODSCode ?Parent_Code . ?Org ngw:parentName ?Parent_Name . OPTIONAL { ?Org foaf:email ?Contact_Mail . ?Org foaf:phone ?Contact_Phone . ?Org foaf:homepage ?Contact_Website . ?Org ngw:address1 ?Addr_Line1 . ?Org ngw:address2 ?Addr_Line2 . ?Org ngw:address3 ?Addr_Line3 . ?Org dbo:postalCode ?Addr_Code . ?Org dbo:city ?Addr_City . ?Org dbo:county ?Addr_County . } FILTER (?Code = "${hospital_id}") }`
  ).then(({ body }) => {
    var results = body.results.bindings;
    console.log(results);
    res.render('hospital', {title: hospital_id, hospital_id: hospital_id, hospital: results});
  })
});

module.exports = router;