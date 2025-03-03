from random import random

num_fake_clients = 200

def threeRandomLetters():
    first  = chr(97 + int(26*random()))
    second = chr(97 + int(26*random()))
    third  = chr(97 + int(26*random()))
    return first + second + third
    
def fiveRandomDigits():
    first  = chr(48 + int(10*random()))
    second = chr(48 + int(10*random()))
    third  = chr(48 + int(10*random()))
    fourth = chr(48 + int(10*random()))
    fifth  = chr(48 + int(10*random()))
    return first + second + third + fourth + fifth

outf = open('fakeclients.cjs', 'w')
outf.write('exports.fakeclients = [\n')

for i in range(num_fake_clients):
    j = i + 1
    fake_fname = 'fake%d' % j
    fake_netid = '%s%s' % (threeRandomLetters(), fiveRandomDigits())
    outf.write('\t{fname:"%s", netid:"%s"}%s\n' % (fake_fname, fake_netid, j == num_fake_clients and "\n]" or ","))

outf.close()

