import sys
import os
import csv
import json
import argparse
import codecs

DEFAULT_INPUT_FILE = r'..\..\data_in\uc.csv'
DEFAULT_OUTPUT_FILE = r'..\..\app\data\uc.json'

#-------------------------------------------------------------------------------
# Base-Class Candidate Routines
#-------------------------------------------------------------------------------

def safeRead(d, key):
    return d[key] if key in d else ''

def atomizeTags(tags):
    return [t for t in tags.split(',')] if len(tags) != 0 else ''

def atomizeLinks(s):
    return [l for l in s.split('\n')] if len(s) != 0 else []

def queueUpstreamLinks(queue, row, linkType):
    for l in atomizeLinks(safeRead(row, linkType)):
        source, name = l.split(':', 1)
        queue.append({
            'source': int(source),
            'target': int(row['id']),
            'name': name,
            'type': linkType
            })

def queueDownstreamLinks(queue, row, linkType):
    for l in atomizeLinks(safeRead(row, linkType)):
        target, name = l.split(':', 1)
        queue.append({
            'source': int(row['id']),
            'target': int(target),
            'name': name,
            'type': linkType
            })
#-------------------------------------------------------------------------------
# Class
#-------------------------------------------------------------------------------

class TransformUseCase:
    def __init__(self):
        self.nodes = {}
        self.links = []
        self.linkQueue = []

    def run(self, inFile):
        for row in csv.DictReader(inFile):
            (k,v) = self.mapNode(row)
            self.nodes[k] = v
            queueUpstreamLinks(self.linkQueue, row, 'Link From')
            queueDownstreamLinks(self.linkQueue, row, 'Link To')
                    
        for l in self.linkQueue:
            self.links.append(self.linkProjection(l))

    def mapNode(self, row):
        key = int(row['id'])
        return (key, {
            'id': key,
            'name': row['Name'],
            'tags': atomizeTags(safeRead(row, 'Tags')),
            'type': safeRead(row, 'Artifact Type')
            })
    
    def linkProjection(self, row):
        self.verifyNode(row, row['source'])    
        self.verifyNode(row, row['target'])    
        return {'source' : row['source'], 'target' : row['target'] }
    
    def verifyNode(self, row, key):
        if key not in self.nodes:
            self.nodes[key] = {
                    'id': key,
                    'name': row['name'],
                    'tags': '',
                    'type': ''
                }

    def nodeSort(self, x):
        return x['id']
    
    def save(self, outFile):
        n = sorted(self.nodes.values(), key=self.nodeSort)    
        outputStructure = {'nodes': n, 'links': self.links}
        json.dump(outputStructure, outFile)

#-------------------------------------------------------------------------------
# Top Level Routines
#-------------------------------------------------------------------------------

def transform(inName, outName):
    fIn = codecs.open(inName, 'r', encoding='utf-8')
    fOut = codecs.open(outName, 'w', encoding='utf-8')
    try:
        pipeline = TransformUseCase()
        pipeline.run(fIn)
        pipeline.save(fOut)
    finally:
        fIn.close()
        fOut.close()
#-------------------------------------------------------------------------------
# Main
#-------------------------------------------------------------------------------

def main():
    parser = buildArgParser()
    args = parser.parse_args()
    transform(args.infile, args.outfile)

def buildArgParser():
    p = argparse.ArgumentParser(description='Convert Jazz CSV')
    p.add_argument('infile',  nargs='?', metavar='infile',
                   default=DEFAULT_INPUT_FILE,
                   help='the name of the file to convert')
    p.add_argument('outfile',  nargs='?', metavar='outfile',
                   default=DEFAULT_OUTPUT_FILE,
                   help='the name of the file that will hold the results')
    return p

if __name__ == '__main__':
    main()


   
