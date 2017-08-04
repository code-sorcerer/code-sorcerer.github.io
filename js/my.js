let loadCodeMirror = function(mirrorId, runButtonId, resetButtonId, codeUrl) {
    $.ajax({
        url: codeUrl, 
        context: document.body,
        dataType: 'text',
        success: function(_response) {
            let _respLines = _response.split('\n');
            let _publicIdx = _.findIndex(_respLines, x => x.startsWith('//--public--'));
            let _privateCode = _respLines.slice(0, _publicIdx).join('\n');
            let _publicCode = _respLines.slice(_publicIdx + 1).join('\n');

            let _mirror = CodeMirror.fromTextArea(document.getElementById(mirrorId), {
                lineNumbers: true,
                mode: 'javascript'
            });

            _mirror.setValue(_publicCode);
            $('#' + runButtonId).unbind('click').click(function() {
                'use strict';
                let _results = [];
                let print = function(...args) {
                    _results.push(_.join(args, ' '));
                };

                let _code = _mirror.getValue();                
                try {
                    eval(_privateCode + _code);
                } catch (e) {                   
                    _results.push('Error: ' + e.message);
                }
                
                let resultsAsComments = _.map(_results, r => '//' + r);
                let lines = _.reject(_code.split('\n'), x => x.startsWith('//'))                            
                           .concat(resultsAsComments).join('\n');
                
                _mirror.setValue(lines);
                _mirror.setCursor(lines.length - 1, 0);
            });            
        }
    });
};