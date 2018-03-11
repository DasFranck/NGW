import csv
import requests

from rdflib import Graph, Literal, BNode, RDF, Namespace
from rdflib.namespace import OWL, DC, FOAF

def store_triples(tsv_content):
    DBO = Namespace('http://dbpedia.org/ontology/')
    GEO = Namespace('http://www.w3.org/2003/01/geo/wgs84_pos#')
    SCHEMA = Namespace('http://schema.org/')
    NGW = Namespace('local:ngwproject:')

    store = Graph()
    store.bind("owl", OWL)
    store.bind("dc", DC)
    store.bind("foaf", FOAF)
    store.bind("dbo", DBO)
    store.bind("geo", GEO)
    store.bind("schema", SCHEMA)
    store.bind("ngw", NGW)

    for hospital in tsv_content:
        node = BNode()
        store.add((node, RDF.type, SCHEMA.Organisation))
        store.add((node, NGW["organisationID"], Literal(hospital[0])))
        store.add((node, NGW["organisationCode"], Literal(hospital[1])))
        store.add((node, NGW["organisationType"], Literal(hospital[2])))
        store.add((node, NGW["organisationSubType"], Literal(hospital[3])))
        store.add((node, NGW["organisationSector"], Literal(hospital[4])))
        store.add((node, DBO.status, Literal(hospital[5])))
        store.add((node, NGW["isPimsManaged"], Literal(hospital[6])))
        store.add((node, DBO.name, Literal(hospital[7])))
        store.add((node, NGW["address1"], Literal(hospital[8])))
        store.add((node, NGW["address2"], Literal(hospital[9])))
        store.add((node, NGW["address3"], Literal(hospital[10])))
        store.add((node, DBO.city, Literal(hospital[11])))
        store.add((node, DBO.county, Literal(hospital[12])))
        store.add((node, DBO.postalCode, Literal(hospital[13])))
        store.add((node, GEO.latitude, Literal(hospital[14])))
        store.add((node, GEO.longitude, Literal(hospital[15])))
        store.add((node, NGW["parentODSCode"], Literal(hospital[16])))
        store.add((node, NGW["parentName"], Literal(hospital[17])))
        store.add((node, FOAF.phone, Literal(hospital[18])))
        store.add((node, FOAF.email, Literal(hospital[19])))
        store.add((node, FOAF.homepage, Literal(hospital[20])))
        store.add((node, SCHEMA.faxNumber, Literal(hospital[21])))

    print("--- printing raw triples ---")
    for s, p, o in store:
        print(s, p, o)

    with open("results.ttl", mode='wb') as fd:
        fd.write(store.serialize(format="turtle", encoding="utf-8"))

def get_tsv(csv_url):
    with requests.Session() as s:
        download = s.get(csv_url)

        try:
            decoded_content = download.content.decode('utf-8')
        except:
            decoded_content = download.content.decode('cp1252')

        tr = csv.reader(decoded_content.splitlines(), delimiter='\t')
    return list(tr)
 

def main(CSV_URL="http://data.gov.uk/data/resource/nhschoices/Hospital.csv"):
    tsv_content = get_tsv(CSV_URL)
#   for row in tsv_content:
#        print(row)    
    print(tsv_content[0])
    print(tsv_content[1])
    print(len(tsv_content))
    store_triples(tsv_content)


if __name__ == '__main__':
    main()