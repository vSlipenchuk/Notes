/*
    <script>
    SQLite main - connection (if other databases- Oracle??? )

*/

const Cc = Components.classes;
const Ci = Components.interfaces;

//var tmp;


var db = { // Global
  error: null, // Текст последнего исключения ...
  init: function (path) { // called once...
  if (this.storage) return;
  //alert('Initing with a path='+path);
  var file =
      Cc["@mozilla.org/file/local;1"].
      createInstance(Components.interfaces.nsILocalFile);
  file.initWithPath(path);
  //alert('fileHere='+file);
  var storageService = Components.classes["@mozilla.org/storage/service;1"]
                        .getService(Components.interfaces.mozIStorageService);
  this.db = storageService.openDatabase(file);
  //alert('ok, inited');
  },
  now: function () {
  var D = new Date();
  },
  compile: function (sql) { // Возвращает false при ошибках или ОК...
  var ex;
  try {
  this.stmt = this.db.createStatement(sql);
  } catch (ex) { this.error = ex; return false; }
  return true;
  },
  execSQL: function (sql) {
  var ok;
  this.stmt = this.db.createStatement(sql);
  this.colCount = 0;
  //alert('stmt='+this.stmt+' param='+param+' arg.length='+arguments.length);
  //alert(this.colCount);
  this.cols=[];
  for (var m = 1; m<arguments.length; m++) { // Add extra params...
	        var arg = arguments[m];
			//alert("bind: "+arg);
			this.stmt.bindUTF8StringParameter(m-1, arg);
		    }
  ok = this.stmt.executeStep(); // ok,exec it...
  return ok;
  },
  nextN: function (tbl) { // gets a next max(N)+1 from a tbl
  if (!this.select('select max(N) from '+tbl)) return 0; // ERROR???
  if (!this.fetch()) return 1; // first one?
  return parseInt(this.row[0])+1; // Add a one?
  },
  oselect: function (sql) { // returns first element...
  //alert('oselect:'+sql);
  if (!this.select(sql)) return null;
  if (!this.fetch()) return null;
  return this.row[0];
  },
  jselect: function (sql) { // returns first element...
	  var i,r={};
	  //alert('oselect:'+sql);
	  if (!this.select(sql)) return null;
	  if (!this.fetch()) return null;
	  for(i=0;i<this.colCount;i++) r[this.cols[i].name] = this.row[i]; // Move it
	  return r;
  },
  select:function(sql) {
  var i;
  //alert('select SQL:'+sql+", on DB="+this.db);
  if (!this.db) {
    //alert('no db conncted');
    return false;
    }
  // need to get columns???
  this.stmt = this.db.createStatement(sql);
    for (var m = 1; m<arguments.length; m++) { // Add extra params...
	        var arg = arguments[m];
			//alert("bind: "+arg);
			this.stmt.bindUTF8StringParameter(m-1, arg);
		    }
  ///ok = this.stmt.executeStep(); // ok,exec it...
  this.colCount = this.stmt.columnCount; // ok?
  //alert(this.colCount);
  this.cols=[];
  for(i=0;i<this.colCount;i++) {
    var c = {name:this.stmt.getColumnName(i),type:1};
    this.cols.push(c);
    }
  //alert('Fetched Col OK');
  return true;
  },
  Select: function(sql) {
    var ex;
    try {
      return this.select(sql);
    } catch(ex) {
      alert('some exception!');
      alert('SQLexception:'+ex.message+' on SQL='+sql);
    }
    //alert('select OK');
    return false;
  },
  fetch: function() {
  var i;
  if (!this.db || !this.stmt || !this.stmt.executeStep()) {
    this.stmt=null; return false; // done
    }
  // ok - loads a data
  this.row=[];
  for(i=0;i<this.colCount;i++) {
    this.row.push(this.stmt.getString(i));  // Load As String
    }
  return true;
  },
  populate: function(id,sql) { // SQL populated TreeView...
  if (!this.select(sql)) return false;
  // ok - load data into me...
  }
}

/*
if (!db.db) try {
     db.init('c:\\XUL\\users.sqlite');
     } catch(ex) {
        alert('dbInit error, msg='+ex.message);
     }
*/


function testRefresh() {
var i,id,cols,rows;
//alert('TestRefresh!');
id = document.getElementById('sqlTree');
//alert(id);
cols  = id.getElementsByTagName('treecols')[0]; // first is cols
clearElement(cols); // ok - now populate a cols
db.select('select NAME,PHONE,EMAIL from usr');
for(i=0;i<db.colCount;i++) { // create column & fill a name
    var col = document.createElement('treecol');
    col.setAttribute('label',db.cols[i].name);
    col.setAttribute('style','width:200px');
    cols.appendChild(col);
    var splitter = document.createElement("splitter"); // resize?
    splitter.setAttribute("id", "splitter" + col);
    splitter.setAttribute("class", "tree-splitter");
    splitter.setAttribute("resizebefore", "closest");
    splitter.setAttribute("resizeafter", "grow");
    cols.appendChild(splitter);
    }
//alert('done!');
rows  = id.getElementsByTagName('treechildren')[0];
clearElement(rows); // now - load a rows
while(db.fetch()) { // Loads data into
  var ti,tr,tc;
  ti = document.createElement('treeitem');
  tr = document.createElement('treerow'); ti.appendChild(tr);
  for(i=0;i<db.colCount;i++) {
    tc = document.createElement('treecell');
    tc.setAttribute('label',db.row[i]);
    tr.appendChild(tc);
     }
  rows.appendChild(ti); // Add a tree item
  }
//alert('cols='+cols);
//alert('rows='+rows);
}

//alert('DB='+db);
