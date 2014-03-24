/*
  <script>
  Обертка деревянного контроллера управления с БД (sqlite)
*/

var do_debug = 0;

function debug(txt) {
if (do_debug) alert(txt);
}

function vTree( el ) {
  this.el = el;
  var x = this;
  el.onselect = function (ev) {
      x._onSelect(ev)
      }; // SetHandler
  el.onclick=function (ev) {
    //alert('click!');
    var row={},col={},child={};
    try {
    x.el.treeBoxObject.getCellAt(ev.clientX, ev.clientY, row, col, child);
    if (!row.value) return ;
    row = x.el.view.getItemAtIndex(row.value);
    } catch(col) { alert('fail onClick:'+col); return;}
    x._checkChilds(row); //   alert('some row='+row);

  }
  }

vTree.prototype = {
    db:null, // Database on
    tbl:null, // Table with data
    selectedRow: function () {
    var start = new Object();
    var end = new Object();
    var numRanges = this.el.view.selection.getRangeCount();
    //alert('numRanes='+numRanges);
    for (var t=0; t<numRanges; t++){
    this.el.view.selection.getRangeAt(t,start,end);
      for (var v=start.value; v<=end.value; v++){
        return this.el.view.getItemAtIndex(v);
        return v; // alert("Item "+v+" is selected.");
        }
    }
    return null; // no selection..
    },
    selectedParent: function () {
    var s = this.selectedRow();
    if (!s) return null;
    return getParentByTag(s,'treeitem');
    },
    _checkChilds: function (row) { // Проверяет загруженность детей...
    if (row.loaded) return 0;
    var cnt = this.refresh(row);
    row.loaded=1; // Флаг загрузки устанавливаем
    if (cnt==0) row.setAttribute("container",false); // Выключаем контейнер
    else     row.setAttribute("container",true); // Выключаем контейнер
    },
    _onSelect: function () { // Хендрел на селект указанной выбранного элемента
    var row;
    //alert('selected, define a row...');
    try {
    row = this.selectedRow(); // Gets selected element ..
    } catch(ex) { alert('error:'+ex); return null};
    this._checkChilds(row);
    if (this.onSelect) this.onSelect(row); // Call me...
    },
    _addNode: function (rows,title) {
        var ti,tr,tc,ch;
     ti = document.createElement('treeitem');
     ti.setAttribute("container",true); // Open-False?
     tr = document.createElement('treerow'); ti.appendChild(tr);
     ch = document.createElement('treechildren'); ti.appendChild(ch);
     //for(i=0;i<db.colCount;i++) {
       tc = document.createElement('treecell');
       tc.setAttribute('label',title);
       tr.appendChild(tc);
      // }
      rows.appendChild(ti); // Add a tree item
    return ti; // Tree Item - back
    },
    _reloadChilds: function (rows, N) {
    var cnt=0;
    if (!this.ds || !this.ds.getChildNodes) {
    	debug('this.ds='+this.ds+' ds='+this.ds.getChildNodes);
    	debug('vTree0: dataset undefined or invalid'); return 0;
    }
    //alert('SQL='+SQL);
    clearElement(rows); // Clear All data inIt
    var ds = this.ds.getChildNodes(N);
    //alert('Here chidls:'+ds);
    for(cnt=0;cnt<ds.length;cnt++) {
        var row = ds[cnt]; // Array of array...
        var ti = this._addNode(rows,row[1]);
        ti.N =  row[0]; // My Tree Item here !!!
        ti.NAME = row[1]; // MyName here...
        //alert('Here add:'+ti.N);
        };
    /*
    if (!this.db.select(SQL)) return false; // Failed?
    while(this.db.fetch()) { // Loads data into
     var ti = this._addNode(rows,this.db.row[1]);
     ti.N = this.db.row[0]; // My Tree Item here !!!
     ti.NAME = this.db.row[1]; // MyName here...
     //alert('Here add:'+ti.N);
     cnt++;
     }
    return cnt;
    */
    rows.setAttribute('container',cnt>0);
    },
    openNode: function (node) {
    	node = getParentByTag(node,'treeitem'); //?
        if (! node) return;
        node.setAttribute('open',true); // Open ME?
    },
    prefresh: function () {
    var p = this.selectedParent();
    if (!p) return;
    this.refresh(p,true);
    this.openNode(p)

    //alert('MustBe opened = '+p.getAttribute(p,'open'));
    },
    refresh: function (row,reload) { // Обновляет дерево целиком -)
    var cnt;
    if (!row) row = this.el; // By default refresh all...
    var rows = row.getElementsByTagName('treechildren')[0];
    if (!rows) return ;
    //alert('refresh, N='+row.N);
    //alert('Tree0 refresh, N='+row.N+' on Rows='+rows);
    //alert('Load In Rows...'+rows);
    //if (!rows) return false;
    cnt = this._reloadChilds(rows,row.N);
    if (reload) this._checkChilds(row); // Check My Childs
    row.setAttribute('container',cnt>0);
    return cnt;
    },
    _childByN: function(row,N) {
    var i,ch = row.getElementsByTagName('treeitem');
    for(i=0;i<ch.length;i++) if (ch[i].N==N) return ch[i];
    return null;
    },
    selectPath: function (P) { // Load Path as array...
    var i, row, ch ,pch =null;
    //alert('SeletPath:'+P);
    row = this.el.getElementsByTagName('treechildren')[0]; // First row here...
    for(i=P.length-1;i>=0;i--) {
        var N = P[i];
        ch = this._childByN(row, N );
        //alert('Load N='+N+' Found='+ch); // Found ch or not???
        if (!ch) {
            //if (ch.loaded) return null; // Cant find, why???
            debug('!!! Reload childs for N='+N);
            if (!pch) return ;/// Z??>?
            //this._checkChilds(row);
            debug('Reloaded OK!');
            this.refresh(pch,false);
            ch = this._childByN(row, N );
            debug('ReLoad N='+N+' ch='+ch); // Found ch or not???
            if (!ch) return null; // failed...
            }
        if (!ch.loaded) this._checkChilds(ch); // reload if no???

        this.openNode(ch);
        //if (!ch.loaded) this._checkChilds(ch);
        pch=ch;
        ch = this._childByN(row,N); // if changed -)))
        row = ch.getElementsByTagName('treechildren')[0]; // search again...
        // open a text???
        }
    //alert('Need select N='+ch.N);
    this.el.view.selection.select( this.el.view.getIndexOfItem(ch) ); //this.el.view.); //ch.selected = true; ZU
    //alert('Done select');
    }
}
