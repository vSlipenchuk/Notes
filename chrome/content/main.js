// <script>
// nsIWebProgressListener implementation to monitor activity in the browser.
//var conn;

function selectText(c,sql) {
var stmt,i,col=0,res='';
alert('try create stmt...for='+sql);
try {
stmt = c.createStatement(sql);
} catch(ex) {
  alert('Error?'+sql+' con='+conn.lastErrorString);
  return 0;
  }
alert('stmt='+stmt+' ok???');
try {
col = stmt.columnCount;
} catch(ex) {
  alert('Error?'+sql+' con='+conn.lastErrorString);
  return 0;
  }
alert('colCount='+col);
for(i=0;i<col;i++) { // Column Names
 res+=stmt.getColumnName(i);
 res+=(i+1<col)?'\r':'\n';
 }
alert('columns='+res);
while(stmt.executeStep()) { // Fetch a data
for(i=0;i<col;i++) {
 res+=stmt.getString(i); // As String  -)))
 res+=(i+1<col)?'\r':'\n';
 }
}
return res;
}

function InitDb() {
var i,ex,conn;
//alert('try init......');
try {
  /*
var file = Components.classes["@mozilla.org/file/local;1"]
                     .getService(Components.interfaces.nsIProperties)
                     .get("ProfD", Components.interfaces.nsIFile);
  */
//var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
var path='c:\\XUL\\users.sqlite';
var file =
      Components.classes["@mozilla.org/file/local;1"].
      createInstance(Components.interfaces.nsILocalFile);
  file.initWithPath(path);

//alert('Here target='+file.target)
//file.initWithFile('c:/XUL/users.sqlite');



try{ // Opens UP on a dir -)))
}catch(ex)
{
alert(ex.message);
}
//alert('try file.append to target='+file.target);
//file.initWithPath('c:/XUL');
//file.append("XUL/users.sqlite");
alert('try open...');
var storageService = Components.classes["@mozilla.org/storage/service;1"]
                        .getService(Components.interfaces.mozIStorageService);
conn = storageService.openDatabase(file);
} catch(ex) {
 alert('ExName:'+ex.name+',ExMessage:'+ex.message);
 alert('Exception!'+conn.lastErrorString);
 return ;
 }
alert('con='+conn+" !ok!");
//txt = selectText(conn,'create table usr(n integer,name varchar(80))');
//alert('createTable='+txt);
txt = selectText(conn,'select * from usr');
alert('text='+txt);



}


function Alert(txt) {
alert('Alert is here:'+txt);
}

function WebProgressListener() {
}
WebProgressListener.prototype = {
  _requestsStarted: 0,
  _requestsFinished: 0,

  // We need to advertize that we support weak references.  This is done simply
  // by saying that we QI to nsISupportsWeakReference.  XPConnect will take
  // care of actually implementing that interface on our behalf.
  QueryInterface: function(iid) {
    if (iid.equals(Components.interfaces.nsIWebProgressListener) ||
        iid.equals(Components.interfaces.nsISupportsWeakReference) ||
        iid.equals(Components.interfaces.nsISupports))
      return this;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  // This method is called to indicate state changes.
  onStateChange: function(webProgress, request, stateFlags, status) {
    const WPL = Components.interfaces.nsIWebProgressListener;

    var progress = document.getElementById("progress");

    if (stateFlags & WPL.STATE_IS_REQUEST) {
      if (stateFlags & WPL.STATE_START) {
        this._requestsStarted++;
      } else if (stateFlags & WPL.STATE_STOP) {
        this._requestsFinished++;
      }
      if (this._requestsStarted > 1) {
        var value = (100 * this._requestsFinished) / this._requestsStarted;
        progress.setAttribute("mode", "determined");
        progress.setAttribute("value", value + "%");
      }
    }

    if (stateFlags & WPL.STATE_IS_NETWORK) {
      var stop = document.getElementById("stop");
      if (stateFlags & WPL.STATE_START) {
        stop.setAttribute("disabled", false);
        progress.setAttribute("style", "");
      } else if (stateFlags & WPL.STATE_STOP) {
        stop.setAttribute("disabled", true);
        progress.setAttribute("style", "display: none");
        this.onStatusChange(webProgress, request, 0, "Done");
        this._requestsStarted = this._requestsFinished = 0;
      }
    }
  },

  // This method is called to indicate progress changes for the currently
  // loading page.
  onProgressChange: function(webProgress, request, curSelf, maxSelf,
                             curTotal, maxTotal) {
    if (this._requestsStarted == 1) {
      var progress = document.getElementById("progress");
      if (maxSelf == -1) {
        progress.setAttribute("mode", "undetermined");
      } else {
        progress.setAttribute("mode", "determined");
        progress.setAttribute("value", ((100 * curSelf) / maxSelf) + "%");
      }
    }
  },

  // This method is called to indicate a change to the current location.
  onLocationChange: function(webProgress, request, location) {
    var urlbar = document.getElementById("urlbar");
    urlbar.value = location.spec;

    var browser = document.getElementById("browser");
    var back = document.getElementById("back");
    var forward = document.getElementById("forward");

    back.setAttribute("disabled", !browser.canGoBack);
    forward.setAttribute("disabled", !browser.canGoForward);
  },

  // This method is called to indicate a status changes for the currently
  // loading page.  The message is already formatted for display.
  onStatusChange: function(webProgress, request, status, message) {
    var status = document.getElementById("status");
    status.setAttribute("label", message);
  },

  // This method is called when the security state of the browser changes.
  onSecurityChange: function(webProgress, request, state) {
    const WPL = Components.interfaces.nsIWebProgressListener;

    var sec = document.getElementById("security");

    if (state & WPL.STATE_IS_INSECURE) {
      sec.setAttribute("style", "display: none");
    } else {
      var level = "unknown";
      if (state & WPL.STATE_IS_SECURE) {
        if (state & WPL.STATE_SECURE_HIGH)
          level = "high";
        else if (state & WPL.STATE_SECURE_MED)
          level = "medium";
        else if (state & WPL.STATE_SECURE_LOW)
          level = "low";
      } else if (state & WPL_STATE_IS_BROKEN) {
        level = "mixed";
      }
      sec.setAttribute("label", "Security: " + level);
      sec.setAttribute("style", "");
    }
  }
};
var listener;

function go() {
  var urlbar = document.getElementById("urlbar");
  var browser = document.getElementById("browser");

  browser.loadURI(urlbar.value, null, null);
}

function back() {
  var browser = document.getElementById("browser");
  browser.stop();
  browser.goBack();
}

function forward() {
  var browser = document.getElementById("browser");
  browser.stop();
  browser.goForward();
}

function reload() {
  var browser = document.getElementById("browser");
  browser.reload();
}

function stop() {
  var browser = document.getElementById("browser");
  browser.stop();
}

function showConsole() {
  window.open("chrome://global/content/console.xul", "_blank",
    "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar");
}

function onload() {
  var urlbar = document.getElementById("urlbar");
  urlbar.value = "http://www.mozilla.org/";

  listener = new WebProgressListener();

  var browser = document.getElementById("browser");
  browser.addProgressListener(listener,
    Components.interfaces.nsIWebProgress.NOTIFY_ALL);

  go();
}

function doFileNew() {
  window.openDialog("chrome://mqc/content/dialog.xul", "newdlg", "modal");
}

function doXPCOM() {
	try {
		netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
		const cid = "@mydomain.com/XPCOMSample/MyComponent;1";
		obj = Components.classes[cid].createInstance();
		obj = obj.QueryInterface(Components.interfaces.IMyComponent);
	}
	catch (err) {
		alert(err);
		return;
	}
	var res = obj.add(3, 4);
	alert('Performing 3+4. Returned ' + res + '.');
	var name = obj.name;
	alert('Name = ' + name);
	obj.name = 'Sammy Davis Jr';
	name = obj.name;
	alert('Name = ' + name);
}


addEventListener("load", onload, false);
