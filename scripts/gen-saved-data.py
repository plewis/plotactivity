from random import random

num_saved_data_points = 200

# Change to calculate a meaningful true y value
def trueYValue(x):
    return random()

# Change to calculate a meaningful simulated client y value
def simulateClientCalculatedYValue(x):
    return trueYValue(x)

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

outf = open('saveddata.cjs', 'w')
outf.write('exports.saveddata = {\n')

for i in range(num_saved_data_points):
    j = i + 1
    fake_fname = 'fake%d' % j
    fake_netid = '%s%s' % (threeRandomLetters(), fiveRandomDigits())
    random_x_value = random()
    calc_y_value = simulateClientCalculatedYValue(random_x_value)
    true_y_value = trueYValue(random_x_value)
    outf.write('\t"%s": {\n' % fake_netid)
    outf.write('\t\t"netid": "%s",\n' % fake_netid)
    outf.write('\t\t"fname": "%s",\n' % fake_fname)
    outf.write('\t\t"x": "%.5f",\n' % random_x_value)
    outf.write('\t\t"y": "%.5f",\n' % calc_y_value)
    outf.write('\t\t"y0": "%.5f"\n\t}%s\n' % (true_y_value, j == num_saved_data_points and "\n}" or ","))

outf.close()

