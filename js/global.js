/*--------------------------------------------------------------------
 * jQuery pixel/em conversion plugins: toEm() and toPx()
 * by Scott Jehl (scott@filamentgroup.com), http://www.filamentgroup.com
 * Copyright (c) Filament Group
 * Dual licensed under the MIT (filamentgroup.com/examples/mit-license.txt) or GPL (filamentgroup.com/examples/gpl-license.txt) licenses.
 * Article: http://www.filamentgroup.com/lab/update_jquery_plugin_for_retaining_scalable_interfaces_with_pixel_to_em_con/
 * Options:
        scope: string or jQuery selector for font-size scoping
 * Usage Example: $(myPixelValue).toEm(); or $(myEmValue).toPx();
--------------------------------------------------------------------*/

$.fn.toEm = function(settings){
    settings = jQuery.extend({
        scope: 'body'
    }, settings);
    var that = parseInt(this[0],10),
        scopeTest = jQuery('<div style="display: none; font-size: 1em; margin: 0; padding:0; height: auto; line-height: 1; border:0;">&nbsp;</div>').appendTo(settings.scope),
        scopeVal = scopeTest.height();
    scopeTest.remove();
    return (that / scopeVal).toFixed(8);
};


$.fn.toPx = function(settings){
    settings = jQuery.extend({
        scope: 'body'
    }, settings);
    var that = parseFloat(this[0]),
        scopeTest = jQuery('<div style="display: none; font-size: 1em; margin: 0; padding:0; height: auto; line-height: 1; border:0;">&nbsp;</div>').appendTo(settings.scope),
        scopeVal = scopeTest.height();
    scopeTest.remove();
    return Math.round(that * scopeVal);
};

//Set height of textareas

function viewport() {
    var height = (window.innerHeight ? window.innerHeight : $w.height());
    var full = height - $(15).toPx({});
    $(".CodeMirror").css('height',full);
}

$(document).ready(function() {
    viewport();

    $(window).resize(function() {
        viewport();
    });
    
    $('#dropdown-2').on('show', function(event, dropdownData) {
    	var el = dropdownData.trigger[0];
    	if (!el) return;
    	var oldName = el.name;
    	
        var itemControl = $("#rename-items")[0];
        itemControl.innerHTML = "";
        
        var label = document.createElement("li");
        label.setAttribute("class", "dropdown-text");
        label.appendChild(document.createTextNode("Rename to:"));
        itemControl.appendChild(label);
        
        var inputItem = document.createElement("li");
        var input = document.createElement("input");
        input.oldName = oldName;
        input.value = currNames[oldName];
        input.addEventListener("keyup", function f(event) {
        	if (event.keyCode == 13) {
        		renameLocalVar(event.target.oldName, input.value);
        		$('#dropdown-2').hide();
        	}
        });
        inputItem.appendChild(input);
        itemControl.appendChild(inputItem);
        
        var sep = document.createElement("li");
        sep.setAttribute("class", "dropdown-divider");
        itemControl.appendChild(sep);
        
        var suggestions = globalSuggests[oldName];
        for (var i in suggestions) {
        	var suggestion = suggestions[i];
        	var li = document.createElement("li");
        	var ela = document.createElement("a");
        	ela.addEventListener("click", function(e) {
        		renameLocalVar(e.target.oldName, e.target.newName);
        	});
        	ela.oldName = oldName;
        	ela.newName = suggestion;
        	ela.appendChild(document.createTextNode(suggestion));
        	li.appendChild(ela);
        	itemControl.appendChild(li);
        }
    });
});

var globalSuggests = {};
var currNames = {};

function updateDoc(js, suggests) {
	var state = undefined;
	var lineId = 0;
	
	currNames = {};
	outputEditor.eachLine(function(line) {
		if (state === undefined)
			state = outputEditor.getLineTokens(line, undefined);
		var tokens = outputEditor.getLineTokens(line, state);
		tokens.reverse();
		for (var i in tokens) {
			var token = tokens[i];
			if (token.style == "variable" ||
				token.style == "variable-2" ||
				token.style == "variable-3" ||
				token.style == "def" ||
				token.style == "comment") {
				var name = line.text.substring(token.start, token.end);
				
				if (token.style == "comment") {
					//console.log(name);
					var param = name.indexOf("} ");
					if (param < 0) continue;
					token = {start: token.start + param + 2, end: token.end};
					if (token.start == token.end) continue;
					//console.log(token);
					name = line.text.substring(token.start, token.end);
					//console.log(name);
				}
				if (suggests[name] && suggests[name][0]) {
					var replacement = suggests[name][0];
					
					outputEditor.replaceRange(replacement, {line: lineId, ch:token.start}, {line: lineId, ch:token.end});
					currNames[name] = replacement;
					
					var el = document.createElement("span");
					
					el.setAttribute("class", "localv");
					el.setAttribute("data-dropdown", "#dropdown-2");
					el.name = name;
					el.replacement = replacement;
					el.appendChild(document.createTextNode("\u25BC"));					
					outputEditor.setBookmark({line: lineId, ch:token.start}, {widget:el});
				}
			}			
		}
		++lineId;
	});

	globalSuggests = suggests;
}

function renameLocalVar(oldName, newName) {
	var marks = outputEditor.getAllMarks();
	marks.reverse();
	for (var i in marks) {
		var mark = marks[i];
		if (!mark.atomic || !mark.replacedWith || mark.replacedWith.name != oldName) continue;
		var pos = mark.find(0, false);
		if (!pos) continue;
		var line = pos.from.line;
		var ch = pos.from.ch;
		var endch = ch + currNames[oldName].length;		
		outputEditor.replaceRange(newName, {line: line, ch:ch}, {line:line, ch:endch});
	}
	currNames[oldName] = newName;
}

var lastDeobfuscationParams;

function deobfuscationParams() {
	  var r1 = $("#rename").is(":checked") ? "1" : "0";
	  var t1 = $("#types").is(":checked") ? "1" : "0";
	  var s1 = $("#suggest").is(":checked") ? "1" : "0";
	  return "rename=" + r1 + "&types=" + t1 + "&suggest=" + s1;	
}


$( "#rename, #types, #suggest" ).change(function() {
	if (!lastDeobfuscationParams) return;
	if (lastDeobfuscationParams != deobfuscationParams()) {
		$("#settings_change").removeClass("hidden");
	} else {
		$("#settings_change").addClass("hidden");
	}
});

$( "#submit" ).click(function() {
  // Remove intro_slide
  $( "#intro_area_overlay" ).addClass( "hidden" );
  $( "#settings_change" ).addClass( "hidden" );
  
  var params = deobfuscationParams();
  lastDeobfuscationParams = params;
  
  var inputText = inputEditor.getValue();
  
  $.ajax({
    url  : "beautify?" + params,
    type : "POST",
    data : inputText,
    dataType : 'json',
    success: function(data) {
    	outputEditor.setValue(data.js);
    	if (data.suggest) {
    		updateDoc(data.js, data.suggest);
    	}
    },
    error: function (jqXHR, textStatus, errorThrown) {
    	outputEditor.setValue("// Error contacting the server...\n" + textStatus + "\n" + errorThrown);
    }
  });
});

//Social_Links
		//Load Twitter
	    window.twttr = (function (d,s,id) {
	        var t, js, fjs = d.getElementsByTagName(s)[0];
	        if (d.getElementById(id)) return; js=d.createElement(s); js.id=id;
	        js.src="//platform.twitter.com/widgets.js"; fjs.parentNode.insertBefore(js, fjs);
	        return window.twttr || (t = { _e: [], ready: function(f){ t._e.push(f) } });
	      }(document, "script", "twitter-wjs"));
		//Load Facebook
		(function(d, s, id) {
		  var js, fjs = d.getElementsByTagName(s)[0];
		  if (d.getElementById(id)) return;
		  js = d.createElement(s); js.id = id;
		  js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&appId=456516547700866";
		  fjs.parentNode.insertBefore(js, fjs);
		}(document, 'script', 'facebook-jssdk'));
		//Load G+
		(function() {
			var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
			po.src = 'https://apis.google.com/js/platform.js';
			var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
		})();

//Intialize CodeMirror for syntax highlighting and code editing

	var inputEditor = CodeMirror.fromTextArea(document.getElementById("inputjs"), {
	    mode: "javascript",
	    lineNumbers: true,
	    lineWrapping: true
	});
	var outputEditor = CodeMirror.fromTextArea(document.getElementById("outputjs"), {
	    mode: "javascript",
	    lineNumbers: true,
	    lineWrapping: true
	});
