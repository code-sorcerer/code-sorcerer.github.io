'use strict';

let _ = require('lodash');
let stringify = require('json-stable-stringify');
let search = require('./search.js');

let treeFromLog = function(elementId, overlayElementId, log, stateLabel, defaultStateLabel, actionLabel, depthLimit) {
    let container = document.getElementById(elementId);
    let overlay = document.getElementById(overlayElementId);
    let options = {
        layout: {
            hierarchical: {
                direction: "UD",
                sortMethod: "directed",
                levelSeparation: 80,
                nodeSpacing: 80,
                treeSpacing: 80
            }
        },
        interaction: {dragNodes: false},
        physics: { enabled: false },
        nodes: {shape: 'circle', color: {border: 'gray', background: 'white'}, shapeProperties: { borderDashes: [2,2] }},
        edges: {color: 'gray', arrows: 'to', font: {size: 10, strokeWidth: 2, strokeColor : 'white'}}        
    };    

    let network = null;
    let data = null;
    let historyMap, selectedNodes, lastNodeId, logLeft, solved;

    let changeOverlayText = function(text) {
        let ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        ctx.textBaseline = 'top';
        
        ctx.fillStyle = 'white';
        ctx.fillRect(5, 5, 200, 20 * text.length + 15);        

        for(let i = 0; i < text.length; i++) {
            let line = text[i];
            ctx.font = '16px Arial';       
            //let textSize = ctx.measureText(text);                
            ctx.fillStyle = 'gray';        
            ctx.fillText(line, 10, 10 + 20 * i);
        }
    };

    let reset = function() {
        if(!_.isNull(network))
            network.destroy();

        data = {
            nodes: new vis.DataSet(),
            edges: new vis.DataSet()
        };        
        network = new vis.Network(container, data, options);        

        historyMap = Object.create(null);
        selectedNodes = [];    
        lastNodeId = 0;
        logLeft = log;
        solved = false;

        step();
    };

    let clearSelection = function() {
        for(let nodeId of selectedNodes)
            data.nodes.update({id: nodeId, color: null, shapeProperties: { borderDashes: [2,2] }});
        selectedNodes = [];
    };

    let selectHistory = function(actionHistory, isSolved) {
        let colorStack = function(hist) {
            let nodeId = historyMap[stringify(hist)];

            let color = isSolved ? {border:'#000000', background:'#82ff92'} :
                                   {border:'#000000', background:'#fff882'};
            
            data.nodes.update({id: nodeId, color: color, shapeProperties: {borderDashes: false}});
            selectedNodes.push(nodeId);

            if(_.isEmpty(hist)) return;            
            colorStack(_.initial(hist));
        };

        colorStack(actionHistory);
    };

    let step = function() {
        if(_.isEmpty(logLeft)) {
            if(!solved)
                clearSelection();
            return;
        }

        let entry;
        while(true) {
            entry = _.head(logLeft);
            logLeft = _.tail(logLeft);
            if(_.isUndefined(entry.state)) {                
                if(!_.isUndefined(entry.depthLimit))
                    depthLimit = entry.depthLimit;                
            } 
            else
                break;
        }
        
        let state = entry.state;        
        let actionHistory = entry.history;
        let actions = entry.actions;   
        solved = entry.solved;
        let visited = entry.visited;

        changeOverlayText(actionHistory);
        
        //Update graph
        let historyHash = stringify(actionHistory);
        let nodeId;        
        if(historyHash in historyMap) {
            nodeId = historyMap[historyHash];
        }   
        else {
            nodeId = lastNodeId++;
            historyMap[historyHash] = nodeId;
            let node = {id: nodeId};            
            data.nodes.add(node);            
        }
        
        data.nodes.update({id: nodeId, label: stateLabel(state), font: null});

        //Show future states
        if(actionHistory.length < depthLimit && !visited) {            
            for(let a of actions) {
                let chHist = actionHistory.concat([a]);
                let hash = stringify(chHist);
                if(!(hash in historyMap)) {
                    let ch = {id: lastNodeId++, label: defaultStateLabel, font: {color:'white'} };
                    data.nodes.add(ch);            
                    historyMap[hash] = ch.id;
                    data.edges.add({from: nodeId, to: ch.id, label: actionLabel(a)});
                }
            }
        }

        clearSelection();
        selectHistory(actionHistory, solved);
        if(visited)
            data.nodes.update({id: historyMap[stringify(actionHistory)], color: {background:'#ff8484', border:'#a05151'}, shapeProperties: {borderDashes: false}});
        //network.fit({nodes: [nodeId], animation: {duration: 250, easingFunction: 'easeInOutCubic'}});
        
    };

    reset();    
    return {step: step, reset: reset};
};

// let stateLabel = function(state) {
//     return (state.pos === 0 ? 'L' : 'R') + 
//         (_(state.dirt).map(x => x ? 1 : 0).join(''));    
// };

// let actionLabel = function(action) {
//     return action;
// };

// let result = search.searchIterativeDeepeningEqualCheckLogged(search.vacuum, search.vacuum.init, 8);
// let solution = result[0];
// let log = result[1];
// let tree = treeFromLog('graph1', 'overlayGraph1', log, stateLabel, 'L00', actionLabel, 3);

// document.getElementById('step1').addEventListener('click', tree.step);
// document.getElementById('reset1').addEventListener('click', tree.reset);

let stateLabel = function(state) {
    return '';
};

let actionLabel = function(action) {
    return action.replace(' ', '\n');
};

//let result = search.searchIterativeDeepeningEqualCheckLogged(search.kitchen1, search.kitchen1.init, 8);
let result = search.searchDepthFirstEqualCheckLogged(search.kitchen1, search.kitchen1.init, 8);
let solution = result[0];
let log = result[1];
let tree = treeFromLog('graph1', 'overlayGraph1', log, stateLabel, '', actionLabel, 8);

document.getElementById('step1').addEventListener('click', tree.step);
document.getElementById('reset1').addEventListener('click', tree.reset);

