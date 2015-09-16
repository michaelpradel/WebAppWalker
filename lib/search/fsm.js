(function() {
	var util = require('../util.js');

	var log = console.log;
	var FSM = function() {
		this.states = [];
		this.statesGroupsById = {};
	}
	var State = function(fsm, id, events) {
		this.fsm = fsm;
		this.id = id;
		this.events = events;
		this.edges = [];
		this.incoming = [];
	}
	var MergeTransaction = function(fsm) {
		this.states = [];
		this.fsm = fsm;
	}

	FSM.prototype = {
    toString: function() {
      var result = "";
      for (var sId in this.states) {
        var src = this.states[sId];
        for (var eId in src.edges) {
          var target = src.edges[eId];
          result += src.tag+" "+src.events[eId]+" "+target.tag+"\n";
        }
      }
      return result;
    },
    toIdString: function() {
      var result = "";
      for (var sId in this.states) {
        var src = this.states[sId];
        for (var eId in src.edges) {
          var target = src.edges[eId];
          result += src.tag+" "+eId+" "+target.tag+"\n";
        }
      }
      return result;
    },
    nbTransitions: function() {
      var result = 0;
      for (var sId in this.states) {
        var src = this.states[sId];
        for (var eId in src.edges) {
          result++;
        }
      }
      return result;
    },
		addState : function(id, events) {
			var state = new State(this, id, events);
			this.states.push(state);
			this.getStateGroupById(id).push(state);
			return state;
		},
		getStateGroupById : function(id) {
			if(!(id in this.statesGroupsById)) {
				this.statesGroupsById[id] = [];
			}
			return this.statesGroupsById[id];
		},
		displayTaggedFSM : function() {
			log("__display_FSM__");
			for(id in this.states){
				var state = this.states[id];
				if(state != null) {
					log(state.taggedRepr());
				}
			}
			log("__end_display_FSM__");
		},
		displayTraces : function() {
			log("__trace_log__");
			for(var state_id in this.states) {
				var state = this.states[state_id];
				if(state.isTraceStart()) {
					str = "" + state.id;
					var prev_state = state;
					while(state != null) {
						var edge_id = state.getNextIdIfTrace();
						if(edge_id != null) {
							state = state.getEdge(edge_id);
							str += " =_" + edge_id + "_> " + state.id;
						} else {
							state = null;
						}
						prev_state = state;
					}
					log(str);
				}
			}
			log("__end__trace_log__");
		},
		tryMerge : function(tag1, tag2, translation) {
			//log("merging: " + tag1 + " , " + tag2);
			if(this.states[tag1].id != this.states[tag2].id) {
				return false;
			}
			trans = new MergeTransaction(this);
			if(trans.merge(tag1, tag2)) {
				trans.apply(translation);
				return true;
			}
			return false;
		},
		getInitialRedSet : function(translation) {
			var redSet = {};
			for(id1 in this.states) {
				var state = this.states[id1];
				if(state != null && state.isTraceStart()) {
					for(id2 in redSet) {
						if(this.states[id1] != null && this.tryMerge(id2, id1, translation)) {
							if(this.states[id2] == null) {
								redSet[id2] = false;
							}
						}
					}
					if(this.states[id1] != null) {
						redSet[id1] = true;
					}
				}
			}
			return redSet;
		},
		getBlueSet : function(redSet) {
			var blueSet = {};
			for(id in redSet) {
				var state = this.states[id];
				if(state != null) {
	//				console.log("state: " + state.tag);
					for(edge_id in state.edges) {
						var dest = state.edges[edge_id].tag;
//						console.log("foundDest: " + dest);
						if(!redSet[dest]) {
							blueSet[dest] = true;
						}
					}
				} else {
	//				console.log("extra id here : " + id);
					redSet[state] = false;
				}
			}
			return blueSet;
		},
		learnFSM : function() {
			this.tagStates();
			var translation = [];
			var redSet = this.getInitialRedSet(translation);
//			console.log("______REDSET_____");
	//		console.log(redSet);
//			console.log("______BLUESET_____");
			var blueSet = this.getBlueSet(redSet);
//			console.log(blueSet);
			var isHasFringe = function() { 
				var lst = [];
				for(id in blueSet) { lst.push(id); }; 
				if(lst.length > 0) {
					return lst;
				} else {
					return false;
				}
			};
			while(fringe = isHasFringe()) {
//				var blueId = fringe[randomInt(fringe.length)];
				blueId = fringe[0];
				for(var redId in redSet) {
					if(this.states[redId] != null) {
					if(this.tryMerge(redId, blueId, translation)) {
						break;
					}
					}
				}
				redSet[blueId] = true;
				blueSet = this.getBlueSet(redSet);
			}
//			console.log("______ENDSET_____");
			

			for(group_id in this.statesGroupsById) {
				lst = this.statesGroupsById[group_id]
				for(id1 in lst) {
					if(this.states[lst[id1].tag] != null) {
						for(id2 in lst) {
							if(this.states[lst[id2].tag] != null) {
							if(this.states[lst[id1].tag] != null) {
								if(id1 != id2) {
									tags = this.tryMerge(lst[id1].tag, lst[id2].tag, translation);
								}
							}
							}
						}
					}
				}
			}
			count = 0;
			new_translation = []
			for(var i in this.states) {
				if(translation[i] == null || translation[i] == undefined) {
					new_translation[i] = count;
					count += 1;
				}
			}
			for(var i in this.states) {
				var j = i;
				while(new_translation[j] == null || new_translation[j] == undefined) {
					j = translation[j];
				}
				new_translation[i] = new_translation[j];
			}
			var new_fsm = this.deepCopy();
			new_fsm.translation = new_translation;
			return new_fsm;
		},
		translate : function(st1) {
			if(this.translation[st1.tag] != null) {
				return this.states[this.translation[st1.tag]];
			} else {
				return this.states[st1.tag];
			}
		},
		tagStates : function() {
			for(state_id in this.states) {
				var state = this.states[state_id];
				state.tag = state_id;
			}
		},
		deepCopy : function() {
			var new_fsm = new FSM();
		  var count = 0
			for(state_id in this.states) {
				var state = this.states[state_id];
				if(state != null) {
					new_fsm.addState(state.id, state.events);
					state.tag = count;
				 	count += 1;
			  }
			}
			for(state_id in this.states) {
				var state = this.states[state_id];
				if(state) {
					for(edge_id in state.edges) {
						var dest = new_fsm.states[state.edges[edge_id].tag];
						new_fsm.states[state.tag].addTransition(dest, edge_id);
					}
				}
			}
			return new_fsm;
		}
	}
	State.prototype = {
    destStateForEvent: function(evt) {
      var edgeId = this.events.indexOf(evt);
      if (edgeId !== -1) {
        return this.edges[edgeId];
      }
    },
		getNextIdIfTrace : function() {
			var bestId = null;
			for(i in this.edges){
				if(bestId != null){
					return null;
				}
				bestId = i;
			}
			return bestId;
		},
		getEdge : function(id) {
			return this.edges[id];
		},
		taggedRepr : function() {
			var out = [];
			var inc = [];
			for(e in this.edges) {
				out[e] = this.edges[e].tag;
			}
			for(e in this.incoming) { 
				inc[e] = this.incoming[e][0].tag;
			}
			return (this.tag + ":" + this.id + " => " + JSON.stringify(out) + "   ; " + 
							JSON.stringify(inc));
		},
		isTraceStart : function() {
			return this.incoming.length == 0;
		},
		addTransition : function(next, id) {
			next.incoming.push([this, id]);
			this.edges[id] = next;
		},
		getNeighbors : function(fn) {
			var arr = [];
			for(e in this.events) {
				arr.push(e);
			}
//log(arr);
			for(eid in arr) {
				var new_state = this.edges[eid];
				if(new_state != null && new_state != undefined) {
					new_state = new_state.tag;
				}
	//			log(this.taggedRepr(), eid, new_state, this.events[eid]);
				
				fn(eid, this.edges[eid]);
			}
		}
	}
	MergeTransaction.prototype = {
		getState : function(tag) {
			if(tag in this.states) {
				return this.getState(this.states[tag])
			}
			return this.fsm.states[tag];
		},
		merge : function(tag1, tag2) {
			st1 = this.getState(tag1);
			st2 = this.getState(tag2);
			if(st1 == null || st2 == null) {
				return true;
			}
			if(st1 == st2) {
				return true;
			}
			if(st1.id != st2.id) {
				return false;
			}
			this.states[tag2] = tag1;
			for(i in st1.edges) {
			}
			for(i in st1.edges) {
				if(i in st2.edges && i in st1.edges) { // NFA conflict
					if(!this.merge(st1.edges[i].tag, st2.edges[i].tag)) {
						return false;
					}
				}
			}
			return true;
		},
		apply : function(translation) {
			var val = false;
			for(i in this.states) {
				val = true;
				var state_src = this.fsm.states[i];
				var state_dest = this.getState(i);
				for(e in state_src.edges) {
					var out_st = state_src.edges[e];
					if(out_st == this) {
						out_st = state_dest;
						state_src.edges[e] = out_st;
					}
					for(b in out_st.incoming) {
						if(out_st.incoming[b][0] == state_src) {
							out_st.incoming[b][0] = state_dest;
						}
					}
					if(!(e in state_dest.edges)) {
						state_dest.edges[e] = state_src.edges[e];
					}
				}
				for(j in state_src.incoming) {
					var in_st = this.getState(state_src.incoming[j][0].tag);
					if(in_st != undefined) {
						for(i in in_st.edges) {
							if(in_st.edges[i] == state_src) {
								in_st.edges[i] = state_dest;
							}
						}
					}
				}
				state_dest.incoming = state_dest.incoming.concat(state_src.incoming);
				this.fsm.states[state_src.tag] = null;
				translation[state_src.tag] = state_dest.tag;
				state_src.tag += "_asdf";
			}
			return val;
		}
	}

	var BFS = function(fsm, state) {
		visited = {};
		visited[state.tag] = true;
		queue = [];
		retDirs = [];
		var term = false;
		state.getNeighbors(function(dir, neighbor) {
			//log("dir => " + dir + " : " + neighbor)
			queue.push([dir, neighbor])
		});
		while(queue.length > 0) {
			var val = queue.shift();
			var dir = val[0];
			var node = val[1];
			if(node == null || node == undefined) {
				//log(dir);
				term = true;
				if(!(dir in retDirs)) {
					retDirs.push(dir);
				}
			} else if(!visited[node.tag] && !term) {
				visited[node.tag] = true;
				node.getNeighbors(function(new_dir, neighbor) {
					//log([dir, neighbor])
					queue.push([dir, neighbor])
				});
			}
		}
		retDirs = util.shuffle(retDirs);
		if(retDirs.length > 0) {
			return retDirs[0];
		}
	}
	FSM.BFS = BFS;

	exports.FSM = FSM;
})();
