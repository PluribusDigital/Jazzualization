import sys
import os
import json
import csv
import codecs
import itertools
import transform_use_cases as XUC
import transform_user_interface as XUI
import transform_data_model as XDM

UNTYPED_OUT_FILE = r'..\..\data_in\incomplete.csv'
UNTYPED_OUT_COLUMNS = ['id', 'name', 'tags', 'type']

CURATED_IN_FILE = r'..\..\data_in\curated.csv'

#-------------------------------------------------------------------------------
# Classes
#-------------------------------------------------------------------------------

class JazzModel:
    def __init__(self, fileName):
        self.outFileName = fileName[:-6]+'1.json'
        f = codecs.open(fileName, 'r', encoding='utf-8')
        try:
            self.model = json.load(f)
        finally:
            f.close()

    def key(x):
        return x['id']

    def nodes(self):
        return self.model['nodes']

    def update(self, allNodes):
        for node in self.model['nodes']:
            if node['type'] == '' and node['id'] in allNodes:
                print('Updating',node['id'], file=sys.stdout)
                canonNode = allNodes[node['id']]
                node['type'] = canonNode['type']
                node['tags'] = canonNode['tags']

    def save(self):
        f = codecs.open(self.outFileName, 'w', encoding='utf-8')
        try:
            json.dump(self.model, f)
        finally:
            f.close()

# This class manages the manually updated artifacts
class CuratedModel:
    def __init__(self):
        self.model = []
        if os.path.exists(CURATED_IN_FILE):
            with open(CURATED_IN_FILE, 'r') as f:
                self.model = [self.projection(row) for row in csv.DictReader(f, dialect=csv.excel)]

    def projection(self, row):
        key = int(row['id'])
        return {
            'id': key,
            'name': row['name'],
            'tags': XUC.atomizeTags(row['tags']),
            'type': row['type']
            }
    
    def key(x):
        return x['id']

    def nodes(self):
        return self.model
  
class CorrelateJsonModels:
    def __init__(self):
        self.useCaseModel = JazzModel(XUC.DEFAULT_OUTPUT_FILE)
        self.userInterfaceModel = JazzModel(XUI.DEFAULT_OUTPUT_FILE)
        self.databaseModel = JazzModel(XDM.DEFAULT_OUTPUT_FILE)
        self.curated = CuratedModel()

    def run(self):
        n0 = self.useCaseModel.nodes()
        n1 = self.userInterfaceModel.nodes()
        n2 = self.databaseModel.nodes()
        mn = self.group(n0, n1, n2, self.curated.nodes())
        rn = self.reduce(mn)
        self.enrich(rn)
        for n in [self.useCaseModel, self.userInterfaceModel, self.databaseModel]:
            print(n.outFileName)
            n.update(rn)
            n.save()
        self.logUntyped(rn)

    def group(self, *args):
        alln = []
        for n in args:
            alln += n
        alln.sort(key=JazzModel.key) # groupby doesn't work with an unsorted list
        return {k:list(g) for k, g in itertools.groupby(alln, JazzModel.key)}

    def key(self, x):
        return x['type']
    
    def reduce(self, mappedNodes):
        result = {}
        for (k, g) in mappedNodes.items():
            g.sort(key=self.key, reverse=True)
            result[k] = g[0]
        return result

    def enrich(self, allNodes):
        pass

    def logUntyped(self, allNodes):
        untyped = [u for u in filter(lambda x: x['type'] == '', allNodes.values())]
        untyped.sort(key=JazzModel.key)
        with open(UNTYPED_OUT_FILE, 'w') as f:
            writer = csv.DictWriter(f, UNTYPED_OUT_COLUMNS, dialect=csv.excel, extrasaction='ignore', lineterminator='\n')
            writer.writeheader()
            writer.writerows(untyped)

#-------------------------------------------------------------------------------
# Top Level Routines
#-------------------------------------------------------------------------------

def correlate():
    pipeline = CorrelateJsonModels()
    pipeline.run()
    
#-------------------------------------------------------------------------------
# Main
#-------------------------------------------------------------------------------

def main():
    correlate()

if __name__ == '__main__':
    main()


   
