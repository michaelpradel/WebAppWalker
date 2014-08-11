import os
import sys
import tempfile
import shutil
import string
import subprocess
import fnmatch
import re

#print("instrumentFF.py called with: %s " % str(sys.argv))

# constants
functionsMarkedSuffix = "_eventLoopsInstrumented_"
included = [ r'127.0.0.1' ]
excluded = [ ]
valid_chars = "-_.() %s%s" % (string.ascii_letters, string.digits)

# paths
baseDir = os.getcwd()+"/";
workingDirName = baseDir+"instrumentFF_tmp/"

# read arguments
# case 1: check if URL should be instrumented
if sys.argv[1] == "--checkURL":
  for incl in included:
    if re.search(incl, sys.argv[2]):
      sys.exit(0)
  sys.exit(1)

# case 2: instrument .js file
args = sys.argv[:]
firstTime = False
if sys.argv[1] == "--firstTime":
  firstTime = True
  args.remove("--firstTime")
tmpOrig = args[1]
tmpInstr = args[2]
rawRealFileName = args[3]

# functions
def makeUniqueFileName():
  candidate = realFileName
  i = 1
  while os.path.exists(os.path.join(workingDir, candidate)):
    candidate = re.sub(r'\.js$', `i`+".js", realFileName)
    i = i+1
  return candidate

def findCachedFile():
  #print "Searching cached file for "+realFileName
  filePattern = re.sub(r'\.js$', "", realFileName)+"*"+".js"
  for file in os.listdir(workingDir):
    if fnmatch.fnmatch(file, filePattern) and not functionsMarkedSuffix in file:
      path = os.path.join(workingDir, file)
      cmpReturn = subprocess.call(["cmp", "--silent", tmpOrig, path]);
      if cmpReturn == 0:
        #print ".. found it"
        return path
  #print ".. nothing found"
  return None

# main part
realFileName = ''.join(c for c in rawRealFileName if c in valid_chars)
realFileName = realFileName[0:100] # truncate long names

workingDir = os.path.dirname(workingDirName)
if not os.path.exists(workingDir): 
  os.makedirs(workingDir)
  print "Have created working directory "+workingDirName

if not realFileName.endswith(".js"):
  realFileName = realFileName+".js"

# exclude some libraries/files
for ex in excluded:
  if re.search(ex, realFileName):
    print "Will not instrument "+realFileName
    f = open(tmpInstr, 'w')
    f.write(open(tmpOrig).read()) 
    f.close()
    sys.exit(0)

# use cached file if we already instrumented it
cachedOrigFile = findCachedFile()
if cachedOrigFile != None:
  cachedInstrFile = re.sub(r'\.js$', functionsMarkedSuffix+".js", cachedOrigFile)
  if not os.path.exists(cachedInstrFile):
    raise Exception("Expected cached file doesn't exist: "+cachedInstrFile+". Did you clean the working directory after changing instrumenters?")
  f = open(tmpInstr, 'w')
  #print "Reusing cached file "+cachedInstrFile
  f.write(open(cachedInstrFile).read()) 
  f.close()
  #print "  .. exiting instrument.py"
  sys.exit(0)

uniqueFileName = makeUniqueFileName()
orig = os.path.join(workingDir, uniqueFileName)

shutil.copyfile(tmpOrig, orig)

# 1) call event loops instrumenter
cmd = ["node", "tools/eventBreak_instrumenter.js", orig]
#print "Calling function marker with\n"+' '.join(cmd)
subprocess.call(cmd)
functionsMarkedFile = re.sub(r'\.js$', functionsMarkedSuffix+".js", orig)

f = open(tmpInstr, 'w')
f.write(open(functionsMarkedFile).read()) 
f.close()

