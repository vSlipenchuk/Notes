﻿/*
  <script>
  Динамические события для формы-шаблона nb.xul
  При старте страницы вызывается onLoadPage - которая инициализирует БД sqlite
  Полагает что подключено nb.js - сама нотабеня...
  Прикольно - при работе с файлами нужно учитывать ОС... Ну не дурь ли??


*/

var w; // Global Tree Handler
var nb; // inited in onLoadPage() and used everywhere


 function doLoad(n) { // Temporarly - copy nb.Load here
  var txt;
	 //return nb.Load(n);
	 
  if (!nb.db.select('select n,txt,up,created from '+nb.tbl+' where n = '+n)) return false;
  if (!nb.db.fetch()) return false;
var db = nb.db;
  nb.N = db.row[0]; nb.TextValue = txt =  db.row[1];  nb.UP=db.row[2]; nb.CREATED=db.row[3];
  nb.addToHistory(n);
  nb.prefSet(this.tbl,nb.history.join(',')); //?
  
   // now - update visual elements
 //alert('?');
	 
  if (nb.Text) { // If have editor...
     nb.Text.value = nb.TextValue;
     nb.Text.N = nb.N;
     }
  //var ok = prefSet('Notabene.selected',n); //?
  //ok2=this.prefGet('Notabene.history'); //?
  //alert('ok='+ok+',ok2='+ok2);

  if (nb.setStatus) nb.setStatus('loadDoc >>> :'+n+' created >>>>:'+nb.CREATED);
  if (nb.setText) nb.setText(nb.TextValue);
  //alert('Load:: begin Select path?')
  if (nb.Tree) nb.Tree.selectPath(nb.Path(nb.N));
  //alert('Load done Select Path :: LoadPath='+this.Path(this.N));
  return true;
  }



function onSetDate(dat) {
    var n;
    try {
    //alert('-->onSetDate called');
    n = nb.getPath(('cal-'+dat).split('-'),true);
    //alert('onSetDate done')
    if (!n) return 0;
    nb.Load(n); // Loads this date...
    //alert('-->load N done');
    } catch(ex) { alert(ex);}
    //alert('DateSet='+dat);
}

function doSearch(txt) {
var ex,p;
//alert('Search?');
try {
	var md = $$('md');
	//alert('md='+md);
	$$('md').selectedIndex = 1;

var txt = document.getElementById('SearchText').value;
var tree = document.getElementById('SearchTree');
var rows = tree.getElementsByTagName('treechildren')[0];
clearElement(rows);
//txt = '%'+txt+'%';
p = nb.Search(txt); // Must return a values
if (!p) {
    //window.title='NoResults:"'+txt+'"';
    return 0;
    }
//window.title='Results: '+p.length;
var i;
for(i=0;i<p.length;i++) { // Все строки
    var r = p[i],ti;
	//for(j=1;j<r.length;j++) 
    ti = rowsAddNodes(rows,r.slice(1)); // js0.vs; first column expected to be "N"
    ti.N = r[0]; // Set N
    }

} catch(ex) {
    alert('err:'+ex);
}

tree.onselect = function () {
  //alert('onSelect?');
  try {
  var ti = treeSelected(tree);
  if (!ti) return 0;
  //alert('Selected:'+ti.N);
  //alert('Selected:'+ti.N);
  nb.Load(ti.N);
//	  doLoad(ti.N);
  } catch(ex) { alert(ex);}
  }
}

function nbRename() {
    var Name;
    Name = w.selectedRow().NAME;
    Name = prompt('NewName',Name);
    if (!Name) return; // Cancel -???
    nb.rename(w.selectedRow().N,Name);
    w.prefresh();
    // Refresh???
}


function onLoadPage() { // Called one (onLoadPage)
var tr,dbname,prop;
app.init(); // Инитим приложение если еще не заинитили...
// инитим дополнительные свойства
prop = $$('nbProp');
if (prop) {
  var nodes=[{n:'created',v:'12.11.1971'},{n:'dsc',v:'my first desc'}];
  var txt = xulForm.getText(nodes);
  txt =  xulForm.txt2dialog(txt);
  //alert('set prop to:'+txt);
  XULset(prop,txt);
  //prop.innerHTML=txt;
  //alert('set!');
  //alert(prop.innerHTML);
  }
if (testForm()) { window.close(); return; }// Тестируемся

//alert('Лоадинг датабазе файл...');
app.dbfile = app.ini('App','dbfile','users.sqlite'); // get ini param here...
//alert('app.dbfile='+app.dbfile);
app.dbtbl = app.ini('App','dbtbl','nb'); // get ini param here...
//alert('app.dbtbl='+app.dbtbl);

dbname = app.ini('App','database',''); // get ini param here...
//alert('dbname='+dbname);
if (!dbname) dbname=app.appDir+app.pathSeparator+".."+app.pathSeparator + app.dbfile // default database name
//alert('done? load db from='+dbname);

if (!db.db) try {
     db.init(dbname);
     } catch(ex) {
        alert('dbInit error, msg='+ex.message+' dbpath='+dbname);
        window.close(); return 0; // falied
     }
//alert("?");
//getPrefs
try {
nb = new Notabene(db,app.dbtbl,0); // Init a notabene object?
if (!nb.checkTable()) {
	alert('Application close...')
	window.close();return 0;
}

//window._nb=nb; // Remember ME

//alert('nb ok - ??!');

if (!nb.writable()) {
  alert('notes already opened or read-only media');
  //if (!confirm("Open notes in read-only mode?"))
   { window.close(); return 0;}
  }
tr = document.getElementById('tree');
//alert('Tree='+tr);
if (!tr) window.close();
//alert('Loading');
w = new vTree(tr);  // Запоминаем объект -)))
w.root=w.el.N=0; // Init a database???
w.ds = nb; // Set Dataset by default -)))
//alert('Begin refresh?');
w.refresh();
//alert('Done refresh?');
} catch(ex) {alert('ERR:'+ex);}
//alert('ds='+w.ds+' getChilds='+w.ds.getChildNodes);


w.onSelect = function (row) {
    var ex;
    if (Browser && !nb.browser) nb.browser=Browser; // Fix It...
    //alert('nbBrowser='+Browser);
    try {
    //window.title = nb.tbl+':/'+nb.FullName(row.N);
    //document.getElementById("nbWin2").setAttribute("title",window.title); // Это сложно, но работает
    document.title=app.dbfile+'('+nb.tbl+') '+nb.FullName(row.N);  // Замечательно!!! - тоже работает
//alert("Loading"+row.N);
    //nb.Load(row.N); // Reload ME???
	    doLoad(row.N); //ZUZUKA
} catch(ex) { alert('nberror:'+ex);}
    //alert('N='+row.N+' selected OK!');
   }
nb.Tree = w;
//nb.Browser = document.getElementById('nbBrowse');
nb.Text = document.getElementById('nbText');
nb.Text.onkeyup = function () { // Dynamic HTML
       //alert('KEY!');
       nb.browser.setViki(nb.Text.value);

}
nb.Xul = document.getElementById('nbXul'); // Запоминаем его?

nb.setStatus = function (text) { // called when loaded new doc for example
	 //document.getElementById('nbStatus').label=text;
	 //alert('Set status?='+text)
	 //alert('set status:'+text+' el='+$$('sbpanel'));
	 //alert('d='+$$+' nb='+$$('nbStatus'));
	 $$('nbStatus').label = '-->'+ text;
	 //document.getElementById("nbWin2").setAttribute("title",text);
	 //window.title='text:'+text;
	 //document.window.title='hello'+text;
	 } ;// override
// ok - try load last  pagee???
//var lastPage = prefGet('Notabene.selected','');
//alert('LastPage='+lastPage); // Теперь при каждом Go его надо сохранять???
//if (lastPage) nb.Load(lastPage); // try load it
var lastHist = nb.prefGet(nb.tbl,'');
//alert('lastHist='+lastHist);
if (lastHist) nb.history = lastHist.split(',');
if (nb.history.length>0) nb.Load(nb.history[0]); // load first

}



function nbRefresh() {
	nb.Reload();
}

function nbSave() {
    //alert('begin save?');
	nb.Save();
	//alert('saved, set status');
	$$('nbStatus').label = 'saved '+(new Date());
	//alert('done set...');
	// Status - bar set text???
}

var nbToMove = null,nbTreeToMove=null;

function nbCat() { // Remember current selected item
nbTreeToMove = w.selectedParent();
nbToMove = nb.N;
nb.setStatus('Node:'+nbToMove+' remembered for moving');
}

function clipSetText(text) {
	const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
gClipboardHelper.copyString(text);
}


function str2file(output, savefile) {

    /*try {
        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    } catch (e) {
        alert("Permission to save file was denied.");
    }*/
    var file = Components.classes["@mozilla.org/file/local;1"]
        .createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath( savefile );
    if ( file.exists() == false ) {
        //alert( "File Updated Successfully ");
        file.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420 );
    }
    var outputStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
        .createInstance( Components.interfaces.nsIFileOutputStream );
    outputStream.init( file, 0x04 | 0x08 | 0x20, 420, 0 );
    //var result = outputStream.write( output, output.length );
    
    var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
                    createInstance(Components.interfaces.nsIConverterOutputStream);
    converter.init(outputStream, "UTF-8", 0, 0);
    converter.writeString(output);
    converter.close(); // this closes foStream
    
    outputStream.close();
//alert( "File Updated Successfully ");
//clear();
//reload();
}

function nbGetChildsAsList() { // get all text for childs
nbTreeToMove = w.selectedParent();
//nb.getChildsAsList(nbToMove);
var t = nb.getChildsText(nb.N);
	//alert(t);
clipSetText(t); // save to clipboard
var name = nb.GetFullPath(nb.N);
name = '/tmp/'+name.split('/').join('_')+'.txt';
str2file(t,name); 
nb.setStatus('Node:'+nb.N+' got child text '+t.length+' placed to clipboard and file='+name );	
}

function nbPaste() {
var nbNewParent = nb.N;
if (!nbToMove) return;
if (!confirm('Move Node:'+nbToMove+' to be child of '+nbNewParent+'?')) return;
try {
if (!nb.changeUP(nbToMove,nbNewParent)) {
	alert('Fail move...'); return ;
   }
//alert('Node moved OK, refresh current parent in a tree'); //
if (nbTreeToMove) w.refresh(nbTreeToMove,true); // remove parent
w.refresh(w.selectedRow(), true);

} catch(ex) {alert(ex);}
nbToMove = null; // forget...
nbTreeToMove = null;
}

function onHistory(id) {
alert('onHistory');
}

function elFields(v) {
	var str = 'Fields:';
	for(a in v) str+=a+'\n';
	return str;
}

function nbUpdateHistoryMenu(menu) {
	var id;
	function onCommand(event) {
		// alert('onCommand, event='+elFields(event));
		// alert('Target:'+event.target.id);
		try {
		id = event.target.id;
		event.stopPropagation();
		//alert('id='+id);
		nb.Load(id);
		} catch(ex) {alert('FailedLoad:'+ex);}
		//alert('ok,loa')
	}
	try {
	clearElement(menu);
	//menu.setAttribute("oncommand", function () { alert('OnHist');});
	for(i=0;i<nb.history.length;i++) {
		var mi,n;
		mi = document.createElement('menuitem');
		n = nb.history[i];
		mi.setAttribute("id",n);
		mi.setAttribute("label",nb.FullName(n)+' ['+n+']');
		mi.addEventListener("command",onCommand,true);
	    menu.appendChild(mi);
	}
	} catch(ex) { alert(ex);}
//alert(1);


}

function goBack(id) {
var n;
if (nb.history.length<2) return ; // Некуда возвращаться
n  = nb.history[1]; // Берем первого сзади
nb.history = nb.history.splice(2); // Берем со второго элем...
nb.Load(n);
}

function nbSwapPages() { // Вызывается если надо переключиться между редакторами
var ed = $$('editors');
if (!ed) return;
var idx = ed.selectedIndex;
//alert('Swaping of index='+idx);
if (idx!=2) ed.selectedIndex=2; // goback to editor
 else {
 var txt = $$('nbText').value;
 if (txt.substr(0,5)=='<?xml') ed.selectedIndex=1;
   else ed.selectedIndex = 0; // show web
 }
  //else if (idx==2) ed.selectedIndex=1; // show page (ZU - xml decoder???)
}


function date2str(dat) {
if (!dat) dat=new Date();
var y = dat.getFullYear();
var m = dat.getMonth();     // integer, 0..11
var d = dat.getDate();      // integer, 1..31
      d=''+d; if (d.length<2) d='0'+d;
      m=''+(m+1); if (m.length<2) m='0'+m;
return y+'-'+m+'-'+d;
}


function nbCalClick1() { // Вызывается при кликах по календарю...
    // ок - нужно просто пойти на страницу текущей даты...
    var dat = new Date();var y = dat.getFullYear();
var m = dat.getMonth();     // integer, 0..11
var d = dat.getDate();      // integer, 1..31
d=''+d; if (d.length<2) d='0'+d;
m=''+(m+1); if (m.length<2) m='0'+m;
//alert('click cal?');
    //alert('nbCalClick clicked!!!');
    var path='cal-'+y+'-'+m+'-'+d;
    //alert('Path:'+path);
    var n;
    try {
    n = nb.getPath(path.split('-')); // loads a path from array of nodes
    alert('nbGetPath='+n);
    if (!n) return 0;
    nb.Load(n); // Loads this date...
    } catch(ex) { alert(ex);}
    //alert('clicked!!!');
}

//alert('XUL!');
