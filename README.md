WebAppWalker
============

WebAppWalker is a framework for automated UI-level testing of web applications. The framework gathers the set of events available on a web site, such as clicks on DOM elements, scrolling, and filling forms, and automatically triggers sequences of these events. Which sequences to trigger is decided by a strategy. You can implement a new test generation approach by implementing a new strategy.

We have instantiated the WebAppWalker framework in two projects:

### EventBreak

EventBreak is an approach to analyze the responsiveness of web applications through performance-guided test generation. See this paper for details:

[*EventBreak: Analyzing the Responsiveness of User Interfaces through Performance-Guided Test Generation*](http://mp.binaervarianz.de/oopsla2014.pdf)  
by Michael Pradel, Parker Schuh, George Necula, and Koushik Sen  
at Conference on Object-Oriented Programming, Systems, Languages, and Applications (OOPSLA), 2014

The easiest way to experiment with EventBreak is to use this [Virtualbox VM image](http://www.eecs.berkeley.edu/~pradel/EventBreak_OOPSLA_Artifact2.tar.gz), where EventBreak, all its requirements, and several benchmark applications are pre-installed. The image contains a file README_EventBreak_Artifact.txt with instructions on how to use it.

### Macro-based Test Generation

This approach analyzes execution traces gathered from human users of a web site to infer common usage patterns called macro events. Following the *Monkey See, Monkey Do* principle, the automated test generator then imitates human users by replaying the macro events. See this paper for details:

[*Monkey See, Monkey Do: Effective Generation of GUI Tests with Inferred Macro Events*](http://mp.binaervarianz.de/issta2016-macros.pdf)  
by Markus Ermuth and Michael Pradel
at International Symposium on Software Testing and Analysis (ISSTA), 2016



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

