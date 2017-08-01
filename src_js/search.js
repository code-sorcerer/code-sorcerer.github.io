'use strict';

let _ = require('lodash');
let stringify = require('json-stable-stringify');

let vacuum = {
    init: {
        pos: 0,
        dirt: [true, true]
    },

    actions(state) {
        let actions = [];
        actions.push('suck');

        if(state.pos === 0) actions.push('right');
        else actions.push('left');    

        return actions;
    },

    transition(state, action) {
        state = _.cloneDeep(state);

        switch(action) {
            case 'right': state.pos = 1; break;
            case 'left': state.pos = 0; break;
            case 'suck': state.dirt[state.pos] = false; break;                
        }

        return state;
    },

    isGoal(state) {
        return !state.dirt[0] && !state.dirt[1];
    },
    
    areEqual(stateA, stateB) {
        return _.isEqual(stateA, stateB);
    }
};

let kitchen1 = {
    init: {
        cupboard: {open: false, inside: ['cup']},
        fridge: {open: false, inside: ['milk']},
        table: [],
        walkedAway: false
    },

    actions(state) {
        let actions = [];

        if(state.walkedAway) 
            return actions;

        if(!state.cupboard.open) 
            actions.push('open cupboard');
        else 
            actions.push('close cupboard');

        if(!state.fridge.open) 
            actions.push('open fridge');
        else
            actions.push('close fridge');

        if(state.cupboard.open && _.includes(state.cupboard.inside, 'cup')) 
            actions.push('get cup');
        
        if(state.fridge.open && _.includes(state.fridge.inside, 'milk'))
            actions.push('get milk');

        if(_.includes(state.table, 'milk'))
            actions.push('pour milk');       
        
        actions.push('walk away');
        return actions;
    },

    transition(state, action) {
        state = _.cloneDeep(state);        

        switch(action) {            
            case 'open cupboard': state.cupboard.open = true; break;
            case 'close cupboard': state.cupboard.open = false; break;
            case 'open fridge': state.fridge.open = true; break;
            case 'close fridge': state.fridge.open = false; break;
            case 'get cup':
                _.pull(state.cupboard.inside, 'cup');
                state.table.push('cup');                
                break;
            case 'get milk':
                _.pull(state.fridge.inside, 'milk');
                state.table.push('milk');
                break;
            case 'pour milk':
                if(!_.includes(state.table, 'cup'))
                    state.table.push('spilled milk');
                else {
                    _.pull(state.table, 'cup')
                    state.table.push('cup of milk');
                }
                break;
            case 'walk away':
                state.walkedAway = true;
                break;
        }

        return state;
    },

    isGoal(state) {
        return _.includes(state.table, 'cup of milk');
    },

    areEqual(stateA, stateB) {
        return _.isEqual(stateA, stateB);
    }
};

let searchDepthFirst = function(problem, state, depthLimit) {
    if(problem.isGoal(state)) 
        return [];
    else if (depthLimit === 0)
        return undefined;

    let actions = problem.actions(state);
    for (let action of actions) {
        let nextState = problem.transition(state, action);
        let solution = searchDepthFirst(problem, nextState, depthLimit - 1);
        if(typeof solution !== 'undefined')            
            return [action].concat(solution);
    }

    return undefined;
};

let searchDepthFirstEqualCheck = function(problem, state, depthLimit) {
    let search = function(state, depthLimit, visitedStates) {
        if(_.some(visitedStates, s => problem.areEqual(s, state)))
            return undefined;

        let newVisitedStates = visitedStates.concat([state]);

        if(problem.isGoal(state)) 
            return [];
        else if (depthLimit === 0)
            return undefined;

        let actions = problem.actions(state);
        for (let action of actions) {
            let nextState = problem.transition(state, action);            
            let solution = search(nextState, depthLimit - 1, newVisitedStates);
            if(typeof solution !== 'undefined')            
                return [action].concat(solution);
        }

        return undefined;
    };

    return search(state, depthLimit, []);
};

let searchIterativeDeepening = function(problem, state, maxDepth) {
    for(let depthLimit = 1; depthLimit <= maxDepth; depthLimit++) {
        let solution = searchDepthFirst(problem, state, depthLimit);
        if(typeof solution !== 'undefined')
            return solution;
    }
    return undefined;
};

let searchIterativeDeepeningEqualCheck = function(problem, state, maxDepth) {
    for(let depthLimit = 1; depthLimit <= maxDepth; depthLimit++) {
        let solution = searchDepthFirstEqualCheck(problem, state, depthLimit);
        if(typeof solution !== 'undefined')
            return solution;
    }
    return undefined;
};

//Versions for visualization
let searchDepthFirstLogged = function(problem, state, depthLimit) {   
    let log = [];

    let rec = function(state, depthLimit, actionHistory) {
        let actions = problem.actions(state);
        log.push({state: state, actions: actions, history: actionHistory, solved: problem.isGoal(state)});

        if(problem.isGoal(state))
            return [];
        else if (depthLimit === 0)
            return undefined;

        
        for (let action of actions) {        
            let nextState = problem.transition(state, action);            
            let solution = rec(nextState, depthLimit - 1, actionHistory.concat([action]));
            if(typeof solution !== 'undefined')            
                return [action].concat(solution);
        }

        return undefined;
    };
    
    return [rec(state, depthLimit, []), log];
};

let searchIterativeDeepeningLogged = function(problem, state, maxDepth) {
    let log = [];

    for(let depthLimit = 1; depthLimit <= maxDepth; depthLimit++) {
        log.push({depthLimit:depthLimit});

        let result = searchDepthFirstLogged(problem, state, depthLimit);
        let solution = result[0];
        log = _.concat(log, result[1]);

        if(typeof solution !== 'undefined')
            return [solution, log];
    }

    return [undefined, log];
};

let searchDepthFirstEqualCheckLogged = function(problem, state, depthLimit) {
    let log = [];

    let search = function(state, depthLimit, visitedStates, actionHistory) {
        let visited = _.some(visitedStates, s => problem.areEqual(s, state));
        let actions = problem.actions(state);
        log.push({state: state, actions: actions, history: actionHistory, visited: visited, solved: problem.isGoal(state)});

        if(visited)
            return undefined;

        let newVisitedStates = visitedStates.concat([state]);

        if(problem.isGoal(state)) 
            return [];
        else if (depthLimit === 0)
            return undefined;
        
        for (let action of actions) {
            let nextState = problem.transition(state, action);            
            let solution = search(nextState, depthLimit - 1, newVisitedStates, actionHistory.concat([action]));
            if(typeof solution !== 'undefined')            
                return [action].concat(solution);
        }

        return undefined;
    };

    return [search(state, depthLimit, [], []), log];
};

let searchIterativeDeepeningEqualCheckLogged = function(problem, state, maxDepth) {
    let log = [];

    for(let depthLimit = 1; depthLimit <= maxDepth; depthLimit++) {
        log.push({depthLimit:depthLimit});

        let result = searchDepthFirstEqualCheckLogged(problem, state, depthLimit);
        let solution = result[0];
        log = _.concat(log, result[1]);

        if(typeof solution !== 'undefined')
            return [solution, log];
    }

    return [undefined, log];
};


module.exports = { 
    vacuum: vacuum, 
    kitchen1: kitchen1,
    searchDepthFirstLogged: searchDepthFirstLogged,
    searchIterativeDeepeningLogged: searchIterativeDeepeningLogged,
    searchDepthFirstEqualCheckLogged: searchDepthFirstEqualCheckLogged,
    searchIterativeDeepeningEqualCheckLogged: searchIterativeDeepeningEqualCheckLogged
};


//console.log(searchIterativeDeepeningEqualCheckLogged(vacuum, vacuum.init, 8));

//console.log(_.set('cupboard.open')(true)(kitchen1.init));
//console.log(kitchen1.init);
//console.log(_.concat([1,2], [3,4]));