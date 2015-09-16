WebAppWalker
============

WebAppWalker is a framework for automated UI-level testing of web applications. The framework generates sequences of events, such as clicks on DOM elements, scrolling, and filling forms. We have instantiated the WebAppWalker framework into **EventBreak**, an approach to analyze the responsiveness of web applications through performance-guided test generation. Details on EventBreak are described in this paper:

[*EventBreak: Analyzing the Responsiveness of User Interfaces through Performance-Guided Test Generation*](http://mp.binaervarianz.de/oopsla2014.pdf)  
by Michael Pradel, Parker Schuh, George Necula, and Koushik Sen  
at Conference on Object-Oriented Programming, Systems, Languages, and Applications (OOPSLA), 2014

This repository provides the source code of our implementation. The easiest way to experiment with EventBreak is to use this [Virtualbox VM image](http://www.eecs.berkeley.edu/~pradel/EventBreak_OOPSLA_Artifact2.tar.gz), where EventBreak, all its requirements, and several benchmark applications are pre-installed. The image contains a file README_EventBreak_Artifact.txt with instructions on how to use it.



## Installation

 * Clone this repository:
```
git clone https://github.com/michaelpradel/WebAppWalker.git
```

 * Install jpm (required to launch WebAppWalker):
```
npm install jpm --global
```

 * Install Firefox >= 38.0


## Usage

Start Firefox with the WebAppWalker extension:
```
jpm run -b /path/to/your/firefox --binary-args="-no-remote"
```

By default, jpm creates a new Firefox profile each time you run WebAppWalker. To store visited URLs, settings, etc., create and use a profile specifically for WebAppWalker.
 * Create a new profile via the profile manager:
```
/path/to/your/firefox -no-remote --ProfileManager
```
 * Start WebAppWalker with the newly created profile:
```
jpm run -b /path/to/your/firefox --binary-args="-no-remote" -p nameOfYourProfile
```

Go to some URL and start WebAppWalker by clicking the "Play" button. You should see that WebAppWalker triggers events, such as clicks. To stop it, click the "Pause" button.


## Search strategies

By default, WebAppWalker uses a random search strategy to decide which event to trigger next. We have developed several other strategies, e.g., the EventBreak strategy. To modify the strategy, open the ```lib/main.js``` file and modify the line that starts with ```var search =```. 

To implement your own strategy, the easiest will be to copy ```lib/search/random_search.js``` and start from there.

