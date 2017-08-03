let kitchenStateToStr = function(state) {
    let openToStr = isOpen => isOpen ? 'open' : 'closed';

    return 'Cupboard(' + openToStr(state.cupboard.open) + ')[' + _.join(state.cupboard.inside, ',') + ']; '
           + 'Fridge(' + openToStr(state.fridge.open) + ')[' + _.join(state.fridge.inside, ',') + ']; ' +
           + 'Table[' + _.join(state.table, ',') + ']';
};
        
//--public--
let kitchen = {
    init: {
        cupboard: {open: false, inside: ['cup']},
        fridge: {open: false, inside: ['milk']},
        table: []       
    },

    actions(state) {
        let actions = [];        

        if(!state.cupboard.open) actions.push('open cupboard');
        else actions.push('close cupboard');

        if(!state.fridge.open) actions.push('open fridge');
        else actions.push('close fridge');

        if(state.cupboard.open && _.includes(state.cupboard.inside, 'cup')) 
            actions.push('get cup');
        
        if(state.fridge.open && _.includes(state.fridge.inside, 'milk'))
            actions.push('get milk');

        if(_.includes(state.table, 'milk'))
            actions.push('pour milk');  
        
        return actions;
    },

    transition(state, action) {
        //Not mutating passed state is important
        //for Vasiliy's mental calculations
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
        }
        return state;
    }
};