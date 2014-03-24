/*
   Общие утилиты для работы с XUL-XML деревьями
   prefGet,prefSet - вытаксивает данные из пользовательского хранилиша...

   Для начала - создаем глобальный объект app внутри которого ВСЕ по данной ОС
   <script>
*/

function appDir(typ) { //https://developer.mozilla.org/index.php?title=en/Code_snippets/File_I%2F%2FO
if (!typ) typ = "resource:app" ; // - директория где лежит application.ini
var file = Components.classes["@mozilla.org/file/directory_service;1"].
                     getService(Components.interfaces.nsIProperties).
                     get(typ, Components.interfaces.nsIFile);
return file.path; // так ли???
}

function strLoad(name) { // try load str, if fails - return null
var e;
try {
//alert('try loads:'+name);
var file = Components.classes["@mozilla.org/file/local;1"].
                     createInstance(Components.interfaces.nsILocalFile);
file.initWithPath(name); // opens a local file by absolute path...
//alert('now loads:'+name);
var data = "";
var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].
                        createInstance(Components.interfaces.nsIFileInputStream);
var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].
                        createInstance(Components.interfaces.nsIConverterInputStream);
fstream.init(file, -1, 0, 0);
cstream.init(fstream, "UTF-8", 0, 0); // you can use another encoding here if you wish

let (str = {}) {
  cstream.readString(-1, str); // read the whole file and put it in str.value
  data = str.value;
}
cstream.close(); // this closes fstream
//alert('Text:'+data);
} catch (e) { alert('FileLoadFailed:'+name); return null; }
return data;
}

function getRows(s) { // Извлекает строки разделенные '\n', игнорирует '\r'
var f=0,l=s.length,p=0,a=new Array();
while(p<l) {
 var ii,i;
 for(ii=0;ii+p<l && s.charAt(ii+p)!='\n';ii++);
 i=ii; while(i>0 && s.charAt(i+p-1)=='\r') i--;
 a.push(s.substr(p,i)); // Добавляем cтроку
 ii++; p+=ii;
 }
return a;
}

function strLTrim(str) {
while(true) {
    var ch = str.charAt(0);
    if (ch==' ' || ch=='\t' || ch=='\r' || ch=='\n') str=str.substr(1);
     else break;
}
return str;
}

function strRTrim(str) {
while(str.length>0) {
    var ch = str.charAt(str.length-1);
    if (ch==' ' || ch=='\t' || ch=='\r' || ch=='\n') str=str.substr(0,str.length-1);
     else break;
}
return str;
}

function strTrim(str) { return strLTrim( strRTrim(str));}  // Ужос!!!


function ini2sections(txt) { // todo: доделать - сейчас простой поиск... // Парсит ини-файл и делает "структуры" учи регулярки!!!
var i,r,rr,txt,name,out,j;
if (!txt) return null;
r = getRows(txt); txt='';
//alert('rows:'+r);
var sec={name:'',txt:'',items:[]}; out = [];
for(i=0;i<r.length;i++) { // Берем секция за секцией...
    rr = r[i]; // строка
    //alert(rr);
    if (rr.charAt(0)=='[') { // Все - секция готова
        if (sec.name) {
            //alert('push sec:'+sec);
        out.push(sec); // сливаем предыдущую (если есть)
        }
        rr=rr.substr(1); // убираем первый символ
        j = rr.indexOf(']'); if (j>=0) rr = rr.substr(0,j); // Выделяем его
        sec={name:rr,txt:'',items:[]};
        //alert('found section:<'+rr+'>');
        continue;
       }

    rr = rr.split(';')[0]; // skip a comments ';'
    j = rr.indexOf('=');
    if (sec.name && rr.length>=0) { // adds to a section???
       var n = rr.substr(0,j);
       var v = rr.substr(j+1);
       n = strTrim(n); v = strTrim(v);
       if (n) {
           sec[n]=v; sec.txt+=n+'='+v+'\n'; // add a string to txt
           //alert('add new pair name='+n+' value='+v+ ' in section:'+sec.name);
           }
       }
    }
if (sec.name) out.push(sec); // сливаем предыдущую (если есть)
//alert('out:'+out);
return out;
}

var app = {
    init: function () {
        if (this.osPath) return; // Вызывается один раз
    this.appDir = appDir('resource:app'); // Дира - откуда вызвано наше приложение
    this.tmpDir = appDir('TmpD'); // Временная директория
    this.pathSeparator = this.tmpDir.charAt(0)=='/'?'/':'\\'; // Винда или UNIX???
    this.iniFile = strLoad(this.appDir+this.pathSeparator+'application.ini'); // load ini file
    this.sec = ini2sections(this.iniFile); // gets a sections
    //alert('app inited OK, appDir='+this.appDir+",tmpDir="+this.tmpDir);
    },
    iniSection: function (name) { // finds ini section (if any)
        var i;
        this.init();
        //alert('try get section:'+name+' in '+this.sec.length+' sections');
        if (!this.sec) return null; // not found
        for(i=0;i<this.sec.length;i++) if (this.sec[i].name==name) return this.sec[i];
        return null; // not found
    },
    ini: function (secName,param,def) { // gets an ini parameter here
    var sec = this.iniSection(secName);
    //alert('>>>>sec='+sec+' for secName='+secName);
    if (!sec) return def; // def value (undefined)
    //alert('totaltext:'+sec.txt);
    var val = sec[param];
    //alert('val='+val+' for +' name='+param);
    if (val) return val;
    return def;
    },
    none:0 // Чтоб работало
};


var ex; // last exception
var prefManager = null; // cashed pref manager
function $$(id) { return document.getElementById(id)}; // shortcut

function prefGet(name,defvalue) { // get prefvalue of returns def
try {
if (!prefManager) prefManager = Components.classes["@mozilla.org/preferences-service;1"]
                                .getService(Components.interfaces.nsIPrefBranch);
return prefManager.getCharPref( name );
} catch(ex) {}
return defvalue;
}

function prefSet(name,val) { // set pref value, returns boolean
try {
	if (!prefManager) prefManager = Components.classes["@mozilla.org/preferences-service;1"]
	                                .getService(Components.interfaces.nsIPrefBranch);
	prefManager.setCharPref( name,val );
	return true;
	} catch(ex) {alert(ex);}
return false;
}



function XULset(dst,source) { // dst must be iframe!!!
    var dataURI = "data:application/vnd.mozilla.xul+xml," + encodeURIComponent(source);
    dst.setAttribute("src", dataURI);
}


function clearElement(el) { // Clear All Elements
  while (el.firstChild)
    el.removeChild(el.firstChild);
}

function rowsAddNode(rows,title) {
        var ti,tr,tc,ch;
     ti = document.createElement('treeitem');
     //ti.setAttribute("container",true); // Open-False?
     tr = document.createElement('treerow'); ti.appendChild(tr);
     ch = document.createElement('treechildren'); ti.appendChild(ch);
     //for(i=0;i<db.colCount;i++) {
       tc = document.createElement('treecell');
       tc.setAttribute('label',title);
       tr.appendChild(tc);
      // }
      rows.appendChild(ti); // Add a tree item
    return ti; // Tree Item - back
}

function treeSelected( tree ) { // tree first selected item.
    var start = new Object();
    var end = new Object();
    var numRanges = tree.view.selection.getRangeCount();
    //alert('numRanes='+numRanges);
    for (var t=0; t<numRanges; t++){
    tree.view.selection.getRangeAt(t,start,end);
      for (var v=start.value; v<=end.value; v++){
        return tree.view.getItemAtIndex(v);
        }
    }
    return null; // no selection..
};

function treeRemoveChilds(cell) {
var ti = getParentByTag(cell,"treeitem"),tc;
if (!ti) return 0;
tc = ti.getElementsByTagName("treechildren");
if (!tc) return 0; tc=tc[0]; // First One
clearElement(tc); // RemoveAll Childs -)))
}

function treeRowsAddCell(rows,label) { // Returns first tree cell
var ti,tr;
ti = document.createElement('treeitem');
tr = document.createElement('treerow'); ti.appendChild(tr);
tc = document.createElement('treecell');
tc.setAttribute('label',label);
tr.appendChild(tc);
rows.appendChild(ti); // Add a tree item
return tc; // Return treeCell
}

function treeCellAddChild(cell,label) { // Returns first tree cell
var ti,tr,tc=null,newcell=null;
ti = getParentByTag(cell,'treeitem'); if (!ti) return null;
ti.setAttribute("container",true);
ti.setAttribute("opened",true);
//alert('TreeItem='+ti);
tc = ti.getElementsByTagName('treechildren'); if (tc) tc=tc.item(0);
//tc=0;
if (!tc) {
    //alert('no tc - create it...')
    tc = document.createElement('treechildren');
    ti.appendChild(tc);
    }
//alert('Adding to tc='+tc);
if (!tc) return null;
//alert('TreeChild='+tc);
return treeRowsAddCell(tc,label);
}


function getParentWindow(w) { // Вытаскивает окна до родительского (вложенные HTML)
    var i=0;
    for(i=0; (w.parent && !(w===w.parent))&& (i<100);i++) w=w.parent; // if some loop bags
    return w;
}

function getParentByTag(el, tagName) { // Ищет родителя специфического класса
while(el.parentNode) {
	if (el.tagName==tagName) return el; // Found
    el = el.parentNode;

}
return null; // Not found
}

