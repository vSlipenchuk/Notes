/*
    Тестирование объекта дерево.
    1. динамически создаем окно
    2. заполняем его деревом
    3. добавляем и изменяем элементы (заливая его из БД)
    4. есть какие-то возможности по работе с дата-сорсами? - есть!
*/


function vTree(data,el) {
  var atomService = Components.classes['@mozilla.org/atom-service;1']
      .getService(Components.interfaces.nsIAtomService);
  this.redAtom = atomService.getAtom('red');
  this.greenAtom = atomService.getAtom('green');
  this.atoms = {
    //title: atomService.getAtom('title'),
    //path: atomService.getAtom('path'),
    //selected: atomService.getAtom('title')
  };
  this.setData(data,el);
}

vTree.prototype = {
  reloadChilds : function (root) { // reload childs from a root...
var SQL,N,db=this.db,p,l=null;
//alert('reload?');
if ( (!root) || (root === this.data)) { N = this.root; p = this.data= []; 
   SQL = 'select N,NAME from '+this.tbl+' where UP='+this.root+' order by name';
   root = null;
   }
   else {
    SQL = 'select N,NAME from '+this.tbl+' where UP='+root.n+' order by name';
    N = root.N;
    root.children = p = [];
    }
//alert('SQL='+SQL);
if (db.Select(SQL)) {
      while(db.fetch()) { // Fill a data???
        //alert('Begin Fetch?');
      var q = {n:db.row[0],NAME:db.row[1],path:db.row[2]};
      //alert('push:'+q.title);
      p.push(q); // ZU!!!
      }}
if (root) {
  root.loaded=1;
  root.open = true;
  }
//this.loaded = 1; // ok
//    alert('db done ok');
this.refresh();
},
 setDb:function(db,tbl,root) { // Set Db Connector
    // alert('load From a db!');
    this.db = db; this.tbl = tbl; this.root = root;
    // ok - now - loads all important from DB
    this.data = [];
    this.reloadChilds(null); // reload all childs
    //this.refresh();
    
}
};


vTree.prototype._onTreeSelect = function () { // Default обработчик для отслеживания селекта
var sel;
//alert('onTreeSelect!'+this.tree+" this.onSelect="+this.onSelect);
this.selected = null;
if (!this.tree) return;
//alert('selection changed = '+this.tree.currentIndex);
sel = this._getRowElement(this.data,this.tree.currentIndex);
if (sel==this.selected) return; // same...
this.selected = sel;
//alert('Call on select='+this.onSelect);
if (this.onSelect) this.onSelect(this.selected,this); // Notification here...
}

vTree.prototype.setData = function (data,el) {
if (data) this.data = data;
if (el) { // Set Controller
    var x = this;
    el.view = this;
    el.ctrl = this;
    //alert('begin?');
    el.onselect = function () {
      x._onTreeSelect();
      //alert('Hello');
    }
    /*
    el.setAttribute("onselect", function () { //-?? как подвесить обработчик свойства (через замыкание???)
      this._onTreeSelect(el); // Только так?
    });
    alert('set on select='+el.onselect);
             */
    this.tree = el; // Запоминаем его -))
   }
}

vTree.prototype.QueryInterface = function(uuid)
{
  if (!uuid.equals(Components.interfaces.nsISupports) &&
      !uuid.equals(Components.interfaces.nsITreeView) &&
      !uuid.equals(Components.interfaces.nsISecurityCheckedComponent))
  {
    throw Components.results.NS_ERROR_NO_INTERFACE;
  }

  return this;
}

vTree.prototype.boxObject = null;
vTree.prototype.setTree = function(aBoxObject)
{
  this.boxObject = aBoxObject;
}

// Вспомогательная функция для рекурсивного определения количества видимых строк
vTree.prototype._getRowCount = function(aData)
{
  var count = 0;
  for (var i = 0; i < aData.length; i++)
  {
    count++;

    // Для открытых контейнеров учитываем детей тоже
    if ('children' in aData[i] && aData[i].open)
      count += this._getRowCount(aData[i].children);
  }
  return count;
}

// Вспомогательная функция для нахождения элемента по номеру строки
vTree.prototype._getRowElement = function(aData, aRow)
{
  for (var i = 0; i < aData.length && aRow > 0; i++)
  {
    aRow--;

    // Для открытых контейнеров учитываем детей тоже
    if ('children' in aData[i] && aData[i].open)
    {
      var count = this._getRowCount(aData[i].children);

      // Если нужная строка среди детей текущей
      if (aRow < count)
        return this._getRowElement(aData[i].children, aRow);
      else
        aRow -= count;
    }
  }

  if (i < aData.length)
    return aData[i];
  else
    return undefined;
}

// Вспомогательная функция для рекурсивного определения уровня элемента в иерархии
vTree.prototype._getLevel = function(aData, aRow)
{
  for (var i = 0; i < aData.length && aRow > 0; i++)
  {
    aRow--;

    // Для открытых контейнеров учитываем и детей тоже
    if ('children' in aData[i] && aData[i].open)
    {
      var count = this._getRowCount(aData[i].children);

      // Если нужная строка среди детей текущей
      if (aRow < count)
        return this._getLevel(aData[i].children, aRow) + 1;
      else
        aRow -= count;
    }
  }

  if (i < aData.length)
    return 0;
  else
    return -1;
}

// Вспомогательная функция для рекурсивного определения индекса родителя элемента
vTree.prototype._getParentIndex = function(aData, aRow) {
  var currentIndex = 0;
  for (var i = 0; i < aData.length && aRow > currentIndex; i++)
  {
    currentIndex++;

    // Для открытых контейнеров учитываем и детей тоже
    if ('children' in aData[i] && aData[i].open)
    {
      var count = this._getRowCount(aData[i].children);

      // Если нужная строка среди детей текущей
      if (aRow < currentIndex + count)
        return currentIndex + this._getParentIndex(aData[i].children, aRow - currentIndex);

      currentIndex += count;
    }
  }

  return -1;
}

// ReadOnly-свойство, так что определяем только функцию для чтения
vTree.prototype.__defineGetter__('rowCount',
    function() {return this._getRowCount(this.data)});

vTree.prototype.getCellText = function(aRow, aCol) {
  // Если aCol не строка, то это должен быть nsITreeColumn-объект
  if (typeof aCol != 'string')
    aCol = aCol.id;

  var element = this._getRowElement(this.data, aRow);
  if (typeof element == 'undefined')
    return null;

  // Возвращаем свойство элемента, соответствующее идентификатору колонки
  return element[aCol];
}

vTree.prototype.getCellValue = function(aRow, aCol)
{
  // Если aCol не строка, то это должен быть nsITreeColumn-объект
  if (typeof aCol != 'string')
    aCol = aCol.id;

  var element = this._getRowElement(this.data, aRow);
  if (typeof element == 'undefined')
    return null;

  // Возвращаем значение только для колонки selected
  if (aCol == 'selected')
    return ('selectedValue' in element && element.selectedValue ? 'true' : 'false');
  else
    return null;
}
vTree.prototype.getProgressMode = function(aRow, aCol)
{
  return null;
}
vTree.prototype.getImageSrc = function(aRow, aCol)
{
  return null;
}

vTree.prototype.getColumnProperties = function(aCol, aProperties)
{
  // Если aCol не строка, то это должен быть nsITreeColumn-объект
  if (typeof aCol != 'string')
    aCol = aCol.id;

  // Если мы получили три параметра, то aProperties третий параметр
  if (this.getColumnProperties.arguments.length == 3)
    aProperties = this.getColumnProperties.arguments[2];

  if (aCol in this.atoms)
    aProperties.AppendElement(this.atoms[aCol]);
}
vTree.prototype.getRowProperties = function(aRow, aProperties)
{
  var element = this._getRowElement(this.data, aRow);
  if (typeof element != 'undefined' && 'properties' in element)
  {
    for (var i = 0; i < element.properties.length; i++)
      aProperties.AppendElement(element.properties[i]);
  }
}
vTree.prototype.getCellProperties = function(aRow, aCol, aProperties)
{
  this.getColumnProperties(aCol, aProperties);
  this.getRowProperties(aRow, aProperties);
}

vTree.prototype.isSeparator = function(aRow)
{
  var element = this._getRowElement(this.data, aRow);
  return (typeof element != 'undefined' && 'separator' in element);
}

vTree.prototype.isContainer = function(aRow)
{
  var element = this._getRowElement(this.data, aRow);
  return (typeof element != 'undefined' && 'children' in element);
}
vTree.prototype.isContainerOpen = function(aRow)
{
  var element = this._getRowElement(this.data, aRow);
  return (typeof element != 'undefined' && 'open' in element && element.open);
}
vTree.prototype.isContainerEmpty = function(aRow)
{
  var element = this._getRowElement(this.data, aRow);
  return (typeof element == 'undefined' || element.children.length == 0);
}

vTree.prototype.getLevel = function(aRow)
{
  return this._getLevel(this.data, aRow);
}

vTree.prototype.getParentIndex = function(aRow)
{
  return this._getParentIndex(this.data, aRow);
}

vTree.prototype.hasNextSibling = function(aRow, aAfterRow)
{
  var parent = this.getParentIndex(aRow);
  var parentElement = this._getRowElement(this.data, parent);
  if (typeof parentElement == 'undefined')
    return false;

  // Проверяем для всех детей, не расположен ли один из них после aAfterRow
  var data = parentElement.children;
  var child = parent + 1;
  for (var i = 0; i < data.length; i++)
  {
    if (child > aAfterRow)
      return true;

    child++;
    if ('children' in data[i] && data[i].open)
      child += this._getRowCount(data[i].children);
  }
  return false;
}

vTree.prototype.toggleOpenState = function(aRow)
{
  var element = this._getRowElement(this.data, aRow);
  if (typeof element == 'undefined' || !element.children.length)
    return;

  var count = this._getRowCount(element.children);
  element.open = !element.open;
  if (element.open)
    this.boxObject.rowCountChanged(aRow + 1, count);
  else
    this.boxObject.rowCountChanged(aRow + 1, -count);

  // Перерисовываем значок контейнера
  if (typeof this.boxObject.columns != 'undefined')
    this.boxObject.invalidateCell(aRow, this.boxObject.columns.getPrimaryColumn());
  else
    this.boxObject.invalidatePrimaryCell(aRow);
}

vTree.prototype.sortColumn = null;
vTree.prototype.cycleHeader = function(aCol)
{
  // Если aCol не строка, то это должен быть nsITreeColumn-объект
  if (typeof aCol != 'string')
    aCol = aCol.id;

  var treeCol = document.getElementById(aCol);
  if (!treeCol)
    return;

  var cycle = {
    natural: 'ascending',
    ascending: 'descending',
    descending: 'natural'};
  var curDirection = 'natural';
  if (this.sortColumn == treeCol)
    curDirection = treeCol.getAttribute('sortDirection');
  else if (this.sortColumn)
    this.sortColumn.removeAttribute('sortDirection');

  curDirection = cycle[curDirection];

  //*******************
  //* Здесь сортируем *
  //*******************

  treeCol.setAttribute('sortDirection', curDirection);
  this.sortColumn = treeCol;
}

vTree.prototype.isSorted = function()
{
  return (this.sortColumn && this.sortColumn.getAttribute('sortDirection') != 'natural');
}

vTree.prototype.isEditable = function(aRow, aCol)
{
  return false;
}
vTree.prototype.setCellText = function(aRow, aCol, aValue) {}
vTree.prototype.cycleCell = function(aRow, aCol) {}

vTree.prototype.performAction = function(aAction) {}
vTree.prototype.performActionOnRow = function(aAction, aRow)
{
  if (aAction == 'removeRow')
  {
    var element = this._getRowElement(this.data, aRow);
    if (typeof element == 'undefined')
      return;

    // Ищем строку-родителя
    var parent = this.getParentIndex(aRow);
    var children = this.data;
    if (parent >= 0)
      children = this._getRowElement(this.data, parent).children;

    // Считаем количество удаляемых строк
    var count = 1;
    if ('children' in element)
      count += this._getRowCount(element.children);

    // Удаляем строку
    for (var i = 0; i < children.length; i++)
    {
      if (children[i] == element)
      {
        children.splice(i, 1);
        break;
      }
    }

    // Обновляем дерево
    this.boxObject.rowCountChanged(aRow, -count);
  }
}

vTree.prototype.refresh = function () { // Full refresh after bulk update
this.boxObject.rowCountChanged(0,10000); // Redraw all...this.boxObject.rowCountChanged(0,10000); // Redraw all...
}

vTree.prototype.addChild = function (parent,child) { // Очищаем все строки нафиг...
   //alert('add child to:'+parent);
   if (!parent || parent===this.data) {
        this.data.push(child); // spec - root child
        this.refresh();
        return; // Done?
        }
     else { // SubChilds ...
        if (parent==-1) {} // selected add...
        // check by ID or by what???
       
        }
//    alert('?clerr?');
    //if (!parent.children) parent.children=[];
    //alert(parent.children)
    //parent.children.push(child); // Add them
    parent.push(child); // ZU - data is first...
    this.refresh();
    //alert('Data New:'+this.data);
}

vTree.prototype.clearData = function () { // Очищаем все строки нафиг...
//    alert('?clerr?');
    this.data=[]; // Clear all data
    this.boxObject.rowCountChanged(0,10000); // Redraw all...
    //alert('Data New:'+this.data);
}

vTree.prototype.performActionOnCell = function(aAction, aRow, aCol) {}

var iface = Components.interfaces.nsITreeView;
vTree.prototype.DROP_ON = ('DROP_ON' in iface ? iface.DROP_ON : iface.inDropOn);
vTree.prototype.DROP_BEFORE = ('DROP_BEFORE' in iface ? iface.DROP_BEFORE : iface.inDropBefore);
vTree.prototype.DROP_AFTER = ('DROP_AFTER' in iface ? iface.DROP_AFTER : iface.inDropAfter);

vTree.prototype.canDrop = function(aRow, aOrientation)
{
  return (aOrientation == this.DROP_ON);
}
vTree.prototype.canDropOn = function(aRow)
{
  return this.canDrop(aRow, this.DROP_ON);
}
vTree.prototype.canDropBeforeAfter = function(aRow, aBefore)
{
  return this.canDrop(aRow, aBefore ? this.DROP_BEFORE : this.DROP_AFTER);
}

vTree.prototype.drop = function(aRow, aOrientation)
{
  var dragService = Components.classes['@mozilla.org/widget/dragservice;1']
      .getService(Components.interfaces.nsIDragService);
  var session = dragService.getCurrentSession();
  if (!session)
    return;

  var transferable = Components.classes['@mozilla.org/widget/transferable;1']
      .createInstance(Components.interfaces.nsITransferable);
  transferable.addDataFlavor("text/unicode");

  for (var i = 0; i < session.numDropItems; i++)
  {
    session.getData(transferable, i);
  
    var data = {};
    var dataLen = {};
    transferable.getTransferData('text/unicode', data, dataLen);
    if (data.value)
    {
      data = data.value.QueryInterface(Components.interfaces.nsISupportsString);
      data = data.data.substring(0, dataLen.value / 2);
      alert('Unicode string received: ' + data);
    }
  }

  dragService.endDragSession();
}

vTree.prototype.selection = null;
vTree.prototype.selectionChanged = function() {
  alert('selection changed!');
  };

vTree.prototype.canCreateWrapper
  = vTree.prototype.canCallMethod
  = vTree.prototype.canGetProperty
  = vTree.prototype.canSetProperty
  = function()
{
  return 'AllAccess';
}
