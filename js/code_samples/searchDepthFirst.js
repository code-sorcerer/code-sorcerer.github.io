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