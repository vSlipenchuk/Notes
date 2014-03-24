/* Viki форматтер */

var vikiLink = 1;
var vikiTarget = ''; // Если нужно открывать линки в другом окне

function getLinks(txt) {
var r = new Array(),i,fl;
i = 0;  fl=-1; pushed=0; // Begin from first, no marker, not pushed 
//if (!vikiLink) { r.push(txt); return r;} // Return all
//alert('decode:'+txt);
while(i<txt.length-1) {
 if (txt.charAt(i)=='[' && txt.charAt(i+1)=='[')  {
   fl=i; i+=2; continue; // Remember a marker
   }
 else if (txt.charAt(i)==']' && txt.charAt(i+1)==']' && fl>=0) { // If we have a marker ...
   if (pushed<fl) {
    r.push(' '+txt.substr(pushed,fl-pushed)); // Simple Text
    //alert('SimpleText:'+txt.substr(pushed,fl-pushed));
    }
   r.push('!'+txt.substr(fl+2,i-2-fl)); // PushIt
   i+=2; pushed=i; fl=-1; continue;
   }
 i++;
 }
if (pushed<txt.length) r.push(' '+txt.substr(pushed,txt.length-pushed));
return r;
}

function fmtEscape(txt) { // В ссылках получаемых из текста могут быть спец-значки ? & и т.п.
txt = encodeURIComponent(txt);
return txt;
}

function encodeRef(ref) { // Декодируем
ref = ref; //encodeURIComponent(ref);
return ref;
}

function fmtPar(txt,local) { // Переформатировать параграф. Т.е. [[href]] ссылки
var i,r,l,j,ll,ref,k,tar;
//alert('Par:'+txt);
if (vikiTarget) tar=' target='+vikiTarget+' ';
    else tar = '';
r = getLinks(txt);  txt='';
for(i=0;i<r.length;i++) {
   l = r[i];
   if (l.charAt(0)=='!') {
          ll = l.substr(1).split('|'); ref=ll.length>1?ll[1]:fmtEscape(ll[0]);  
          if (ll[0]=='Image') { // Special - image !!!
           txt+='<img src='+ref+'>';
           }
          else {
           //alert(ref+' "'+local[0]+'"');
           if (local) for(k=0;k<local.length;k++) if (local[k]==ref) { ref='#'+ref; break;} // locallink
           if (vikiLink) {
                   if (vikiOnClick) txt+='<a href=# onclick="vikiOnClick(this)" >'+ll[0]+'</a>';
                   else  txt+='<a href="'+encodeRef(ref)+'" '+tar+' >'+ll[0]+'</a>';
                   }
                 else txt+='<b>'+ll[0]+'</b>';
           }
          }
      else  txt+=r[i]; // Decode Links ...
   }
return txt;
}

function hasChr(txt,ch) {
var i;
for(i=0;i<txt.length;i++) if (txt.charAt(i)==ch) return true;
return false;
}


function fmtParList(txt,links) {
var r,l,i,t;
r = split2(txt,':\n');
if (r.length>1 && r[1]) { // Параграф = перечисление !!!
  txt = '<p>'+fmtPar(r[0]+':',links) ;
  nodes = txt2nodes(r[1]); 
  txt+=nodes2list(nodes, function a(node) { // Переконвертируем ноды как хочется -)
             var t = trim(fmtPar(node.name,links));
             if (t.length==0) return '';
             if (t.charAt(0)=='-') return '<LI type=square>'+ t.substr(1);
             if (t.charAt(0)=='*')  return '<LI type=circle>'+ t.substr(1);
             if (hasChr("01234567890",t.charAt(0))) return t+'<br>';
             return '<LI>'+ t; 
             }  );
  return txt + '</p>';
  }
return '<p>'+fmtPar(txt,links)+'</p>';
}

function hideHTML(s) {
s = s.replace(/\&/g,'&amp;'); 
s = s.replace(/\</g,'&lt;'); 
s = s.replace(/\>/g,'&gt;');
//alert(s);
return s;
}

function split2(str,del) { // Делит пополам по делимитеру (т.е. массив из одного или двух объектов)
var i,res=new Array(),dl=del.length;
for(i=0;i<str.length-dl+1;i++) if (str.substr(i,dl)==del) {
  res.push(str.substr(0,i));    // Left
  res.push(str.substr(i+dl));  // Right
  return res;
  }
res.push(str);
res.push('');
return res;
}

function fmtProp(txt) { // Propery - table
var r,i,del_cols='\t',c,cap;
c = split2(txt,'\n');
cap = c[0].substr(2); txt=c[1];
if (cap.charAt(0)!=' ') { del_cols=cap.charAt(0); cap=cap.substr(1);}
cap = trim(cap);

/*del_cols=txt.charAt(2);   del_lines='\n'; // By Default
if (del_cols=='\n') del_cols='\t';  // Default
 else del_lines=txt.charAt(3);
*/
//del_cols = '\t'; // Column Delimiter
r = txt.split('\n'); txt='';
for(i=0;i<r.length;i++) {
 var c=r[i].split(del_cols),j;
 if (c.length==1) c = split2(c[0],'-');
 if (i==0) { txt+='<tr>'; if (c.length==2) txt+='<th width=18%>'+c[0]+'<th width=82%>'+c[1]; 
             else for(j=0;j<c.length;j++) txt+='<th>'+c[j];
              
           }
        else { txt+='<tr>'; 
               for(j=0;j<c.length;j++) txt+='<td>'+fmtPar(hideHTML(c[j]));
               }
 }
return '<table><thead>'+cap+'</thead>'+txt+'</table>';  
}

function fmtCode(txt,type) {
for(i=0;i<txt.length;i++) if (txt.charAt(i)=='\n') break;
txt = txt.substr(i); // No FirstLine
txt='<textarea name="code" class="'+type+'::nogutter:nocontrols" >'+txt+'</textarea>';
return txt;
}

function trim(str) {
while(str.length>0 && str.charAt(0)<=' ') str=str.substr(1);
return str;
}

function fmtInc(name,txt) { // Делает вставку - ссылку на другой viki - документ
name = trim(name);
return "<br><div id='"+name+"' name='"+name+"'><h2>"+name+"</h2>"+txt+"</div>";
}


function nbload(el,txt2) {
var e;
//alert('nb url:'+txt2);
try { 
  txt2= vReqText('',txt2); 
  txt2 = txt2html(txt2,0);
 } catch(e) { txt2='[error access page]';}; 
if (el) {
  el.outerHTML=txt2;
  /*
  var p = el.parentNode,d;
  d = document.createElement('DIV');
  p.insertBefore(d,el);
  d.innerHTML=txt; //txt2html(txt2,0);
  */
  }
return txt2;
}

function fmtSpec(typ, txt,links) {
if (!txt) txt='';
c = split2(txt,'\n'); // GetFirstRow
return '<table class=fmtSpec><tr><td colspan=2><b>'+c[0]+'<tr><td><img src=/i/nb/'+typ+'.gif /><td>'+fmtParList(c[1],links)+'</table>';
}

function fmtContext(txt,inc) { // Разбираем контекст
var nodes,r;
r=split2(txt,'\n'); // Отделяем первую строку
nodes = txt2nodes(r[1]); 
txt=nodes2list(nodes, function a(node) { // Переконвертируем ноды как хочется -)
      var href=node.name;
      if (href.charAt(0)=='[') href=href.substr(2,href.length-4); else href='';
      if (inc) {  // include
          if (href) return '<h2>'+href+'</h2>'+nbload(0,'/nb/'+encodeURIComponent(href)+'?get=1');
            else return '<h2>'+node.name+'</h2>'; // Just a caption
          } else { // no include
          if (href) return '<li><a href="/nb/'+href+'" >'+href+'</a></li>';
          else return '<li><b>'+node.name+'</b></li>';
          }
      });
txt='<h1>'+r[0]+'</h1>'+txt;
return txt;
}


function fmtTbl(txt,links) { // Propery - table
var r,i,del_cols,cap,c,del_cols='\t';
c = split2(txt,'\n'); // GetFirstRow
cap = c[0].substr(2);  // No .t[del]
if (cap.charAt(0)!=' ')  { del_cols=cap.charAt(0); cap=cap.substr(1);}
cap = trim(cap);  
txt=c[1];                         
//alert('TBL:'+txt);
r = txt.split('\n'); txt='';
for(i=0;i<r.length;i++) {
 var c=r[i].split(del_cols),j;
 txt+='<tr>';
 for(j=0;j<c.length;j++) {
             if (i==0) txt+='<th>'; else txt+='<td>';
             txt+=fmtPar(hideHTML(c[j]));
             }
 }
//alert(txt);
return '<table><thead>'+cap+'</thead>'+txt+'</table>';  
}



function txt2html(txt,inc) {
var par,p,i;
var links = []; // Пока пустой массив -)
txt=txt.replace(/\r\n/g,'\n'); // Убираем виндусовые \r\n на \n
//txt  = txt.
par = txt.split("\n\n"); // Вытаскиваем параграфы
txt = '';
if (inc) for(i=0;i<par.length;i++) { // Общий осмотр - вытаскиваем линки
 p = par[i];
 if (p.length==0) continue; // SkipEmpty
 if (p.charAt(0)=='.') { // Fmt Special
   if (p.charAt(1)=='i') links.push(trim(p.substr(2))); // Запоминаем линку
   }
 }
//alert(links.length);
for(i=0;i<par.length;i++) {
 p = par[i];
 if (p.length==0) continue; // SkipEmpty
 if (p.charAt(0)=='=') { // Fmt Caption
   var l = p.split("\n")[0],j; // FirstLine
   for(j=0;j<l.length;j++) if (l.charAt(j)!='=') break;
   l = l.substr(j); // SkipCaption
   txt+='<br><h'+j+'>'+l+'</h'+j+'>'; // Caption
   }
 else if (p.charAt(0)=='.') { // Fmt Special
   if (p.charAt(1)=='i') { // Download & set !!!
           var name = name = trim(p.substr(2)),
              txt2='<a href=# onclick=nbload(this,"/nb/'+encodeURIComponent(name)+'?get=1")>[click to load]</a>';
           if (inc) txt2=nbload(0,'/nb/'+encodeURIComponent(name)+'?get=1');
           //alert(txt2);
           txt+=fmtInc(name,txt2); // Пласе а линк тута
           }
   else if (p.charAt(1)=='?') txt+=fmtSpec('quest',p.substr(2));
   //else if (p.charAt(1)=='x') txt+=fmtContext(p.substr(2),inc);
   else if (p.charAt(1)=='.') txt+=fmtSpec('info',p.substr(2));
   else if (p.charAt(1)=='!') txt+=fmtSpec('warn',p.substr(2));
   else if (p.charAt(1)=='p') txt+=fmtProp(p,links);
   else if (p.charAt(1)=='t') txt+=fmtTbl(p,links);
   else if (p.charAt(1)=='c') txt+=fmtCode(p,"javascript");
   else if (p.charAt(1)=='j') txt+=fmtCode(p,"javascript");
   else if (p.charAt(1)=='s') txt+=fmtCode(p,"sql");
   else if (p.charAt(1)=='x') txt+=fmtCode(p,"xml");
   else if (p.charAt(1)=='e') { // MakeEval from a second word -)))
        var expr = trim(split2(p,' ')[1]),t;
        //alert('ForEval='+expr);
        try { txt+= ''+eval(''+expr) ; } catch(e) {  txt+='<h2>ERROR'+e.message+'</h2>'; }

        }
   }
 else  { // Simple P
  txt+=fmtParList(p,links);
  }
 }
return txt;
}
