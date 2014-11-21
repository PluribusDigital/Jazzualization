import sys
import os
import json
import codecs
import itertools
import transform_use_cases as XUC
import transform_user_interface as XUI
import transform_data_model as XDM

#-------------------------------------------------------------------------------
# Classes
#-------------------------------------------------------------------------------

class JazzModel:
    def __init__(self, fileName):
        self.outFileName = fileName[:-5]+'0.json'
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
    
class CorrelateJsonModels:
    def __init__(self):
        self.useCaseModel = JazzModel(XUC.DEFAULT_OUTPUT_FILE)
        self.userInterfaceModel = JazzModel(XUI.DEFAULT_OUTPUT_FILE)
        self.databaseModel = JazzModel(XDM.DEFAULT_OUTPUT_FILE)

    def run(self):
        n0 = self.useCaseModel.nodes()
        n1 = self.userInterfaceModel.nodes()
        n2 = self.databaseModel.nodes()
        mn = self.group(n0, n1, n2)
        rn = self.reduce(mn)
        self.enrich(rn)
        for n in [self.useCaseModel, self.userInterfaceModel, self.databaseModel]:
            print(n.outFileName)
            n.update(rn)
            n.save()

    def group(self, n0, n1, n2):
        alln = n0 + n1 + n2
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
        for (k, v) in allNodes.items():
            if v['type'] == '' and 'Type' in v['name']:
                v['type'] = 'Entity'

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


   
