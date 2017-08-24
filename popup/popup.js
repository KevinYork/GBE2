// получаем ссылку на background страницу
browser.runtime.onMessage.addListener(bgListener);
var getting = browser.runtime.getBackgroundPage();
var bg, aTab, aBkmk = null;
var popup = window;
var fTree = null;
var editBkmkDlg = null;
var delBkmkDlg = null;
var editLblDlg = null;
var delLblkDlg = null;
var confirmDlg = null;
var addAllTabsDlg = null;
var dragInfo = {item : null, source : null,	target : null};

getting.then((page) => {bg = page}, (error) => {_errorLog ("Popup-getBackgroundPage", error)});
browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
	aTab = tabs[0];
	console.log(aTab.url);
	aBkmk = bg.GBE2.getBookmark({ url : aTab.url});
	setClickHandlers (aBkmk);
});

function split(val) {
    return val.split(/,\s*/);
}

function extractLast(term) {
    return split(term).pop();
}


function setClickHandlers (aBkmk)
{
	removeClickHandlers();
	$(".hmenuAdd a").attr('title', _getMsg("popup_hmenuAdd"));
	$(".hmenuEdit a").attr('title', _getMsg("popup_hmenuEdit"))
	$(".hmenuDel a").attr('title', _getMsg("popup_hmenuDel"))
	$(".hmenuReadLater a").attr('title', _getMsg("popup_hmenuReadLater"))
	
	if (aBkmk !== null) {
		$(".hmenuAdd a, .hmenuReadLater a")
			.addClass('disabled-link')
			.click(function(event) {
				return false;
			});	
		$(".hmenuEdit a")
			.removeClass('disabled-link')
			.click(function(event) {
				openBkmkDialog(aBkmk);
		});
		$(".hmenuDel a")
			.removeClass('disabled-link')
			.click(function(event) {
				// $("#delBkmkDlg label").text(_getMsg("delBkmkDlg_label", aBkmk.title));
				openDelBkmkDlg(aBkmk);
		});
	}
	else {
		$(".hmenuAdd a")
			.removeClass('disabled-link')
			.click(function(event) {
				openBkmkDialog({id: null, title: aTab.title, url: aTab.url, labels: "", notes: "", favIconUrl: aTab.favIconUrl});
		});
		$(".hmenuReadLater a")
			.removeClass('disabled-link')
			.click(function(event) {
				readLater({id: null, title: aTab.title, url: aTab.url, labels: "", notes: "", favIconUrl: aTab.favIconUrl});
		});
		$(".hmenuEdit a")
			.addClass('disabled-link')
			.click(function(event) {
				return false;
		});
		$(".hmenuDel a")
			.addClass('disabled-link')
			.click(function(event) {
				return false;
		});

	}
}

function removeClickHandlers () {
	$(".hmenuAdd a, .hmenuEdit a").off( "click", "**" );
}

function isSpecialUrl (url) {
	let SearchString = new RegExp("^chrome:|^javascript:|^data:|^about:|^file:.*" );
	return SearchString.test(url);
}

function showURL (url, newTab = true, activate = true)
{
	if (url.length) {
		if (isSpecialUrl(url)) {
			console.log("You are trying open url: " + url);
			console.log("But in Firefox Webextension, you can't open or navigate to privileged URLs: chrome:, javascript:, data:, about:");
			console.log("https://developer.mozilla.org/ru/Add-ons/WebExtensions/Chrome_incompatibilities");
		}
		else {
			if (newTab)
			{
				browser.tabs.create({active: activate, url: url});
			}
			else {
				browser.tabs.update(aTab.id,{url: url});
			}
		}
	}
}

function showURLinNewWindow(url, private = false)
{
	if (url.length) {
		if (private) {
			browser.windows.create({url: url, incognito: true})
		}
		else {
			browser.windows.create({url: url})
		}
	}
}
function filteredLabelAction (node) {
	$("#filterTextbox").val("");
	let tree = $.ui.fancytree.getTree();
	resetFilter();
	node.setExpanded();//.scrollIntoView();
}

$(document).ready(function(){
  $("#bkmk-tree").fancytree({
  	extensions: ["filter", "dnd", "edit"],
		quicksearch: true,
  	autoScroll: true, // Automatically scroll nodes into visible area
    clickFolderMode: 4, // 1:activate, 2:expand, 3:activate and expand, 4:activate (dblclick expands)
    debugLevel: 1, // 0:quiet, 1:normal, 2:debug
    focusOnSelect: false, // Set focus when node is checked by a mouse click
    quicksearch: true, // Navigate to next node by typing the first letters
    selectMode: 1, // 1:single, 2:multi, 3:multi-hier
    tabindex: "-1", // Whole tree behaves as one single control
    tooltip: true, // Use title as tooltip (also a callback could be specified)
  	source: bg.GBE2.m_treeSource,
  	// обработчик кликов по закладкам и меткам
  	click: function(event, data) {
  		console.log("FT_click " + event.originalEvent.which);
	    let node = data.node,
        // Only for click and dblclick events:
        // 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon'
        targetType = data.targetType;
      // if (targetType == "title" ) {
      if (targetType == "title" || targetType == "icon") {
      	// if ($("#filterTextbox").val() !== "" && event.originalEvent.which == 1 && node.isFolder()) {
      	// 	// $("#filterTextbox").val("");
      	// 	// let tree = $.ui.fancytree.getTree();
      	// 	// resetFilter();
      	// 	filteredLabelAction(node);
      	// 	return true;
      	// }

      	// // левый клик по закладкам - открываем в новой вкладке (по-умолчанию), если reverseLeftClick = false
      	// // which: left button - 1, middle button - 2
      	// if (event.originalEvent.which == 1 && !node.isFolder())	{
      	// 	showURL(node.data.url, !bg.GBE2.opt.reverseLeftClick, true);
      	// 	// return false;
      	// 	window.close();
      	// }
      	// клик колесиком (средней кнопкой)
      	if (event.originalEvent.which == 2) {
      		if (node.isFolder())
      			// по метке - открываем вложенные закладки
      			labelMenuOpenAll({id: node.key, name: node.data.path});
    			else
    				// по закладке - открываем в той же вкладке (по-умолчанию), если reverseLeftClick = false
      			showURL(node.data.url, bg.GBE2.opt.reverseLeftClick);
      		window.close();
      	}
      }
      // if (targetType == "icon" && event.originalEvent.which == 3) {
      // 	console.log(node.key);
      // 	$("#bkmk-tree").contextmenu("open", $(node));
      // }
	  },
	  keydown: function(event, data) {
	  	let node = data.node;
	  	if (event.which == 13)
	  		if (!node.isFolder()) {
		  		showURL(node.data.url, !bg.GBE2.opt.reverseLeftClick, true);
		  		window.close();
	  		}
	  		else {
	  			if ($("#filterTextbox").val() !== "") filteredLabelAction(node);
	  		}
	  },
	  enhanceTitle: function(event, data) {
		  
	  // 	if( !node.isFolder() && node.data.url.length && node.data.icon == "../images/bkmrk.png" && !isSpecialUrl(node.data.url)) {
	  // 		if (bg.GBE2.opt.favIcons.hasOwnProperty(node.data.url)) {
	  // 			let favicon = bg.GBE2.opt.favIcons[node.data.url];
	  // 			console.log(favicon);
	  // 			img.attr('src', favicon);
	  // 		}
			// }
	  	if (bg.GBE2.opt.showFavicons) {
	  		let node = data.node;
				let img = $(node.span).find("img.fancytree-icon");
		    if( !node.isFolder() ) { 
	    	  img.on("error", function() {
	    			$(this).attr("src", "../images/bkmrk.png")
	    		});
		    // if( !node.isFolder() && node.data.url.length && !isSpecialUrl(node.data.url)) { 
		   //  	// let favicon = "https://icons.better-idea.org/icon?url=" + encodeURIComponent(node.data.url) +"&size=32";
		   //  	let favicon = "http://www.google.com/s2/favicons?domain_url=" + encodeURIComponent(node.data.url);
		   //  	$.ajax({
					// 	url: "http://www.google.com/s2/favicons",
					// 	method: "GET",
					// 	data: { domain_url : node.data.url }
					// })
					// .then(() => { img.attr('src', favicon);})
					// .catch(() => { img.attr('src', "../images/bkmrk.png");} );
		    }
	  	}
	  },
	  renderNode: function (event, data) {
	  	//console.log(data.node);
	  	// $(data.node).addEventListener('contextmenu', function(){
			$(data.node).find("span.fancytree-title").contextmenu(function(){
			  // Trigger popup menu on the first target element
			  console.log("contextmenu" + data.node.data.url);
			  // $(document).contextmenu("open", $(".hasmenu:first"), {foo: "bar"});
			});

	  },
	  filter: {
			autoApply: true,   // Re-apply last filter if lazy data is loaded
			autoExpand: true, // Expand all branches that contain matches while filtered
			counter: false,     // Show a badge with number of matching child nodes near parent icons
			fuzzy: false,      // Match single characters in order, e.g. 'fb' will match 'FooBar'
			hideExpandedCounter: true,  // Hide counter badge if parent is expanded
			hideExpanders: false,       // Hide expanders if all child nodes are hidden by filter
			highlight: true,   // Highlight matches by wrapping inside <mark> tags
			leavesOnly: false, // Match end nodes only
			nodata: true,      // Display a 'no data' status node if result is empty
			mode: "hide"       // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
		},
    dnd: {
      autoExpandMS: 400,
      focusOnClick: true,
      preventVoidMoves: true, // Prevent dropping nodes 'before self', etc.
      preventRecursiveMoves: true, // Prevent dropping nodes on own descendants
      dragStart: function(node, data) {
      	if (node.data.ignoreMe) return false;
      	dragInfo.item = data.node;
      	let parent = data.node.getParent();
      	dragInfo.source = (parent.key == "root_1") ? null : parent;
      	console.log("dragStart");
      	console.log(dragInfo);
        /** This function MUST be defined to enable dragging for the tree.
         *  Return false to cancel dragging of node.
         */
        return true;
      },
      dragEnter: function(node, data) {
        if (node.data.ignoreMe || !node.isFolder()) return false;
        let parent = data.node.getParent();
        if (parent.key !== "root_1" || (parent.key == data.otherNode.getParent().key))
        	return ["over"];
        /** data.otherNode may be null for non-fancytree droppables.
         *  Return false to disallow dropping on node. In this case
         *  dragOver and dragLeave are not called.
         *  Return 'over', 'before, or 'after' to force a hitMode.
         *  Return ['before', 'after'] to restrict available hitModes.
         *  Any other return value will calc the hitMode from the cursor position.
         */
        // Prevent dropping a parent below another parent (only sort
        // nodes under the same parent)
/*           if(node.parent !== data.otherNode.parent){
          return false;
        }
        // Don't allow dropping *over* a node (would create a child)
        return ["before", "after"];
*/				
				// return ["over"];
        return true;
      },
      dragDrop: function(node, data) {
        /** This function MUST be defined to enable dropping of items on
         *  the tree.
         */
        console.log ("dragDrop "+ data.hitMode)
        dragInfo.target = node;
        if ((data.hitMode == "before" || data.hitMode == "after") && node.getParent().key == "root_1")
          dragInfo.target = null;
        console.log(dragInfo.item.title + "|" 
        	+ (dragInfo.source == null ? dragInfo.source : dragInfo.source.data.path) + "|" 
        	+ (dragInfo.target == null ? dragInfo.target : dragInfo.target.data.path));

        if (dragInfo.item.isFolder()) {
        	let label = {name : "", oldName : dragInfo.item.data.path};
        	if (dragInfo.target == null)
        		label.name = dragInfo.item.title
        	else
        		label.name = dragInfo.target.data.path + bg.GBE2.opt.nestedLabelSep + dragInfo.item.title;
        	console.log(label);
        	browser.runtime.sendMessage({
	      		"type": "editLabel",
	      		"data": label
      		}).then((result) => {
          	
      		});

        } else {
        	let bkmk = Object.assign({oldUrl : ""}, bg.GBE2.getBookmark({ id : dragInfo.item.refKey}));
        	// let lbls = [];
        	if (dragInfo.target == null) {
	        	bkmk.labels = [];
        	}
	        else {
	        	if (dragInfo.source == null){
	        		bkmk.labels = [dragInfo.target.data.path];
	        	}
	        	else {
		        	let index = bkmk.labels.indexOf(dragInfo.source.data.path);
		        	if (index) {
		        	  	bkmk.labels[index] = dragInfo.target.data.path;
		        	  	bkmk.labels.sort(function (a, b) {
		        	  	  return a.localeCompare(b);
		        	  	});
		        	  	//bkmk.labels = bkmk.labels.join();
		        	}
		        	else {
		        		bkmk.labels = [dragInfo.target.data.path];
		        	}
		        }
	      	}
        	//если в исходной метке была только эта закладка, метку надо удалить
    			let mvNode = data.otherNode;
      		let oldParent = mvNode.getParent();
    			let rmvOldParent = false;
  				if (oldParent !== null && oldParent.getChildren().length == 1)
  				// if (oldParent !== null && oldParent.getChildren().filter(x => !x.isFolder()).length == 1)
  				{
  					rmvOldParent = true;
  				}
	        
        	browser.runtime.sendMessage({
	      		"type": "moveBookmark",
	      		"data": {
	      			"bkmk" :	bkmk,
	      			"oldParent" : rmvOldParent ? oldParent.data.path : null
	      		}
      		}).then((result) => {
      			let children = null;
      			if (bkmk.labels.length == 0) {
      				let tree = $("#bkmk-tree").fancytree("getTree");
      				children = tree.rootNode.getChildren();
      			}
      			else {
      				children = node.getChildren();
      			}
    				let flag = 0;
    				let child = null;
    				if (children.length>0) {
    					child = children[children.length-1];
    					flag = bg.GBE2.opt.sortType == "timestamp" ? bg.GBE2.compareByDate(mvNode.data, child.data) : bg.GBE2.compareByName(mvNode, child);
    					if (flag == 1 || child.isFolder()) {
    						mvNode.moveTo(child, "after");
    						mvNode.scrollIntoView(false);
    					}
    					else {
		    				for (child of children) {
		    				  if (child.isFolder()) continue;
		    					flag = bg.GBE2.opt.sortType == "timestamp" ? bg.GBE2.compareByDate(mvNode.data, child.data) : bg.GBE2.compareByName(mvNode, child);
		    					if (flag == -1) {
		    						mvNode.moveTo(child, "before");
		    				    break;
		    					}
		    				}
		    			}
		        	//если в исходной метке была только эта закладка, метку надо удалить
		    			if (rmvOldParent) {
	    					// удаляем из #bkmk-tree
	    					oldParent.remove();
	    				}
	    			}
      		});
	        
        }
      },
      dragStop: function(node, data) {
      	dragInfo = {item : null, source : null,	target : null};
    	},
    },
    activate: function(event, data) {
			console.log("activate " + data.node);
    },

  });

  fTree = $("#bkmk-tree").fancytree("getTree");

  let hiddenPKey  = bg.GBE2.genereteLabelId(bg.GBE2.opt.hiddenLabelsTitle);

  $("#bkmk-tree").contextmenu({
    delegate: "span.fancytree-title, img.fancytree-icon, span.fancytree-expander",
    addClass : "GBE-ui-contextmenu",
    autoFocus: true,
    autoTrigger : true,
    // hide : "fast",
    show : "fast",
//      menu: "#options",
    menu: [
    	// folder (label) menu
      {title: _getMsg("cntx_folder_menuEdit"), cmd: "menuEdit", uiIcon: "cntx-folder-menuEdit"},
      {title: _getMsg("cntx_folder_menuRemove"), cmd: "menuRemove", uiIcon: "cntx-folder-menuRemove"},
      {title: "----", cmd: "msepf"},
      {title: _getMsg("cntx_folder_menuOpenAll"), cmd: "menuOpenAll", uiIcon: "cntx-folder-menuOpenAll"},
      {title: "----", cmd: "msepf"},
      {title: _getMsg("cntx_folder_menuAddHere"), cmd: "menuAddHere", uiIcon: "cntx-folder-menuAddHere"},
      {title: _getMsg("cntx_folder_menuAddAllTabs"), cmd: "menuAddAllTabs", uiIcon: "cntx-folder-menuAddAllTabs"},
      {title: "----", cmd: "msepf"},
      {title: _getMsg("cntx_folder_menuHideFolder"), cmd: "menuHideFolder", uiIcon: "cntx-folder-menuHideFolder"},
      {title: _getMsg("cntx_folder_menuUnhideFolder"), cmd: "menuUnhideFolder", uiIcon: "cntx-folder-menuUnhideFolder"},
      {title: _getMsg("cntx_folder_menuUnhideAll"), cmd: "menuUnhideAll", uiIcon: "cntx-folder-menuUnhideAll"},
      {title: "----", cmd: "msepf"},
      {title: _getMsg("cntx_folder_menuExport"), cmd: "menuExport"},
      // bookmark menu
      {title: (bg.GBE2.opt.reverseLeftClick ? _getMsg("cntx_page_inNewTab") : _getMsg("cntx_page_go")), 
      	cmd: "page-go", uiIcon: "cntx-page-go"},
      {title: _getMsg("cntx_page_newWidow"), cmd: "page-newWidow"},
      {title: _getMsg("cntx_page_newPrivate"), cmd: "page-newPrivate"},
      {title: "----", cmd: "msepp"},
      {title: _getMsg("cntx_page_edit"), cmd: "page-edit", uiIcon: "cntx-page-edit"},
      {title: _getMsg("cntx_page_delete"), cmd: "page-delete", uiIcon: "cntx-page-delete"},
      {title: "----", cmd: "msepp"},
      {title: _getMsg("cntx_qrcode_icon"), cmd: "qrcode-icon", uiIcon: "cntx-qrcode-icon"},
      {title: "E-mail...", cmd: "bookmark-emai", uiIcon: "cntx-bookmark-emai"},
      {title: "Facebook...", cmd: "bookmark-fbshare", uiIcon: "cntx-bookmark-fbshare"},
      {title: "Twitter...", cmd: "bookmark-twshare", uiIcon: "cntx-bookmark-twshare"},
    ],
    beforeOpen: function(event, ui) {
    	// console.log("beforeOpen");
      var node = $.ui.fancytree.getNode(ui.target);
      // Modify menu entries depending on node status
      $("#bkmk-tree").contextmenu("enableEntry", "paste", node.isFolder());
      // Show/hide single entries
      if (node.isFolder()) {
      	if (node.title == bg.GBE2.m_RecentLabel || node.title == bg.GBE2.m_VisitedLabel) return false;
      	$("#bkmk-tree").contextmenu("showEntry", "menuEdit", true);
      	$("#bkmk-tree").contextmenu("showEntry", "menuRemove", true);
      	$("#bkmk-tree").contextmenu("showEntry", "menuOpenAll", true);
      	$("#bkmk-tree").contextmenu("showEntry", "menuAddHere", true);
      	$("#bkmk-tree").contextmenu("showEntry", "menuAddAllTabs", true);
      	$("#bkmk-tree").contextmenu("showEntry", "menuExport", true);
      	$("#bkmk-tree").contextmenu("showEntry", "msepf", true);

      	$("#bkmk-tree").contextmenu("showEntry", "menuHideFolder", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuUnhideFolder", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuUnhideAll", false);
      	
      	if (bg.GBE2.opt.enableLabelHiding) {
      		if (hiddenPKey == node.key)
	      		$("#bkmk-tree").contextmenu("showEntry", "menuUnhideAll", true);
					else if (node.data.hidden)      		
	      		$("#bkmk-tree").contextmenu("showEntry", "menuUnhideFolder", true);
	      	else
	      		$("#bkmk-tree").contextmenu("showEntry", "menuHideFolder", true);
      	}
      	//TODO: добавить скрытие/отображение для отдельных закладок

      	$("#bkmk-tree").contextmenu("showEntry", "page-go", false);
      	$("#bkmk-tree").contextmenu("showEntry", "page-newWidow", false);
      	$("#bkmk-tree").contextmenu("showEntry", "page-newPrivate", false);
      	$("#bkmk-tree").contextmenu("showEntry", "page-edit", false);
      	$("#bkmk-tree").contextmenu("showEntry", "page-delete", false);
      	$("#bkmk-tree").contextmenu("showEntry", "qrcode-icon", false);
      	$("#bkmk-tree").contextmenu("showEntry", "bookmark-emai", false);
      	$("#bkmk-tree").contextmenu("showEntry", "bookmark-fbshare", false);
      	$("#bkmk-tree").contextmenu("showEntry", "bookmark-twshare", false);
      	$("#bkmk-tree").contextmenu("showEntry", "msepp", false);
			}
      else {
      	$("#bkmk-tree").contextmenu("showEntry", "page-go", true);
      	$("#bkmk-tree").contextmenu("showEntry", "page-newWidow", true);
      	$("#bkmk-tree").contextmenu("showEntry", "page-newPrivate", true);
      	$("#bkmk-tree").contextmenu("showEntry", "page-edit", true);
      	$("#bkmk-tree").contextmenu("showEntry", "page-delete", true);
      	$("#bkmk-tree").contextmenu("showEntry", "qrcode-icon", true);
      	$("#bkmk-tree").contextmenu("showEntry", "bookmark-emai", true);
      	$("#bkmk-tree").contextmenu("showEntry", "bookmark-fbshare", true);
      	$("#bkmk-tree").contextmenu("showEntry", "bookmark-twshare", true);
      	$("#bkmk-tree").contextmenu("showEntry", "msepp", true);

      	$("#bkmk-tree").contextmenu("showEntry", "menuEdit", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuRemove", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuOpenAll", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuAddHere", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuAddAllTabs", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuHideFolder", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuUnhideFolder", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuUnhideAll", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuExport", false);
      	$("#bkmk-tree").contextmenu("showEntry", "msepf", false);
      	
      }

      // Activate node on right-click
      node.setActive();
      // Disable tree keyboard handling
      ui.menu.prevKeyboard = node.tree.options.keyboard;
      node.tree.options.keyboard = false;
    },
    close: function(event, ui) {
      // Restore tree keyboard handling
      // console.log("close", event, ui, this)
      // Note: ui is passed since v1.15.0
      var node = $.ui.fancytree.getNode(ui.target);
      node.tree.options.keyboard = ui.menu.prevKeyboard;
      node.setFocus();
    },
    select: handleContextMenuClick
  });
  // обработчик кликов по закладкам и меткам
	$("#bkmk-tree").on("click", function(event) {
		let node = $.ui.fancytree.getNode(event),
      // Only for click and dblclick events:
      // 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon'
      targetType = $.ui.fancytree.getEventTargetType(event);
      console.log("click " + event.originalEvent.which)
    // if (targetType == "title" ) {
    if (targetType == "title" || targetType == "icon") {
    	if ($("#filterTextbox").val() !== "" && event.originalEvent.which == 1 && node.isFolder()) {
    		// $("#filterTextbox").val("");
    		// let tree = $.ui.fancytree.getTree();
    		// resetFilter();
    		filteredLabelAction(node);
    		return true;
    	}
    	// левый клик по закладкам - открываем в новой вкладке (по-умолчанию), если reverseLeftClick = false
    	// which: left button - 1, middle button - 2
    	if (event.originalEvent.which == 1 && !node.isFolder())	{
    		showURL(node.data.url, !bg.GBE2.opt.reverseLeftClick, true);
    		// return false;
    		window.close();
    	}
    	// клик колесиком (средней кнопкой)
    	if (event.originalEvent.which == 2) {
    		if (node.isFolder())
    			// по метке - открываем вложенные закладки
    			labelMenuOpenAll({id: node.key, name: node.data.path});
  			else
  				// по закладке - открываем в той же вкладке (по-умолчанию), если reverseLeftClick = false
    			showURL(node.data.url, bg.GBE2.opt.reverseLeftClick);
    		window.close();
    	}
    }
    // if (targetType == "icon" && event.originalEvent.which == 3) {
    // 	console.log(node.key);
    // 	$("#bkmk-tree").contextmenu("open", $(node));
    // }
  }
  );

	$(".filterHBox label").text(_getMsg("popup_filterLabel"));

	$("#editBkmkDlg").attr("title", _getMsg("editBkmkDlg_title"));
	$("label[for='editBkmkDlg-name']").text(_getMsg("editBkmkDlg_name"));
	$("label[for='editBkmkDlg-url']").text(_getMsg("editBkmkDlg_url"));
	$("label[for='editBkmkDlg-labels']").text(_getMsg("editBkmkDlg_labels"));
	$("label[for='editBkmkDlg-notes']").text(_getMsg("editBkmkDlg_notes"));
	
	//отключаем контекстное меню на кнопках дополнения
	$(".nav-bar li").on("contextmenu",function(){
   return false;
	}); 

	console.log("I am popup.js");

	if (bg.GBE2.m_needRefresh) {
		bg.GBE2.m_needRefresh = false;
		refresh();
	}

	// если m_dlgInfo.needOpen == true, то необходимо открыть диалог редактирования закладки
	// с параметрами из m_dlgInfo
	if (bg.GBE2.m_dlgInfo !== null && bg.GBE2.m_dlgInfo.needOpen && !bg.GBE2.m_needRefresh)
	{
		// $("#editBkmkDlg-name").val(bg.GBE2.m_dlgInfo.title);
		// $("#editBkmkDlg-url").val(bg.GBE2.m_dlgInfo.url);
		bg.GBE2.m_dlgInfo.needOpen = false;
		// setTimeout(() => {
		openBkmkDialog(
			{id: null, title: bg.GBE2.m_dlgInfo.title, url: bg.GBE2.m_dlgInfo.url, labels: "", notes: "", favIconUrl: bg.GBE2.m_dlgInfo.favIconUrl}
		);
		$("#editBkmkDlg").dialog('option', 'position', { my: "center", at: "center", of: "#wrapper" })
		// }, 100);
	}
	if (aTab){
		aBkmk = bg.GBE2.getBookmark({ url : aTab.url});
		setClickHandlers (aBkmk);
	}
	// назначем обработчики кнопок
	// 
	// обновление списка закладок
	$(".hmenuRefresh a")
		.attr('title', _getMsg("popup_hmenuRefresh"))
		.click(function(event) { 
			refresh();	
	});

	$(".hmenuOpt a")
		.attr('title', _getMsg("popup_hmenuOpt"))
		.click(function(event) {
			openOptionsPage();
	});

/*	$(".hmenuDel a").click(function(event) {
		// browser.tabs.executeScript(null, {
		//       file: "/content/content.js"
  //   });
    console.log ("aTab  " + aTab.url);
    	// if (aTab.url == "" || aTab.url.indexOf("about:") == 0 )
    	// {
    		// console.log ("url 1  " + aTab.url);
    		openBkmkDialog("editBkmkDlg");
    	// }
    	// else
    	// {
    	// 	console.log ("url 2  " + aTab.url);
     //  	window.close();
     //  	browser.tabs.sendMessage(aTab.id, {type: "ShowEditDialog", message: "Show Edit Bookmark Dialog"});
     //  }
	});*/


	$(".hmenuAddOpenTabs a")
		.attr('title', _getMsg("popup_hmenuAddOpenTabs"))
		.click(function(event) {
			//test1();
			openAddAllTabsDlg();
	});

	//"Read Later" Label: Unread Bookmarks
	
	$(".hmenuGBs a")
		.attr('title', _getMsg("popup_hmenuGBs"))
		.click(function(event) {
			showURL("https://www.google.com/bookmarks/");
			window.close();
	});

	// клик на QR-коде - открываем его в новой вкладке 
	$("#qr_dialog_image").on("click", function () {
		showURL($(this).attr("src"));
		// chrome.tabs.create({active: true, url: $(this).attr("src")});
		window.close();
	});

	// разрешение/запрет редактирования адреса
	$("#editBkmkDlg-enableUrlEdit").on("click", function() {
		let urlCtrl = $("#editBkmkDlg-url");
		// включили флаг - снимаем readonly атрибут
		if ($(this).prop("checked")) {
			urlCtrl.attr("readonly",false);
		}
		// выключили - ставим readonly и возвращаем исходное значение
		else {
			urlCtrl.attr("readonly",true);
			urlCtrl.val($("#editBkmkDlg-oldUrl").val());
		}
	});

	$("a.clrBtn").on("keypress click", (e) => {
		if (e.type = "click" && (e.which == 1 || e.which == 13 || e.which == 32)) {
			$("#filterTextbox").val('').focus();
			resetFilter();
    }
	});

	$("#filterTextbox").keyup(function(e){
		let n,
				tree = $.ui.fancytree.getTree(),
				match = $(this).val();
		clearTimeout($.data(this, 'timer'));

		if(e && e.which === $.ui.keyCode.ESCAPE || $.trim(match) === "" || $.trim(match) === '"'){
			// console.log("filter 2 " + e.which);
			resetFilter();
			return false;
		}
		$("a.clrBtn").css({display: 'inline'});
		var wait = setTimeout(filter, 200);
		$(this).data('timer', wait);
		function filter() {
			n = tree.filterNodes(function(node) {
				if( node.data.ignoreMe ) {
				    return "skip";  // don't match anythin inside this branch
				}
				let bkmk = {
					title : node.title,
					notes : node.data.notes ? node.data.notes : "",
					url : node.data.url ? node.data.url : ""
				}
				let replacement = '<mark>$&</mark>';
				let check = bg.GBE2.checkBookmark(bkmk, match);
				if (check.isMatch && node.isFolder()) 
				{
					node.titleWithHighlight = node.title.replace(check.search, replacement);
					return "branch";  // match the whole 'Foo' branch, if it's a folder
				}
				else {
					if (check.search !== "") 
						node.titleWithHighlight = node.title.replace(check.search, replacement);
					else
						node.titleWithHighlight = (check.extra == null) ? node.title : `<mark class="${check.extra.class}">${check.extra.text}</mark>` + node.title;
					return check.isMatch;
				}

			});
		}
	}).focus();

	setTimeout (() => {$("#filterTextbox").focus();}, 200);
	$("#bkmk-tree ul").attr("tabindex", "3");
	// $("*").on("focus", e => {console.log(e.target)})

}); // document ready

function resetFilter(){
	$("a.clrBtn").css({display: 'none'})
	fTree.clearFilter();
}

/**
 * проверяет закладку/метку на соответствие значению фильтра
 *
 * @param      {object}  bkmk    информация о закладке в виде bkmk = {	title, notes, url }
 * @param      {string}  search  строка поиска
 * 
 * возвращает result = {
 * 	isMatch: false,  - совпадает или нет
 * 	search: "", - регулярка для выделения найденого в заголовке закладки
 * 	extra: [] - добавляется в начало заголовка (для url и notes)
 * }
 */
//  function checkBookmark (bkmk, search) {
// 	let result = {isMatch: false, search: "", extra: []};
// 	let enableFilterByUrl = bg.GBE2.opt.enableFilterByUrl;
// 	let enableFilterByNotes = bg.GBE2.opt.enableFilterByNotes;

// 	// если в строке нечетное число кавычек, например
// 	// "
// 	// "значение
// 	// знач1 "знач2
// 	// "знач1" знач2 "знач3
// 	if (Math.abs((search.match(/"/g) || []).length % 2) == 1) {
// 		var pos = search.lastIndexOf('"');
// 		// удаляем последнюю кавычку
// 	  search = search.substring(0,pos) + "" + search.substring(pos+1)
// 		if (search.length == 0) {
// 			result.isMatch = true; 
// 			return result;
// 		}
// 	}

// 	// проверка на "значение поиска с пробелами"
// 	// учитывается только одно вхождение
// 	let result0 = /"(.*?\s.*?)"/i.exec(search);
// 	if (result0 && Array.isArray(result0) && result0.length == 2){
//     let search = _escape(result0[1]);
//     // search1 = escape(result0[1].replace(/"/g,""));
//     let tRe = new RegExp(search, "i");
//     if (tRe.test(bkmk.title)) {
//        result.isMatch = true; 
//        result.search = tRe;
//        return result;
//     }    
// 	}
// 	// делим значение поиска по пробелам
// 	var words = search.split(/\s+/);
// 	// формируем регулярки для поиска и выделения
// 	// если слов несколько - должны встречаться все слова
// 	var tSearch = "(?:";
// 	var tMark = "";
// 	words.forEach((elem) => {
//     if (elem.length == 0) return;
//     // вариант для слова в кавычках - ищем целое слово
//     if (/"\S*?"/ig.test(elem))
//     {
//       var elem = _escape(elem.replace(/"/g,""));
//       // tSearch += '(?=.*\\b(' + elem + ')(?=\\s|$|[,.:;]))';
//       tSearch += '(?=.*([^0-9a-zA-Zа-яёА-ЯЁ]|\\b)(' + elem + ')(?=\\s|$|[,.:;]))';
//       // tMark += '(?=([^0-9a-zA-Zа-яёА-ЯЁ]+|\\b)(' + elem + ')(?=\\s|$|[,.:;]))|';
//       tMark += '(?:([^0-9a-zA-Zа-яёА-ЯЁ]{0}|\\b)(' + elem + ')(?=\\s|$|[,.:;]))|';
//     }
//     // без кавычек - любое соответствие
//     else {
//       var elem = _escape(elem);
//       tSearch += '(?=.*(' + elem + '))';
//       tMark += '(' + elem + ')|';
//     }
// 	});
// 	tSearch += '.+)';
// 	tMark = tMark.substring(0, tMark.length - 1);
// 	var reSearch = new RegExp(tSearch, "ig");
// 	// console.log (reSearch);
// 	var reMark = new RegExp(tMark, "ig");
// 	// console.log (reMark);

// 	// поиск в заголовке закладки
// 	let match = reSearch.exec(bkmk.title);
// 	if (match) {
// 		result.isMatch = true; 
// 		result.search = reMark;
// 		return result;
// 	}

// 	result.search = "";
// 	// поиск в примечании
// 	if (enableFilterByNotes && bkmk.notes.length > 0) {
// 		match = (new RegExp(tSearch, "ig")).exec(bkmk.notes);
// 		if (match) {
// 			result.isMatch = true; 
// 			result.extra = "<mark class='markNote'>NOTE</mark>";
// 			return result;
// 		}
// 	}
// 	// поиск в Url
// 	if (enableFilterByUrl && bkmk.url.length > 0) {
// 		match = (new RegExp(tSearch, "ig")).exec(bkmk.url);
// 		if (match) {
// 			result.isMatch = true; 
// 			result.extra = "<mark class='markUrl'>URL</mark>";
// 			return result;
// 		}
// 	}
// 	return result;
// }


function setBkmkControls (bkmk)
{
	$("#editBkmkDlg-name").val(bkmk.title);
	$("#editBkmkDlg-url").val(bkmk.url);
	$("#editBkmkDlg-labels").val(bkmk.labels);
	$("#editBkmkDlg-notes").val(bkmk.notes);
	$("#editBkmkDlg-id").val(bkmk.id);
	if (bkmk.labels.length > 0) 
	{
		$("#editBkmkDlg-labels").val(bkmk.labels + ",");
	}
	$("#editBkmkDlg-notes").val(bkmk.notes);

	if (bkmk.hasOwnProperty("favIconUrl") && bkmk.favIconUrl) {
		console.log(bkmk.favIconUrl);
		$("#editBkmkDlg-favIconUrl").val(bkmk.favIconUrl);
	}

	if (bkmk.id == null) 	{
		$("#editBkmkDlg-enableUrlEdit").attr("disabled",true);
	}
	else {
		// $("#editBkmkDlg-id").val(bkmk.id);
		$("#editBkmkDlg-oldUrl").val(bkmk.url);
		$("#editBkmkDlg-enableUrlEdit").prop("checked", false).attr("disabled",false);
		$("#editBkmkDlg-url").attr("readonly",true);
		if (!bg.GBE2.opt.enableNotes && bkmk.notes == "") {
			bg.GBE2.doRequestBookmarkNote(bkmk)
			.then(result => {
				$("#editBkmkDlg-notes").val(result);
			})
			.catch((error) => {
	    	_errorLog("popup:setBkmkControls", error);
 	 		});
		}
		bkmk.url = "";
		if (bkmk.url == "") {
			bg.GBE2.doRequestBookmarkURL(bkmk)
			.then(result => {
				$("#editBkmkDlg-oldUrl").val(result.url);
				$("#editBkmkDlg-url").val(result.url);
			})
			.catch((error) => {
	    	_errorLog("popup:setBkmkControls", error);
 	 		});
		}
	}
}

function readLater (bkmk) {
	bkmk.labels = ["!Read Later"];
	bkmk.oldUrl = "";
	browser.runtime.sendMessage({
		"type": "editBookmark",
		"data": bkmk
	}).then();
}

// function openBkmkDialog (dlgName)
function openBkmkDialog (bkmk)
{
	// var dlg = $("#" + dlgName);
	if (editBkmkDlg == null)
	{
		editBkmkDlg = $("#editBkmkDlg");
		editBkmkDlg.dialog({
			dialogClass: "no-close",
      autoOpen: false,
      modal: true,
      draggable: true,
      resizable: false,
      position: { my: "center", at: "center", of: "#wrapper" },
      // closeOnEscape: false
      // minWidth: "480px",
      width: 500,
      buttons: [
        {
          text: _getMsg("btn_Save"),
          click: function() {
          	let result = {
	          	id: $("#editBkmkDlg-id").val().trim(),
	          	oldUrl: $("#editBkmkDlg-oldUrl").val().trim(),
	          	title: $("#editBkmkDlg-name").val().trim(),
	          	url: $("#editBkmkDlg-url").val().trim(),
	          	labels: $("#editBkmkDlg-labels").val().trim(),
	          	notes: $("#editBkmkDlg-notes").val().trim(),
	          	favIconUrl: $("#editBkmkDlg-favIconUrl").val().trim(),
          	}
          	// console.log ("|" + result.oldUrl + "|");
          	browser.runtime.sendMessage({
		      		"type": "editBookmark",
		      		"data": result
	      		}).then((result) => {
	      			setBkmkControls({id: null, title: "", url: "", labels: "", notes: "", favIconUrl: ""});
            	$(this).dialog("close");
	      		});
          }
        },
        {
          text: _getMsg("btn_Cancel"),
          click: function() {
          	setBkmkControls({id: null, title: "", url: "", labels: "", notes: ""});
            $(this).dialog("close");
          }
        },
      ],
      close: function( event, ui ) {$("#wrapper").width("350px");}
     });
	}
	$("#wrapper").width("500px");
	setBkmkControls(bkmk);

	$('#editBkmkDlg-labels').autocomplete({
	  minLength: 1,
	  delay: 50,
	  source: labelAutocompleteSource,
	  focus: function () {return false;},
	  select: labelAutocompleteSelect
	});

	editBkmkDlg.dialog("open");
}


function labelAutocompleteSource (request, response) {
  let term = request.term;

  // substring of new string (only when a comma is in string)
  if (term.indexOf(', ') > 0) {
      var index = term.lastIndexOf(', ');
      term = term.substring(index + 2);
  }

  // regex to match string entered with start of suggestion strings
  let re = $.ui.autocomplete.escapeRegex(term);
  let matcher = new RegExp("(^|"+ bg.GBE2.opt.nestedLabelSep + ")"+ re, 'i');
  let tLabelArray = $.grep(bg.GBE2.m_labelsList, function (item, index) {
      return matcher.test(item.title);
  // let regex_validated_array = $.grep(bg.GBE2.m_labelsArr, function (item, index) {
  //     return matcher.test(item);
  });
  let regex_validated_array = [];
	tLabelArray.forEach((element, index) => {
	  regex_validated_array.push(element.title);
	});
  // pass array `regex_validated_array ` to the response and 
  // `extractLast()` which takes care of the comma separation

  response($.ui.autocomplete.filter(regex_validated_array, 
       extractLast(term)));
}

function labelAutocompleteSelect (event, ui)
{
  var TABKEY = 9;
	if (event.keyCode == TABKEY) { 
    event.preventDefault();
	}
  let terms = split(this.value);
  terms.pop();
  terms.push(ui.item.value);
  terms.push('');
  this.value = terms.join(', ');
  this.focus();
  return false;
}

function openDelBkmkDlg (aBkmk){
	if (delBkmkDlg == null) {
		delBkmkDlg = $("#delBkmkDlg");
		delBkmkDlg.dialog({
			dialogClass: "no-close",
	    autoOpen: false,
	    modal: true,
	    draggable: false,
	    resizable: false,
	    // width: 500,
	    position: { my: "center", at: "center", of: "#wrapper" },
	    title: 	_getMsg("delBkmkDlg_title"),
	    buttons: [
	      {
	        text: _getMsg("btn_Delete"),
	        click: function() {
	        	browser.runtime.sendMessage({
		      		"type": "deleteBookmark",
		      		"data": bg.GBE2.getBookmark({id: $("#delBkmkDlg-id").val()})
	      		}).then((result) => {
	          	$(this).dialog("close");
	      		});
	        }
	      },
	      {
	        text: _getMsg("btn_Cancel"),
	        click: function() {
	        	// $("#delBkmkDlg label").text("");
	        	// $("#delBkmkDlg-id").val("");
	          $(this).dialog("close");
	        }
	      },
	    ]
		});
	}
	$("#delBkmkDlg label").html(_getMsg("delBkmkDlg_label", aBkmk.title));
	$("#delBkmkDlg-id").val(aBkmk.id);

	delBkmkDlg.dialog("open");
}

function openEditLblDlg (aLbl) {
	if (editLblDlg == null){
		editLblDlg = $("#editLblDlg");
		editLblDlg.dialog({
			dialogClass: "no-close",
	    autoOpen: false,
	    modal: true,
	    draggable: false,
	    resizable: false,
	    width: 320,
	    position: { my: "center", at: "center", of: "#wrapper" },
	    title: 	_getMsg("editLblDlg_title"),
      buttons: [
        {
          text: _getMsg("btn_Save"),
          click: function() {
          	let result = {
	          	oldName: $("#editLblDlg-oldName").val(),
	          	name: $("#editLblDlg-name").val(),
          	}
          	browser.runtime.sendMessage({
		      		"type": "editLabel",
		      		"data": result
	      		}).then((result) => {
            	$(this).dialog("close");
	      		});
          }
        },
        {
          text: _getMsg("btn_Cancel"),
          click: function() {
            $(this).dialog("close");
          }
        },
      ]
		});
	}
	$("#editLblDlg-oldName").val(aLbl.name),
	$("#editLblDlg-name").val(aLbl.name),

	editLblDlg.dialog("open");
}

function openDelLblDlg (aLbl){
	if (delLblkDlg == null) {
		delLblkDlg = $("#delLblkDlg");
		delLblkDlg.dialog({
			dialogClass: "no-close",
	    autoOpen: false,
	    modal: true,
	    draggable: false,
	    resizable: false,
	     width: 320,
	    position: { my: "center", at: "center", of: "#wrapper" },
	    title: 	_getMsg("delLblkDlg_title"),
	    buttons: [
	      {
	        text: _getMsg("btn_Delete"),
	        click: function() {
	        	browser.runtime.sendMessage({
		      		"type": "deleteLabel",
		      		"data": { 
		      			name: $("#delLblkDlg-name").val(), 
		      			delChildren: $("#delLblkDlg-deleteChildren").prop("checked")
		      		}
	      		}).then((result) => {
	          	$(this).dialog("close");
	      		});
	        }
	      },
	      {
	        text: _getMsg("btn_Cancel"),
	        click: function() {
	          $(this).dialog("close");
	        }
	      },
	    ]
		});
	}
	$("#delLblkDlg-lblChildren").text(_getMsg("delLblkDlg_lblChildren"));
	$("#delLblkDlg-lblInfo").html(_getMsg("delLblkDlg_lblInfo", aLbl.name));
	$("#delLblkDlg-name").val(aLbl.name);

	delLblkDlg.dialog("open");
}


function openQRdialog(aBkmk){
	let dlg = $("#QRdialog");
	dlg.dialog({
		autoOpen: false,
		modal: true,
		draggable: false,
		resizable: false,
		position: { my: "center", at: "center", of: "#wrapper" },
		width: 225,
		title: 	"QR-code for bookmark",
    open: function( event, ui ) {
    	$("#qr_dialog_image")
    		.attr("src", "https://chart.googleapis.com/chart?cht=qr&chl=" + encodeURIComponent(aBkmk.url) + "&choe=UTF-8&chs=200x200");
    }
	});
	dlg.dialog("open");
}

function openConfirmDlg(message, callback){
	if (confirmDlg == null) {
		confirmDlg = $("#confirmDlg");
		confirmDlg.dialog({
			dialogClass: "no-close",
	    autoOpen: false,
	    modal: true,
	    draggable: false,
	    resizable: false,
	    width: 320,
	    position: { my: "center", at: "center", of: "#wrapper" },
	    title: 	_getMsg("confirmDlg_title"),
		});
	}
	confirmDlg.dialog("option", "buttons", 
	  [
      {
        text: _getMsg("btn_Confirm"),
        click: function() {
        	callback();
        }
      },
      {
        text: _getMsg("btn_Cancel"),
        click: function() {
          $(this).dialog("close");
        }
      },
	  ]
	);
	$("#confirmDlg-Info").html(message);

	confirmDlg.dialog("open");
}

function openAddAllTabsDlg(label="_OpenTabs") {
	if (addAllTabsDlg == null) {
		addAllTabsDlg = $("#addAllTabsDlg");
		addAllTabsDlg.dialog({
			dialogClass: "no-close",
	    autoOpen: false,
	    modal: true,
	    draggable: false,
	    resizable: false,
	    width: 500,
	    position: { my: "center", at: "center", of: "#wrapper" },
	    title: _getMsg("addAllTabsDlg_title"),
	    buttons: [
	      {
	        text: _getMsg("btn_Save"),
	        click: function() {
	        	let label = $("#addAllTabsDlg-label").val();
	        	let result = [];
	        	$("div.divTableCell  input:checked").each(function() {
	          	let item = {
		          	id: "",
		          	oldUrl: "",
		          	title: $(this).parent().parent().find("div:nth-child(2)").text(),
		          	url: $(this).parent().parent().find("div:nth-child(3)").text(),
		          	labels: label,
		          	notes: "",
		          	favIconUrl: $(this).parent().find("input.favIconUrl").val()
	          	}
	          	let bkmk = null;
	          	bkmk = bg.GBE2.getBookmark({ url : item.url})
	        		if (bkmk !== null) {
	        			item.id = bkmk.id;
	        			item.title = bkmk.title;
	        			item.notes = bkmk.notes;
	        			if (bkmk.labels.length) {
	        				item.labels = bkmk.labels.slice();
	        				item.labels.push(label);
	        			}
	        		}
	        		result.push(item);
	        		console.log(JSON.stringify(item));
	        	});
	        	if (result.length) {
		        	browser.runtime.sendMessage({
				      		"type": "addAllTabs",
				      		"data": result
			      		}
		      		).then((result) => {
		          	$(this).dialog("close");
		      		});
	        	}
	        	else $(this).dialog("close");
	        }
	      },
	      {
	        text: _getMsg("btn_Cancel"),
	        click: function() {
	          $(this).dialog("close");
	        }
	      },
	    ],
	    beforeClose: function( event, ui ) {$("#wrapper").width("350px");}
		});
		$("#addAllTabsDlg-headCheckBox").on("change", function(e) {
			$("div.divTableCell  input").prop("checked", $(this).prop('checked'));
		});
		$("label[for=addAllTabsDlg-label]").text(_getMsg("addAllTabsDlg_label"));
		$(".addAllTabsDlg_tblHeadTitle").text(_getMsg("addAllTabsDlg_tblHeadTitle"));
		$(".addAllTabsDlg_tblHeadUrl").text(_getMsg("addAllTabsDlg_tblHeadUrl"));
	}
	$("#wrapper").width("500px");

	$("#addAllTabsDlg-label").val(label);
	$('#addAllTabsDlg-label').autocomplete({
	  minLength: 1,
	  delay: 50,
	  source: labelAutocompleteSource,
	  focus: function () {return false;},
	  select: labelAutocompleteSelect
	});

	browser.tabs.query({currentWindow: true}).then((tabs) => {
		let tBody = $(".divTableBody");
		tBody.empty();

		tabs.forEach((tab) => {
			let tRow = '<div class="divTableRow">' +
				'<div class="divTableCell"><input type="checkbox" id="addAllTabsDlg-row' + tab.id +'">' +
				'<input type="hidden" class="favIconUrl" value="' + (tab.favIconUrl ? tab.favIconUrl : "") + '"></div>' + 
				'<div class="divTableCell">' + tab.title +'</div>' +
				'<div class="divTableCell">' + tab.url +'</div>' + 
				'</div>';
			$(tRow).appendTo(tBody);
		});

		addAllTabsDlg.dialog("open");
	})
}

function contextMenuShareBookmark (bkmk, mode) {
	if (bkmk !== null)
	{
		let link = "";
		switch (mode) {
			case "fb":
				link = "https://www.facebook.com/sharer/sharer.php?u=" + bkmk.url;
				break;
			case "tw":
				link = "https://twitter.com/intent/tweet?text=" + bkmk.url + "&source=webclient";
				break;
			case "email":
				link = "mailto:test@example.com?"
         + "&subject=" + bkmk.title
         + "&body=" + bkmk.title + "%0D%0A" + escape(bkmk.url);
		}
		if (link.length > 0) showURL(link);
		// if (link.length > 0) chrome.tabs.create({active: true, url: link});
		window.close();
	}
}

function labelMenuOpenAll(lbl){
	bg.GBE2.m_bookmarkList.forEach((bkmk) => {
		if (bkmk.labels.length && bkmk.labels.indexOf(lbl.name) >=0){
			showURL(bkmk.url, true, false);
			// browser.tabs.create({active: false, url: bkmk.url})
			// 	.catch((e) => {_errorLog("labelMenuOpenAll", e)});
		}
	});
}

function labelMenuAddHere(lbl) {
	browser.tabs.query({active: true, currentWindow: true})
		.then((tabs) => {
			let tab = tabs[0];
			let bkmk = bg.GBE2.getBookmark({ url : tab.url});
			if (bkmk == null) 
				openBkmkDialog ({id: null, title: aTab.title, url: aTab.url, labels: lbl.name, notes: "", favIconUrl: aTab.favIconUrl});
			else {
				let tbkmk = {
					id: bkmk.id, title: bkmk.title, url: bkmk.url, 
					labels: (bkmk.labels.length>0 ? (bkmk.labels+","+lbl.name):lbl.name), 
					notes: bkmk.notes
				};
				openBkmkDialog (tbkmk);
			}
		});
}

function folderMenuHideFolder(lbl) {
	let msg = _getMsg("confirmDlg_HideFolder_msg", lbl.name);
	let hideFolder = () => {
		let result = {
    	oldName: lbl.name,
    	name: bg.GBE2.opt.hiddenLabelsTitle + bg.GBE2.opt.nestedLabelSep + lbl.name
  	}
  	browser.runtime.sendMessage({
  		"type": "editLabel",
  		"data": result
		}).then(() => {
    	$("#confirmDlg").dialog("close");
		});
	};
	openConfirmDlg(msg, hideFolder);
}

function folderMenuUnhideFolder (lbl) {
	let msg = _getMsg("confirmDlg_UnhideFolder_msg", lbl.name);
	let re = new RegExp ("^" + bg.GBE2.opt.hiddenLabelsTitle + bg.GBE2.opt.nestedLabelSep, "i");
	if (lbl.name.search(re) == 0) {
		let UnhideFolder = () => {
			let result = {
	    	oldName: lbl.name,
	    	name: lbl.name.replace(re, '')
	  	}
	  	browser.runtime.sendMessage({
	  		"type": "editLabel",
	  		"data": result
			}).then(() => {
	    	$("#confirmDlg").dialog("close");
			});
		};
		openConfirmDlg(msg, UnhideFolder);
	}
}

function folderMenuUnhideAll (lbl) {
	let msg = _getMsg("confirmDlg_UnhideAll_msg");
	if (lbl.name == bg.GBE2.opt.hiddenLabelsTitle) {
		let UnhideAll = () => {
			let result = {
	    	oldName: bg.GBE2.opt.hiddenLabelsTitle,
	    	name: ''
	  	}
	  	browser.runtime.sendMessage({
	  		"type": "editLabel",
	  		"data": result
			}).then(() => {
	    	$("#confirmDlg").dialog("close");
			});
		};
		openConfirmDlg(msg, UnhideAll);
	}
}

function folderMenuExport(lbl) {
	if (bg.GBE2.m_treeSource && bg.GBE2.m_treeSource.length)
	{
		let tree = bg.GBE2.m_treeSource;
		let enableNotes = bg.GBE2.opt.enableNotes;
		let exportLabel = bg.GBE2.searchLabelByPath(tree, lbl.name);
		if (exportLabel.hasOwnProperty("key")) {
			var html = "<!DOCTYPE NETSCAPE-Bookmark-file-1>\n";
			html += "<META HTTP-EQUIV='Content-Type' CONTENT=text/html; charset=UTF-8'>\n";
			html += "<TITLE>Bookmarks</TITLE>\n";
			html += "<H1>Bookmarks</H1>\n";
			html += "<DL><p>\n";

			let export_folder = function(node)
			{
				html += "<DT><H3>" + node.path + "</H3>\n";
				html += "<DL><p>\n";
				if (node.children.length) {
					for (let i = 0; i < node.children.length; i++)
					{
						if (node.children[i].hasOwnProperty("folder"))
						{
							export_folder(node.children[i]);
						}
						else
						{
							let bkmk = bg.GBE2.getBookmark({id: node.children[i].refKey});
							html += "\t<DT><A HREF=" + '"' + bkmk.url + ' "ADD_DATE="' 
								+ (enableNotes ? Date.parse(bkmk.timestamp)/1000 : bkmk.timestamp) 
								+ '">' + bkmk.title 
								+ "</A>\n";
							if (bkmk.notes.length)
								html += "\t<DD>" + bkmk.notes + "\n";
						}
				}
				}
				html += "</DL><p>\n";
			};
			export_folder(exportLabel);

			var blobUrl = URL.createObjectURL(new Blob([html], {type: 'text/plain;charset=utf-8'}));
		  // var downloadUrl = "http://10.115.161.12/mediawiki/index.php/%D0%97%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F_%D1%81%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0";
		  var downloading = browser.downloads.download({
		    url : blobUrl,
		    //saveAs: true,
		    filename : encodeURI('bookmarks_' + lbl.id) + '.html',
		    conflictAction : 'overwrite'
		  });
		  downloading.then().catch((e) => {_errorLog("folderMenuExport",e)});

		}
	}
}


function handleContextMenuClick(event, ui) {
  var node = $.ui.fancytree.getNode(ui.target);
  console.log("select " + ui.cmd + " on " + node);
  let bkmk = null;
  switch (ui.cmd) {
  	// bookmark
  	case "page-go":
  			if (node.data.url.length) {
  				showURL(node.data.url, bg.GBE2.opt.reverseLeftClick, true);
  				// let SearchString = new RegExp("^chrome:|^javascript:|^data:|^about:.*" );
  				// if (SearchString.test(node.data.url)) {
  				// 	console.log("In Firefox, you can't open, or navigate to privileged URLs: chrome:, javascript:, data:, about:");
  				// 	console.log("https://developer.mozilla.org/ru/Add-ons/WebExtensions/Chrome_incompatibilities");
  				// }
  				// else {
   			// 		chrome.tabs.update(aTab.id,{url: node.data.url});
  				// }
  				//$("#bkmk-tree").contextmenu("close");
  				window.close();
  			}
  		break;
  	case "page-edit":
  		bkmk = bg.GBE2.getBookmark({id: node.refKey});
  		openBkmkDialog(bkmk);
  		break;
  	case "page-delete":
  		bkmk = bg.GBE2.getBookmark({id: node.refKey});
  		// $("#delBkmkDlg label").text(_getMsg("delBkmkDlg_label", bkmk.title));
  		openDelBkmkDlg(bkmk);
  		break;
  	case "page-newWidow":
  		if (node.data.url.length) {
  			showURLinNewWindow(node.data.url);
  		}
  		break;
  	case "page-newPrivate":
  		if (node.data.url.length) {
  			showURLinNewWindow(node.data.url, true);
  		}
  		break;
  	case "qrcode-icon":
  		bkmk = bg.GBE2.getBookmark({id: node.refKey});
  		openQRdialog(bkmk);
  		break;
  	case "bookmark-emai":
  		bkmk = bg.GBE2.getBookmark({id: node.refKey});
  		contextMenuShareBookmark(bkmk, "email");
  		break;
  	case "bookmark-fbshare":
	  	bkmk = bg.GBE2.getBookmark({id: node.refKey});
	  	contextMenuShareBookmark(bkmk, "fb");
  		break;
  	case "bookmark-twshare":
  		bkmk = bg.GBE2.getBookmark({id: node.refKey});
  		contextMenuShareBookmark(bkmk, "tw");
  		break;
  	// label
  	case "menuEdit":
  		lbl = {id: node.key, name: node.data.path};
  		// console.log(lbl);
  		openEditLblDlg(lbl);
  		break;
  	case "menuRemove":
  		lbl = {id: node.key, name: node.data.path};
  		// console.log(lbl);
  		openDelLblDlg(lbl);
  		break;
  	case "menuOpenAll":
  		lbl = {id: node.key, name: node.data.path};
  		labelMenuOpenAll(lbl);
  		break;
  	case "menuAddHere":
  		lbl = {id: node.key, name: node.data.path};
  		labelMenuAddHere(lbl);
  		break;
  	case "menuUnhideAll":
  		lbl = {id: node.key, name: node.data.path};
  		folderMenuUnhideAll(lbl);
  		break;
  	case "menuUnhideFolder":
  		lbl = {id: node.key, name: node.data.path};
  		folderMenuUnhideFolder(lbl);
  		break;
  	case "menuHideFolder":
  		lbl = {id: node.key, name: node.data.path};
  		folderMenuHideFolder(lbl);
  		break;
  	case "menuExport":
  		lbl = {id: node.key, name: node.data.path, title: node.title};
  		folderMenuExport(lbl);
  		break;
  	case "menuAddAllTabs":
  		lbl = {id: node.key, name: node.data.path, title: node.title};
  		openAddAllTabsDlg(lbl.name);
  		break;
  }
}


function bgListener(message)
{
	switch (message.type){
		case "needRefresh":
			refresh();
			break;
		case "refreshed":
			aBkmk = bg.GBE2.getBookmark({ url : aTab.url});
			setClickHandlers (aBkmk);
			// console.log (JSON.stringify(message));

			$.ui.fancytree.getTree("#bkmk-tree").reload(
	          // message.text
	          bg.GBE2.m_treeSource
	        ).done(function(){
	          console.log ("reloaded");
	        });
	    $("#bkmk-tree").fancytree("enable").show();
	    $(".info-box").css({display: 'none'});
	    break;
		case "CntxOpenBkmkDialog":
			openBkmkDialog({id: null, title: message.title, url: message.url, labels: "", notes: "", favIconUrl: message.favIconUrl});
			break;
	}
}

function refresh() {
  console.log("refresh");
  $(".info-box").css({display: 'flex'});
  // TODO сообщение изменить
  $(".info-box label").text("!Loading bookmarks");
  $("#bkmk-tree").fancytree("disable").hide();
  chrome.runtime.sendMessage({
      type: "refresh",
      tab: aTab
    }
  );
  $("#filterTextbox").val("");
  resetFilter();
}

function openOptionsPage () {
	browser.runtime.openOptionsPage().then( ()=> {window.close();});
}



function test1() {
  console.log("test1");
  chrome.runtime.sendMessage({
      type: "test1"
    },
    function(response) {
    	// if (response) document.getElementById("div").textContent = response.msg;
    });
}