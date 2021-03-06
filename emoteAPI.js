/*
 *	FIMFiction Emote Script v3.0
 *
 *	Written by KrazyTheFox
 *	Emote expander code courtesy of Kits.
 *
 */

"use strict";

var tablePrefix = "emoteAPI_Table:";
var pageOther = -1;
var pageGroupThread = 0;
var pageBlogEdit = 1;
var pageScriptSettings = 2;

var initialized = false;
var useVerbose = false;
var emotePreviewSize = 58;

var currentTables = [];
var majorTables = [];
var nameListDiv;
var urlListDiv;

var sitePage = pageOther;

function logInfo(message) {
	console.log("Emote API [INFO]: " + message);
}

function logError(message) {
	console.log("Emote API [ERROR]: " + message);
}

// GM function replacements are from https://raw.github.com/gist/3123124
function addGlobalStyle(css) {
	
	try {
		var elmHead, elmStyle;
		elmHead = document.getElementsByTagName('head')[0];
		elmStyle = document.createElement('style');
		elmStyle.type = 'text/css';
		elmHead.appendChild(elmStyle);
		elmStyle.innerHTML = css;
	} catch (e) {
		if (!document.styleSheets.length) {
			document.createStyleSheet();
		}
		document.styleSheets[0].cssText += css;
	}
	
}

function initialize() {

	initialized = true;
	
	if(/\/manage_user\//.test(location.href)) {

		var settingsTabSpan = $("<span>Emote Script</span>");
		var settingsTabImg  = $("<i class='fa fa-cog'></i>");
		var settingsTabLink = $("<a href='/manage_user/emote_script_settings'></a>");
		var settingsTabList = $("<li class='tab'></li>");

		settingsTabLink.append(settingsTabImg);
		settingsTabLink.append(settingsTabSpan);
		settingsTabList.append(settingsTabLink);
		
		var settingsTabContainer = $(".tabs ul");
		settingsTabContainer.append(settingsTabList);

		if (sitePage == pageScriptSettings) {

			createSettingsPage();

			$("body").append("<div id='emoteScriptInitialized'></div>");
			return;

		}

	}

	/*if (sitePage == pageBlogEdit) {
		$(".light_toolbar").removeClass("no_margin");
		$(".light_toolbar").after(getDefaultTableHTML());
		$("#blog_post_content").parent().css("margin-right", "300px");
		var blogEmotePanel = $("<div class='emoticons_panel' style='float: right;'></div>");
		blogEmotePanel.appendTo($(".dark_toolbar").first().parent());
		$(".emoticons_panel").after("<p style='display: block;'>Blog post support for the emote script is undergoing development. While it should be fully functional, the styling is actively being worked on and looks this way intentionally. Kind of.</p>");
	}*/

	$("a[title='Edit this comment']").each(function(index) {
		$(this).on("click", function(e) {
			var ta = $(this).parents().eq(4).find("form").find(".textarea_padding").children().eq(0);
			ta.val(imagesToEmoteShorthand(ta.val()));
		});
	});

	$(".data form").each(function(index) {
		$(this).attr("onsubmit", "");
		$(this).submit(function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(".textarea_padding textarea").each(function(index) {
				$(this).val(emoteShorthandToImages($(this).val()));
			});

			var id = $(this).attr("id").split("_")[3];
			id = "#comment_" + id;
			var comment = $(id);

			EditComment(this, comment);

			return false;

		});
	});

	if (sitePage == pageOther) {
		return;
	}

	$(".add_comment").children().eq(0).attr("onsubmit", "");

	$(".add_comment").children().eq(0).submit(function(e) {
		e.preventDefault();
		e.stopPropagation();
		parseCommentSubmission();
	});

	$("#preview_comment").off();
	$(document).on("click", "#preview_comment", function(e) {
		$.post('/ajax/preview_comment.php',
			{ "comment" : emoteShorthandToImages($("#comment_comment").val()) }, 
			function(xml) { 
				$("#comment_preview").html( $("comment", xml).text());
				$("#comment_preview").fadeIn();	
			});
	});

	$("body").append("<div id='emoteScriptInitialized'></div>");
	
	if (GM_getValue("verbose", false) == "true") {
		$("body").append("<div id='verboseEnabled'></div>");
		useVerbose = true;
	} else {
		$("body").append("<div id='verboseDisabled'></div>");
	}
	
	var theCSS = 
		
		".emoticons_panel {\
			height: auto !important;\
			min-height: 285px !important;\
			overflow-x: hidden !important;\
			padding-top: 15px !important;\
			display: block !important;\
			border: none !important;\
		}\
		\
		.customEmote {\
			box-shadow: #000 0em 0em 0em;\
			opacity: 0.75;\
			transition: opacity .2s ease-out;\
			-moz-transition: opacity .2s ease-out;\
			-webkit-transition: opacity .2s ease-out;\
			-o-transition: opacity .2s ease-out;\
			-webkit-touch-callout: none;\
			-webkit-user-select: none;\
			-khtml-user-select: none;\
			-moz-user-select: none;\
			-ms-user-select: none;\
			user-select: none;\
			margin: 5px;\
		}\
		\
		.customEmote:hover {\
			opacity: 1;\
			transition: opacity .2s ease-in;\
			-moz-transition: opacity .2s ease-in;\
			-webkit-transition: opacity .2s ease-in;\
			-o-transition: opacity .2s ease-in;\
			cursor: pointer;\
		}\
		\
		.emoteTabButton {\
			width: auto;\
			height: 27px;\
			float: left;\
			text-align: center;\
			padding: 5px 8px 0px 8px !important;\
			margin: 5px 0px 0px 5px !important;\
			font-family: \"Arial\" !important;\
			font-size: 16px !important;\
			font-weight: normal !important;\
			-webkit-touch-callout: none;\
			-webkit-user-select: none;\
			-khtml-user-select: none;\
			-moz-user-select: none;\
			-ms-user-select: none;\
			user-select: none;\
			opacity: 1;\
			transition: opacity .2s ease-in;\
			-moz-transition: opacity .2s ease-in;\
			-webkit-transition: opacity .2s ease-in;\
			-o-transition: opacity .2s ease-in;\
			-webkit-border-radius: 3px;\
			-moz-border-radius: 3px;\
			border-radius: 3px;\
			background-color: #abc156;\
			color: #ffffff\
		}\
		\
		.emotePageTabButton {\
			opacity: 0.5;\
			width: 15px;\
			height: 15px;\
			display: inline-block;\
			text-align: center;\
			padding: 0px;\
			margin-left: 5px;\
			font: 13px normal \"Segoe UI\" !important;\
			-webkit-touch-callout: none;\
			-webkit-user-select: none;\
			-khtml-user-select: none;\
			-moz-user-select: none;\
			-ms-user-select: none;\
			user-select: none;\
			transition: opacity .2s ease-in;\
			-moz-transition: opacity .2s ease-in;\
			-webkit-transition: opacity .2s ease-in;\
			-o-transition: opacity .2s ease-in;\
			-webkit-border-radius: 10px;\
			-moz-border-radius: 10px;\
			border-radius: 15px;\
			background-color: #00a9f0;\
			color: #ffffff\
		}\
		\
		.emoteTabButton:hover {\
			cursor: pointer;\
			opacity: 0.8;\
			transition: opacity .2s ease-out;\
			-moz-transition: opacity .2s ease-out;\
			-webkit-transition: opacity .2s ease-out;\
			-o-transition: opacity .2s ease-out;\
		}\
		\
		.emotePageTabButton:hover {\
			cursor: pointer;\
			opacity: 1.0;\
			transition: opacity .2s ease-out;\
			-moz-transition: opacity .2s ease-out;\
			-webkit-transition: opacity .2s ease-out;\
			-o-transition: opacity .2s ease-out;\
		}\
		\
		.inner_padding {\
			margin-top: 0px !important;\
		}\
		\
		.add_comment {\
			background-color: #faf8f3 !important;\
		}\
		\
		#comment_comment {\
			border-right: 1px solid #e8e5db !important;\
		}\
		.textbox_container {\
			width: 100%;\
		}\
		\
		#emoteAPITabContainer {\
			margin-top: 0px;\
			margin-left: 12px;\
			margin-bottom: 15px;\
			float: left;\
			clear: both;\
			width: 279px;\
		}\
		\
		#emotePageTabContainer {\
			margin-bottom: 8px;\
			float: left;\
			clear: both;\
			width: 279px;\
			text-align: center;\
		}\
		\
		.emoteTable {\
			display: none;\
			margin: 0 auto 0 auto;\
			float: left;\
			clear: both;\
			text-align: center;\
		}\
		\
		.emotescript_both_curved {\
			-webkit-border-radius: 4px;\
			-moz-border-radius: 4px;\
			border-radius: 4px;\
		}";
	
	addGlobalStyle(theCSS);

	var originalEmotes = $(".emoticons_panel").first().children();
	
	//$('.emoticons_panel > .inner_padding').attr("id", tablePrefix + "FF_Area");
	var tempContainer = $("<div id='" + tablePrefix + "FF_Area" + "' style='text-align: center;'></div>");
	var newContainer = tempContainer;
	$('.emoticons_panel').prepend(tempContainer);
	
	tempContainer = $("<div id='emotePageTabContainer'></div>");
	$('.emoticons_panel').prepend(tempContainer);

	tempContainer = $("<div id='emoteAPITabContainer'></div>");
	$('.emoticons_panel').prepend(tempContainer);

	tempContainer = $("<div id='emoteNameList' style='display: none;'></div>");
	$("body").append(tempContainer);

	tempContainer = $("<div id='emoteURLList' style='display: none;'></div>");
	$("body").append(tempContainer);

	//Create default FF Emote table
	originalEmotes.each(function(index) {
		$(this).detach().appendTo(newContainer);
	});

	createTableLink("FF", "FF");

	var settingsImage = $("<img width='16' height='16' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAM1SURBVHjadJNNSCN3GMZ/k0y+NImLTMIkNUYwJMqmkVkPBrFQe0u8FEEpgoc9pfS0PfTUntvj9tLLXmVDb0XBbdlDS6gtEbPxYv3AiMQaIjpDo/nwHzNjeui6h9K+p/fw/Hh43odX4n9mdXX1VSKRyAAcHR39uLa2lv0vne1hSafTz3K53JuJiYmPAVRV1bLZLNlsFlVVNYBUKrWay+XepNPpZw+c/AAvLy8/n56eZnJy8odSqfRaURRVlmUAFEVRnz59+uvU1NScpmkkEoknAMVi8Vs7QCaT+W5+fj40PDxMNBolGAyOJ5NJLMvCNE0ikQiqqo5qmobb7cbr9aLrerBcLr+wA7Tb7ctAIPCJ3++n1+sRCARwOByYpgmA0+nE7/fTbDa5ubmhVCqxsbHxmWEYh3YAwzAOg8HgrM/nG/f5fPT7ffb399nZ2RGVSsUSQsherxchBCcnJ5RKpdeFQuErAGlpaemVoiiaoihqMpnE6/VSrVbZ2tr6OZ/PLwCsrKxszs3NfRSNRmm1Wuzt7aHr+oWu67vy6OhoRtM0XC4XnU4HSZI4PT0Vb2EBkM/nF0ZGRv4KBAJuIQSpVIput6vu7u5mZCEEZ2dn2Gw2JEkiFAphWZb07757vZ7U6XS4uLig3+9zf3+PEAJ7OByebTQavmazOWiaJh6PB4fDIQ8NDX1wcHDwPSAvLi7+FI/Hx/v9Pufn59TrdWq12qVhGL+9c1pYWPhFVdUPFUUhFotRr9epVqtdgGg06gqFQlQqFXRdR9f17fX19TSAHSAejy/F4/EvwuEwjUaD6+trwuEwY2NjciQSkR0OB8fHx7RaLQKBAHd3dyOmaf55dXW1K71134vFYo+FENze3tJut3E6nXi9XizLotvtIoRgcHAQj8eD2+2mUqn8sbm5mZQB6vX6S8uyvna5XHS7XSzLKtvt9ic22z+vYhgGvV7v93a7Pfuguby8fPkuQr1e3/L7/T1Zlt+r1WpfFovFnKqqn0uS5BZC0Gw2rwuFwqTNZjscGBh4rOv683K5/A3AwxHtgBt4BPgkSXo0MzPzwjTN9wFkWd7b3t7+tN/vd4BroAF0gO7fAwAtE2jf5kCQVgAAAABJRU5ErkJggg==' />");
	var settingsLink = $("<a class='emotescript_both_curved' href='/manage_user/emote_script_settings' title='Emote Script Settings'></a>");
	var settingsListObj = $("<li></li>");
	var settingsList = $("<ul class='toolbar_buttons'></ul>");

	settingsLink.append(settingsImage);
	settingsListObj.append(settingsLink);
	settingsList.append(settingsListObj);

	$('.add_comment form div.light_toolbar').append(settingsList);

	showTable(tablePrefix + "FF");
	
}

function createTableLink(shortTableName, longTableName, tablePage) {

	var displayName = shortTableName;

	if (useVerbose) {
		displayName = longTableName;
	}

	if (majorTables.indexOf((tablePrefix + shortTableName)) == -1 && shortTableName != "FF") {

		var tableLink = $("<span class='emoteTabButton' id='" + (tablePrefix + shortTableName) + "'>" + displayName + "</span>");

		tableLink.click(function() {
			showTableCycle(this.id);
			showPageTab(this.id);
		});

		$("#emoteAPITabContainer").append(tableLink);

		majorTables.push((tablePrefix + shortTableName));

	}

	if (shortTableName === "FF") {

		var tableLink = $("<span class='emoteTabButton' id='" + (tablePrefix + "FF") + "'>" + displayName + "</span>");

		tableLink.click(function() {
			showTable(this.id);
			showPageTab("FF");
		});

		$("#emoteAPITabContainer").append(tableLink);

	} else {

		var tableLink = $("<span class='emotePageTabButton " + (tablePrefix + shortTableName) + "pagetab' style='display: none;' id='" + (tablePrefix + shortTableName + tablePage) + "'> </span>");

		tableLink.click(function() {
			showTable(this.id);
		});

		$("#emotePageTabContainer").append(tableLink);

	}

}

function showPageTab(tabID) {

	if (tabID === "FF") {
		$('#emotePageTabContainer').children().each(function () {
			var currentDiv = $(this);
			currentDiv.css('display', 'none');
		});
	} else {
		$('#emotePageTabContainer').children().each(function () {
			var currentDiv = $(this);
			if (currentDiv.attr("class") == "emotePageTabButton " + tabID + "pagetab") {
				currentDiv.css('display', 'inline-block');
			} else {
				currentDiv.css('display', 'none');
			}
		});
	}

	setTimeout(function() {
		$(".textbox_container").first().css({'min-height':(($(".emoticons_panel").height() - 5) + 'px')});
		$(".textbox_container").first().css({'height':(($(".emoticons_panel").height() - 5) + 'px')});
	}, 2);

}

function showTable(tableID) {

	$('.emoticons_panel').children().each(function () {
		var currentDiv = $(this);
		
		if (currentDiv.attr("id") == tableID + "_Area") {
			currentDiv.css('display', 'block');
		} else if (currentDiv.attr("id") != "emoteAPITabContainer" && currentDiv.attr("id") != "emotePageTabContainer") {
			currentDiv.css('display', 'none');
		}

	});

	$('#emotePageTabContainer').children().each(function () {

		var currentDiv = $(this);
		currentDiv.css('background-color', "#00a9f0");

		if (currentDiv.attr("id") == tableID) {
			currentDiv.css('background-color', "#003fe0");
		}

	});

	setTimeout(function() {
		$(".textbox_container").first().css({'min-height':(($(".emoticons_panel").height() - 5) + 'px')});
		$(".textbox_container").first().css({'height':(($(".emoticons_panel").height() - 5) + 'px')});
	}, 2);
	
}

function showTableCycle(tableID) {

	var currPage = 0;
	var totalPages = 0;

	$('.emoticons_panel').children().each(function () {
		var currentDiv = $(this);
		if (currentDiv.attr("id") == tableID + (totalPages + 1) + "_Area") {
			totalPages++;
			if (currentDiv.css("display") === "block") {
				currPage = totalPages;
			}
		}
	});

	var nextPage = currPage + 1;

	if (nextPage > totalPages) {
		nextPage = 1;
	}

	$('.emoticons_panel').children().each(function () {

		var currentDiv = $(this);
		if (currentDiv.attr("id") == tableID + nextPage + "_Area") {
			currentDiv.css('display', 'block');
		} else if (currentDiv.attr("id") != "emoteAPITabContainer" && currentDiv.attr("id") != "emotePageTabContainer") {
			currentDiv.css('display', 'none');
		}

	});

	$('#emotePageTabContainer').children().each(function () {

		var currentDiv = $(this);
		currentDiv.css('background-color', "#00a9f0");

		if (currentDiv.attr("id") == tableID + nextPage) {
			currentDiv.css('background-color', "#003fe0");
		}

	});

	setTimeout(function() {
		$(".textbox_container").first().css({'min-height':(($(".emoticons_panel").height() - 5) + 'px')});
		$(".textbox_container").first().css({'height':(($(".emoticons_panel").height() - 5) + 'px')});
	}, 2);

}

function addEmote(url, emoteName, shortTableName, longTableName, tablePage) {

	if (!initialized) {

		getSitePage();

		emotePreviewSize = GM_getValue('emotePreviewSize', 58);

		if ($('div#verboseEnabled').length > 0) {
			useVerbose = true;
		} else if ($('div#verboseDisabled').length > 0) {
			useVerbose = false;
		}

		if ($('div#emoteScriptInitialized').length > 0) {
			initialized = true;
		} else {
			initialize();
		}

		nameListDiv = $("#emoteNameList");
		urlListDiv = $("#emoteURLList");

	}

	if (sitePage != pageGroupThread && sitePage != pageBlogEdit) {

	    $("a.user_image_link").each(function(index) {

	        if ($(this).attr("href") == url) {
	            $(this).parent().replaceWith('<img src="' + url + '" />');
	        }    

	    });

		return;

	}

	emoteName = ":" + emoteName + ":";

	var container = $(document.createElement('span'));
	container.html(emoteName);
	nameListDiv.append(container);

	container = $(document.createElement('span'));
	container.html(url);
	urlListDiv.append(container);

	var tableFound = false;

	if (currentTables.indexOf(tablePrefix + shortTableName + tablePage + "_Area") == -1) {
		
		var tableID = "div[id=\"" + tablePrefix + shortTableName + tablePage + "_Area\"]";

		if($(tableID).length > 0) {
			tableFound = true;
			currentTables.push(tablePrefix + shortTableName + tablePage + "_Area");
		}

	} else {
		tableFound = true;
	}

	if (tableFound) {
		createNewEmote(url, emoteName, shortTableName, tablePage);
	} else {
		createNewTable(shortTableName, longTableName, tablePage);
		createNewEmote(url, emoteName, shortTableName, tablePage);
	}
	
}

function createNewEmote(url, emoteName, shortTableName, tablePage) {

	var image = $(document.createElement('img'));
	image.attr({
		"id": url,
		"class": "customEmote",
		"src": url,
		"width": emotePreviewSize,
		"height": emotePreviewSize,
		"title": emoteName
	});
	image.click(function() { addEmoteToCommentBox(this.id); });

	var selector = "div[id=\"" + tablePrefix + shortTableName + tablePage + "_Area\"]";

	$(selector).append(image);

}

function createNewTable(shortTableName, longTableName, tablePage) {

	currentTables.push(tablePrefix + shortTableName + tablePage + "_Area");

	var emoteTable = $("<div class='emoteTable'></div>");
	$("div.emoticons_panel").append(emoteTable);
	emoteTable.attr("id", tablePrefix + shortTableName + tablePage + "_Area");

	createTableLink(shortTableName, longTableName, tablePage);

}

function getSitePage() {
	
	sitePage = pageOther;

	if(/\/manage_user\/edit_blog_post/.test(location.href)) {
		sitePage = pageBlogEdit;
	} else if(/\/group\//.test(location.href)) {
		if (/\/thread\//.test(location.href)) {
			sitePage = pageGroupThread;
		}
	} else if(/\/emote_script_settings/.test(location.href)) {
		sitePage = pageScriptSettings;
	}
	
}

function addEmoteToCommentBox(url) {

	if (sitePage == pageBlogEdit) {
		replaceSelectedText(document.getElementById("blog_post_content"), "[img]" + url + "[/img] ");
	} else {
		replaceSelectedText(document.getElementById("comment_comment"), "[img]" + url + "[/img] ");
	}

}

function replaceSelectedText(el, text) {
	var sel = getInputSelection(el), val = el.value;
	el.value = val.slice(0, sel.start) + text + val.slice(sel.end);
}

function getInputSelection(el) {

    var _start = 0, _end = 0, normalizedValue, range,
        textInputRange, len, endRange;

    if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
        _start = el.selectionStart;
        _end = el.selectionEnd;
    } else {
        range = document.selection.createRange();

        if (range && range.parentElement() == el) {
            len = el.value.length;
            normalizedValue = el.value.replace(/\r\n/g, "\n");

            textInputRange = el.createTextRange();
            textInputRange.moveToBookmark(range.getBookmark());

            endRange = el.createTextRange();
            endRange.collapse(false);

            if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                _start = _end = len;
            } else {
                _start = -textInputRange.moveStart("character", -len);
                _start += normalizedValue.slice(0, _start).split("\n").length - 1;

                if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                    _end = len;
                } else {
                    _end = -textInputRange.moveEnd("character", -len);
                    _end += normalizedValue.slice(0, _end).split("\n").length - 1;
                }
            }
        }
    }

	return {
	start: _start,
	end: _end
	};

}

Object.size = function(obj) {
	var size = 0, key;
	for(key in obj) {
		if(obj.hasOwnProperty(key)) {
			size++;
		}
	}
	return size;
};

function createSettingsPage() {

	$("div.main").append($("<input type='button' id='useConciseButton' value='Use Concise Tabs' style='margin: 15px; padding: 5px;' />"));
	$("div.main").append($("<input type='button' id='useVerboseButton' value='Use Verbose Tabs' style='margin: 15px; padding: 5px;' />"));
	$("div.main").append($("<input type='button' id='regSizeButton' value='Regular Size Previews' style='margin: 15px; padding: 5px; margin-left: 25px;' />"));
	$("div.main").append($("<input type='button' id='largeSizeButton' value='Large Size Previews' style='margin: 15px; padding: 5px;' />"));
	$("div.main").append($("<input type='button' id='smallSizeButton' value='Small Size Previews' style='margin: 15px; padding: 5px;' />"));

	$("#useVerboseButton").click(function() {
		GM_setValue("verbose", "true");
		alert("Now using verbose tabs.");
	});

	$("#useConciseButton").click(function() {
		GM_setValue("verbose", "false");
		alert("Now using concise tabs.");
	});

	$("#largeSizeButton").click(function() {
		GM_setValue("emotePreviewSize", 70);
		alert("Now using large emote preview size.");
	});

	$("#regSizeButton").click(function() {
		GM_setValue("emotePreviewSize", 58);
		alert("Now using regular emote preview size.");
	});

	$("#smallSizeButton").click(function() {
		GM_setValue("emotePreviewSize", 40);
		alert("Now using small emote preview size.");
	});

}

function getDefaultTableHTML() {
	return "<div class=\"emoticons_panel\">\
				<div class=\"inner_padding\">\
					<a href=\"javascript:smilie(':ajbemused:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/ajbemused.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':ajsleepy:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/ajsleepy.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':ajsmug:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/ajsmug.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':applecry:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/applecry.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':applejackconfused:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/applejackconfused.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':applejackunsure:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/applejackunsure.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':coolphoto:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/coolphoto.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':derpyderp1:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/derpyderp1.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':derpyderp2:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/derpyderp2.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':derpytongue2:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/derpytongue2.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':fluttercry:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/fluttercry.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':flutterrage:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/flutterrage.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':fluttershbad:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/fluttershbad.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':fluttershyouch:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/fluttershyouch.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':fluttershysad:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/fluttershysad.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':heart:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/heart.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':pinkiecrazy:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/pinkiecrazy.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':pinkiegasp:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/pinkiegasp.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':pinkiehappy:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/pinkiehappy.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':pinkiesad2:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/pinkiesad2.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':pinkiesick:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/pinkiesick.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':pinkiesmile:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/pinkiesmile.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':rainbowderp:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/rainbowderp.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':rainbowdetermined2:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/rainbowdetermined2.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':rainbowhuh:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/rainbowhuh.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':rainbowkiss:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/rainbowkiss.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':rainbowlaugh:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/rainbowlaugh.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':rainbowwild:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/rainbowwild.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':raritycry:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/raritycry.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':raritydespair:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/raritydespair.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':raritystarry:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/raritystarry.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':raritywink:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/raritywink.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':scootangel:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/scootangel.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':trixieshiftleft:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/trixieshiftleft.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':trixieshiftright:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/trixieshiftright.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':twilightangry2:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/twilightangry2.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':twilightblush:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/twilightblush.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':twilightoops:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/twilightoops.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':twilightsheepish:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/twilightsheepish.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':twilightsmile:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/twilightsmile.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':twistnerd:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/twistnerd.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':unsuresweetie:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/unsuresweetie.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':yay:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/yay.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':trollestia:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/trollestia.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':moustache:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/moustache.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':facehoof:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/facehoof.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':eeyup:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/eeyup.png\" style=\"margin:1px;\"></a>\
					<a href=\"javascript:smilie(':duck:');\"><img src=\"//www.fimfiction-static.net/images/emoticons/duck.png\" style=\"margin:1px;\"></a>\
				<br />Comments with more than 20 emoticons will have them stripped\
			</div>\
		</div>";
}

function parseCommentSubmission() {

	var textareaData = $("#comment_comment").val();

	if (textareaData != "") {
		$("#comment_comment").val(emoteShorthandToImages(textareaData));
	}

	AddComment($(".add_comment").children().eq(0));

}

function emoteShorthandToImages(textToConvert) {

	var nameList = $("#emoteNameList").children();
	var urlList = $("#emoteURLList").children();

	for (var i = 0; i < nameList.length; i++) {
		textToConvert = textToConvert.split(nameList.eq(i).html()).join("[img]" + urlList.eq(i).html() + "[/img]");
	}

	return textToConvert;

}

function imagesToEmoteShorthand(textToConvert) {

	var nameList = $("#emoteNameList").children();
	var urlList = $("#emoteURLList").children();

	for (var i = 0; i < nameList.length; i++) {
		textToConvert = textToConvert.split("[img]" + urlList.eq(i).html() + "[/img]").join(nameList.eq(i).html());
	}

	return textToConvert;

}

const __GM_STORAGE_PREFIX = [
    '', 'ffemoteextender', 'Fimfiction-Emote-Extender', ''].join('***');

// All of the GM_*Value methods rely on DOM Storage's localStorage facility.
// They work like always, but the values are scoped to a domain, unlike the
// original functions.  The content page's scripts can access, set, and
// remove these values.
// https://raw.github.com/gist/3123124
function GM_deleteValue(aKey) {
	'use strict';
	localStorage.removeItem(__GM_STORAGE_PREFIX + aKey);
}

function GM_getValue(aKey, aDefault) {
	'use strict';
	let val = localStorage.getItem(__GM_STORAGE_PREFIX + aKey)
	if (null === val && 'undefined' != typeof aDefault) return aDefault;
	return val;
}

function GM_listValues() {
	'use strict';
	let prefixLen = __GM_STORAGE_PREFIX.length;
	let values = [];
	let i = 0;
	for (let i = 0; i < localStorage.length; i++) {
		let k = localStorage.key(i);
		if (k.substr(0, prefixLen) === __GM_STORAGE_PREFIX) {
			values.push(k.substr(prefixLen));
		}
	}
	return values;
}

function GM_setValue(aKey, aVal) {
	'use strict';
	localStorage.setItem(__GM_STORAGE_PREFIX + aKey, aVal);
}