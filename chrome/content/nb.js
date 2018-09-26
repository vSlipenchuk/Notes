/*
  <script>
  Общий хедер для работы с нотабеной. При создании указывается db (sqlite - полный путь),
  таблица и точка входа (UP)... - далее все по сценарию -)))
  Класс - неудачный... Ибо - совмещает работу с БД и дерево представления (сделан для скорости был)
    При релоаде заваливает nb.Load !!!
    
    //  nb.js - это класс nb не связанный с конкретным окном или объектом отображения...
    // nb.xul - главная форма с поиском и редакторами
    // обработчики формы - nb_xul.js
    
*/

function Notabene(db,tbl,root) {
 this.db=db; this.tbl=tbl; this.N=0;
 this.root=0; if (root) this.root=root;/* Just for a constructor */
 this.setStatus=function(){}; // just for override
 this.history = [];
 }

Notabene.prototype = {
checkTable: function () { // check if table exists...
try {
if (this.db.select('select N,UP,NAME from '+this.tbl)) return true;
} catch(ex) {
  alert('select error:'+ex);
  if (!confirm("Table "+this.tbl+" does not exist, create?")) return false;
  }
try {
this.db.execSQL('create table '+this.tbl+'(N integer primary key,UP integer default 0,NAME varchar(80),TXT varchar(2000),CREATED datetime)');
this.db.execSQL('create unique index i_'+this.tbl+' on '+this.tbl+'(UP,NAME)');
this.db.execSQL('insert into '+this.tbl+'(N,UP,NAME,TXT) values(100,0,\'root\',\'\')');
} catch(ex) {
	alert('create error:'+ex);
	return false;
}
return true;
},
 writable: function () { // checks - if we can read-write on a database???
 try {
 this.db.execSQL('update '+this.tbl+' set N=N where N=1');
 } catch(ex) {
   return 0;
   }
 return 11;
 },
 Reload: function () {
 if (this.Tree) this.Tree.refresh(this.Tree.selectedRow());
		//.refresh(w.selectedRow())
 this.Load(this.N); // Reload data in a browser-))
 },
 addToHistory: function (n) { // Adding to a history array current N
 var i,h=[n];
 for(i=0; i<20 && i<this.history.length;i++) {
	 if (this.history[i]==n) continue;
	 h.push(this.history[i]); // add it
     }
 this.history = h; // corrected array
 },
 setText: function (txt) { // Set Current text to browser???
		// alert('selected='+ok);
 if (this.browser) {
     var div = this.browser,x = this;
     //alert('div='+div);
     //div.innerHTML = this.TextValue;
     div.setViki(txt);
     div.onGo = function (text) { return x.Go(text);};
     }
 //alert ('Xul='+this.Xul+' and SUB='+txt.substr(0,4));
 if (this.Xul) {
	  var t = txt;
 	  if (t.substr(0,5)!='<?xml') t = '';
 	  try {
	  //alert("SetASXUL?"+txt);
	  XULset(this.Xul,t);
	  //this.Xul.innerHTML = txt;
	  } catch(ex) { alert('Error set xul:'+ex);}
	  //alert('ok,set!')
    }
 },
 prefGet: function(name) { // get prerefence by name
 var val="";
 //return 0;
 try {
  if (!this.db.select("select val from usr_param where name='"+name+"'")) return false;
  if (!this.db.fetch()) {
   this.db.execSQL('insert into usr_param(name) values(:0)',name); // regiter
   return false;
   }
  val=db.row[0];
  } catch(ex) { return ""};
 //alert("prefGet="+val);
 return val;
 },
 prefSet: function(name,val) {
 try {
   this.db.execSQL('update usr_param set val=:0 where name=:1',val,name); // ?
   //alert('refsetok');
   }
 catch(ex) {
   if (!confirm('error access usr_param, try recreate?')) return 0;
    this.db.execSQL('create table usr_param(name varchar(80),val varchar(200) )' ); // create a SQL table???
     this.db.execSQL('insert into usr_param(name) values(:0)',name); // register a name
   return 0;
   }
 return 1;
 },
 GetNote: function (n) {
 return this.db.jselect('select N,NAME,TXT,UP,CREATED from '+this.tbl+' where n='+n);
 },
 GetNoteText: function (n) {
 return this.GetNote(n).TXT;
 },
 Load:   function (n) { // Loads text into text viewer???
  var txt;
  if (!this.db.select('select n,txt,up,created from '+this.tbl+' where n = '+n)) return false;
  if (!this.db.fetch()) return false;
  this.N = db.row[0]; this.TextValue = txt =  db.row[1];  this.UP=db.row[2]; this.CREATED=db.row[3];
  if (this.Text) { // If have editor...
     this.Text.value = this.TextValue;
     this.Text.N = this.N;
     }
  //var ok = prefSet('Notabene.selected',n); //?
  this.addToHistory(n);
  ok = this.history.join(','); //alert('set history:'+ok);
  //prefSet('Notabene.history',ok); //?

  this.prefSet(this.tbl,ok); //?
  //ok2=this.prefGet('Notabene.history'); //?
  //alert('ok='+ok+',ok2='+ok2);

  this.setStatus('loadDoc:'+n+' created:'+this.CREATED);
  this.setText(this.TextValue);
  //alert('Load:: begin Select path?')
  if (this.Tree) this.Tree.selectPath(this.Path(this.N));
  //alert('Load done Select Path :: LoadPath='+this.Path(this.N));
  return true;
  },
 GetFullPath : function (n) {
 var res="",i;
 for(i=0;i<10;i++) {
   var r = this.db.jselect('select N,UP,NAME from '+ this.tbl+' where N='+n);
      if (!r || !r.UP) break;
   n = r.UP;
   res='/'+r.NAME+res;
   }
 return res;
 },
 getPath: function (P,create) {
 var n = this.root,i;
 //alert('root='+n);
 for(i=0;i<P.length;i++) {
    var NN=null;
    if (this.db.select('select N from '+this.tbl+' where UP='+n+' and name=\''+P[i]+'\'') &&
      this.db.fetch()) NN=this.db.row[0];
    if (!NN) {
      if (!create) return null; // false
      if (!confirm('Root:'+n+' has no child "'+P[i]+'", create?')) return null;
      NN = this.Add(n,P[i]);
      if (!NN) return 0;
      }
   n = NN; // Go again???
   }
 return n; // Done
 },
 rename:function (N,NewName) {
 this.db.execSQL('update '+this.tbl+' set name=\''+NewName+'\' where N='+N);
 },
 Search: function (txt,max) { // Search a text -->>
 var P=null; if (!max) max=30;
 if (!this.db.select('select N,NAME,CREATED from '+this.tbl+' where name like:1 or txt like :1 order by N desc',txt)) return 0;
 while(this.db.fetch()) {
   if (!P) P=[];
   P.push(this.db.row);
   max--;
   if (max<=0) break;
   }
 return P;
 },
 getChildNodes: function(N) { // return array of array - node...
 var P=[];
 //alert('childs for:'+N+' and tbl='+this.tbl);
 if (!this.db.select('select N,NAME from '+this.tbl+
		  " where UP="+N+" order by NAME"))
	   return P; // Empty on error
 while(this.db.fetch()) P.push(this.db.row);
 //alert('P='+P);
 return P;
 },
 getChildsText:function(N) {
	 var Text='';
	 //alert('now N='+N);
	var i=0, ch = this.getChildNodes(N); // get array of nodes
	 //alert('ch='+ch);
	 for(i=0;i<ch.length;i++) { // N,NAME array
		 var n=ch[i][0];
		 //alert(n);
		 var name=this.GetFullPath(n);
		 //alert(name);
	         if (!this.db.select('select txt from '+this.tbl+' where n = '+n)) return false;
                 if (!this.db.fetch()) return false;
                 text = db.row[0];
		 //alert(text);
		 Text+='=='+name+'\n'+text+'\n';
     }
   return Text;  
 },
 FullName:function (N) { // Gets path array for an N
 var Name = '';
 while(1) {
   if (!this.db.select('select NAME,UP from '+this.tbl+' where N='+N)) break;
   if (!this.db.fetch()) break;
   Name='/'+this.db.row[0]+Name;
   N = this.db.row[1];
   }
 return Name;
 },

 Path:function (N) { // Gets path array for an N
 var P = [];
 P.push(N);
 while(1) {
	//alert('BeginPath?'+'select UP from '+this.tbl+'where N='+N);
   N  = this.db.oselect('select UP from '+this.tbl+' where N='+N);
   //alert('Path='+N);
   if (!N || N=='0') break; // Root
   P.push(N);
   }
 return P;
 },
 HasNamedChild: function (n,Name) {
   var N = 0, SQL;
   SQL = 'select N from '+this.tbl+' where name=\''+Name+'\' ';
   if (!N) N = this.db.oselect(SQL+' and UP = '+n); // Self childs
   if (!N) N = this.db.oselect(SQL+' and UP in (select UP from nb where N='+n+')' ); // on same level
   if (!N) N = this.db.oselect(SQL+' and UP in (select N from nb where UP = '+n + ')'); // 1 level down...Self childs
   if (!N) N = this.db.oselect(SQL+' order by N'); // first with this name...1 level down...Self childs
   return N;
 },
 changeUP: function (n,newUP) {
	 var n1,n2,i;
	 n1 = this.db.jselect('select N,UP from '+this.tbl+' where n='+n); // check first
	 n2 = this.db.jselect('select N,UP from '+this.tbl+' where n='+newUP); // check first
	 if (!n1 || !n2) return false; // Не нашли блин кого-то
	 // среди родителей нового апа n2 не должно быть n1!!!
	 for(i=0;;i++) {
		 if (n2.N==n1.N || n2.UP==n1.N) return false;
		 if (n2.UP=='0') break; // нашли рута...
		 if (i>100) return false; // maxloop found...
		 n2 = this.db.jselect('select N,UP from '+this.tbl+' where n='+n2.UP); // check first
	 }
	 this.db.execSQL('update '+this.tbl+' set UP=:1 where N=:2',newUP,n);
	 return true;
 },
 Go: function (text) {
   //alert('go,up='+this.UP+',name='+text);
   var N = this.HasNamedChild(this.N,text);
   //alert('goto textchild:'+text+' existsN:'+N);
   if (N) {
       this.Load(N); return 0; // Just loads it
       }
   if (!confirm('NoChild: '+text+', create?')) return 0;
   N = this.Add(this.UP,text); // Try Add..
   if (N) this.Load(N);
   // 1 - check - if we have a child???
   return 1;
 },
 SaveNote: function (note) {
 var ok = false;
   if (!note || ! note.TXT) return;
   try{
   //alert('Saving...'+SQL);
   db.execSQL("update "+this.tbl+" set txt=:1 where N=:2",note.TXT,note.N); // catch exception
   ok = true;
   } catch(ex) { alert('execError:'+ex); }
 //alert('ok, saved, res='+ok);
 return ok;
 },
 Save: function() {
   //return this.SaveNote( {N:this.N, TXT:this.Text.value} );
   var ok;
   //alert('Save with='+this.Text+' this.N='+this.N);
   if (!this.Text) return;
   try{
   //alert('Saving...'+SQL);
   ok = db.execSQL("update "+this.tbl+" set txt=:1 where N=:2",this.Text.value,this.N);
   }catch(ex) { alert('execError:'+ex); }
   //alert('ok, saved, res='+ok);
   },
 Add:function (UP,NAME,TXT) { // Create a new child with given name
	   try {
   var NN = this.db.nextN(this.tbl);
   if (!TXT) TXT='';
   this.db.execSQL('insert into '+this.tbl+'(N,UP,NAME,TXT) values(:1,:2,:3,:4)',NN,UP,NAME,TXT);
   alert('OK, added N='+NN); // Status??
   return NN; // New N number
	   } catch(ex) {
		   alert('nbaddfailed:'+ex);
		   return 0;
	   }
   },
 AddChild:function () { // Ask a child name & add it...
   var NAME=''; var ok;
   NAME = prompt('New Child Name:',NAME);
   if (!NAME) return 0;
   try {
	//alert('try add?');
   ok = this.Add(this.N,NAME);
   if (this.Tree) this.Tree.prefresh();
   } catch(ex) { alert('refrehTree failed:'+ex);}
   return ok;
  },
 Refresh:function() { // Refresh a current tree (if any)
   if (this.Tree) this.Tree.Refresh();
   },
  getTitleByN:function (n) { // Возвращает заголовок для указанного N
  return "NB:"+n;
  }
};


function nbAdd() {
var txt,db,SQL,name,NN;
txt = document.getElementById('nbText');
db = txt.par.db;
name = prompt('New Child name:','');
if (!name) return 0;
// NextN need??
NN = db.nextN('nb');
SQL = 'insert into '+nb.tbl+'(N,UP,NAME) values('+NN+','+txt.N+',\''+name+'\')';
alert(SQL);
db.execSQL(SQL);
//nbRefresh(); // now - reload ALL hilds???
w.refresh(); // For chailds and all?
}




function nbOnClick(tree) { // when tree selection changed...
var el,row,txt,db;
//alert('clicked!');
//alert('Clicked tree='+tree);
el = tree.currentIndex;
row = tree.getElementsByTagName('treeitem')[el];
row = row.getElementsByTagName('treecell')[0]; // get first cell...
alert('Clicked N='+row.N);
txt = document.getElementById('nbText');
db = tree.par.db;
alert('Load to TXT'+txt);
if (db.select('select N,TXT from '+this.tbl+' where N='+row.N) && db.fetch()) {
   alert('Load OK');
   txt.N = db.row[0]
   txt.value = db.row[1]; // First column here...
   txt.par = tree.par; // copy parameters
   } else alert('Load Failed!')
//alert('clicked el='+el.N);
}

function nbReloadChilds(el) { // OK - reload childs???
    //alert('Loading...');
//alert('Start Load Childs:'+el.N);
var tree = getParentByTag(el,"tree"),db = tree.par.db;
//alert('tree='+tree);
var SQL = 'select N,NAME from '+nb.tbl+' where UP='+el.N+' order by NAME';
//treeRemoveChilds(el);
el.setAttribute("container",true);
alert("SQL="+SQL+" for tagName="+el.tagName);
if (db.select(SQL)) { // Fill parameters
    while(db.fetch()) {
        //alert(db.row);
        var tc = treeCellAddChild(el,db.row[1]); // Add a name

        //alert('added tc='+tc);
        tc.N=db.row[0]; // Fix an N
        //var row = getParentByTag(tc,"treerow");
        //row.setAttribute("onclick", "nbOnClick(this)");
    }
    }
el.setAttribute("open",true);
//alert('RunSQL='+SQL);
// element is a tree node...
}

function nbRefresh() { // Refresh all in a tree?
nbReloadChilds(window.Root); // reload root tree???
}

function nbLoadDialog() {
    var p = window.arguments[0];
    //this.par = p; - this это и есть окно при старте диалога
    this.par = p;
    alert('hello?'+window.par+' title='+window.title);
    this.tree = window.document.getElementById('nbTree'); // Gets a tree view
    this.tree.par = p; // Fix a paramaters
    this.Text = window.document.getElementById('nbText');
    var rows  = this.tree.getElementsByTagName('treechildren')[0];
    //return 0;
    //alert(rows);
    clearElement(rows); // Clear All rows
    //alert('cleared');
    this.Root = treeRowsAddCell(rows,"Notabene"); // First Tree Cell
    //alert('added');
    this.Root.N = this.par.N; // Set A root N here
    //alert('root set');
    this.Root.db = db; // Fix a database
    this.Root.tbl = 'nb'; // Fix a table
    nbReloadChilds(this.Root);
    //Clear a childs
    //alert('dialog here! tbl='+p.tbl);
    //alert(db);
}

function nbTest(txt) {
//alert('nbTest');
var par = getParentWindow(window);
//tree;
//alert('hello tree='+par);
par.Text.value+='Iam clicked!!!\n';
//alert('You pressed:'+txt+'on tbl='+par.hwnd.tbl );
}

function nbShow() { // ShowDialog Notabene -)))
var par={};
par.db = db; // MyDefaultDatabase
par.tbl='nb'; // My Table in it
par.N=0; // First Element
par.ok=0;
alert('showNB='+par);
window.openDialog("chrome://myapp/content/nb.xul",
      "Notabene",
      "chrome, resizable, centerscreen, modal, dialog",
      par);
return par.ok; // if exists
}

function nbOpenNew() { // OpenNew Windows (as duplicate)
alert('Open new win');
}

