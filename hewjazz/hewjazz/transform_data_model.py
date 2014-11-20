import sys
import os
import argparse
import transform_use_cases as XUC

DEFAULT_INPUT_FILE = r'..\..\data_in\dm.csv'
DEFAULT_OUTPUT_FILE = r'..\..\app\data\dm.json'

#-------------------------------------------------------------------------------
# Main
#-------------------------------------------------------------------------------

def main():
    parser = buildArgParser()
    args = parser.parse_args()
    XUC.transform(args.infile, args.outfile)

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


   
