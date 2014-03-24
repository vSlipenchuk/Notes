/*

  Динамические формы XUL:
   1. создание и отображение динамического окна
если я имею данные в виде текста - то я могу установить через xulSet из внутрь любого компонента.
Но если я не имею - что делать? - генерировать. Причем ТЕКСТ!!!
   2. генерация текста зависит только от жисона..

   Теперь - мы имеем текст. не фигово было бы его затолкать внутрь простого диалога?
   И этот диалог - показать. Как???

*/

function htmlEncode(txt) { // converts html symbos
    return txt; // ZU - to do...
}

var xulForm = { // XUL form generator - делает текст из того, что ему дадут...
    widthDialog:600, // default width
    labelWidth:80, // default label width
    getText:function (nodes) { // В ноде должна содержаться метаинформация - с какими параметрами и что генерить
    var str='';
    for(i=0;i<nodes.length;i++) {
        var  node = nodes[i]; // Забираем ноду
        var text='';
        if (!node.n) continue; // Имя должно быть установлено
        var t = 'e'; if (node.t) t = node.t; // А по умолчанию генерируем едиторы
        var c = node.n; if (node.c) c = node.c; // По умолчанию заголовок такой же как и имя
        var v = node.v; if (!v) v=''; // default value
        if (t=='e') { // Генерируем текст бокс
            text='<label value="'+c+'"/>'; // print a text
            text+='<textbox id="'+node.n+'" value="'+htmlEncode(v)+'"/>';
        }
    if (text) str+='<row>'+text+'</row>\n'; // sets it here
    }
    str='<grid><columns><column style="width:'+this.labelWidth+'px"/><column flex="1"/></columns><rows>\n'+
        str+'\n</rows></grid>'; // wrap to grid
    str='<groupbox>'+str+'</groupbox>'; // Для рамки вокруг
    return str;
    },
    onLoadDialog: function (win) { // needs for variable bindings
    var obj = this.obj;
    alert("CREATED!"+ this.obj.title);
    //var obj = this.obj; win.obj = obj; // remember
    //alert('iam created and loaded! obj.onload='+obj.onload);
    win.obj = obj;
    if (obj.onload) {
        alert('call on load!')
     obj.onload(obj,win); // call that iam here
        alert('done...');
    }
    alert('this win.obj.title='+win.obj.title);
    //alert(win.title);
    },
    txt2dialog:function (txt) {
          txt='<vbox flex="1">'+txt+'</vbox>'; // all in a vertical box
        txt='<dialog title="Test Dynamic Dialog"  onload="window.opener.xulForm.onLoadDialog(this);" id="sm-about" xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">'+
           //'\n<script type="application/x-javascript" src="xulForms.js"/>'+
           txt+'</dialog>'; // wrap a dialog message
        txt='<?xml version="1.0"?><?xml-stylesheet href="chrome://global/skin/" type="text/css"?>'
        //+'<script type="application/x-javascript" src="xulForms.js" />'
        +txt; // XML header
        return txt;
    },
    showDialog:function (txt,obj) { // Создание и отображение диалога по переданному тексту...
        //txt='<label>In dialog?</label>';
        //window.openDialog(smChromes.aboutconfig, 'aboutconfig', 'chrome,resizable,titlebar,toolbar,centerscreen,modal');
        this.obj = obj; // remember a running object (for onLoadDialog)
        txt='<vbox flex="1">'+txt+'</vbox>'; // all in a vertical box
        txt='<dialog title="Test Dynamic Dialog"  onload="window.opener.xulForm.onLoadDialog(this);" id="sm-about" xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">'+
           //'\n<script type="application/x-javascript" src="xulForms.js"/>'+
           txt+'</dialog>'; // wrap a dialog message
        txt='<?xml version="1.0"?><?xml-stylesheet href="chrome://global/skin/" type="text/css"?>'
        //+'<script type="application/x-javascript" src="xulForms.js" />'
        +txt; // XML header
        //alert(txt);
        txt = "data:application/vnd.mozilla.xul+xml," + encodeURIComponent(txt);
        var win = window.openDialog(txt,'test','modal'); // no more data - how to conect to self ??? - need on load to connect...
        alert('loaded win='+win);
        //win.show();
        //win.show
        alert('done?');
    }
};



function testForm() {
    var nodes = [
      {n:'name',c:'First Name',v:'Default Value'}, // если капшн не указан - используется от имени
      {n:'other',v:10}
    ];
    return false; // stop or not???
    var txt  =  xulForm.getText(nodes);
    var dd = {title:'hello',
              onload:function(obj,win) { alert('loaded into '+win.title);},
              i:nodes // thats a childs of my dialog...
             }
        //    alert(txt);
    w = xulForm.showDialog(txt,dd); // Генерация диалога по тексту
    //w.show
    //alert('show?');
    return true;
}
