/*
 
  Контроллер для доступа к указанному gcls, надстройка которая:
   1. строит формы (fld) по указанному классу (выгружая его из ds);
   2. 
  
 */

function gcls() { // Такой вот синхронизованный класс... 
  this.fld=[]; // Пустой список полей 
  }

gcls.prototype = { 
function addField(name,cap) {
	if (!cap) cap=name;
	var f = {name:name,cap:cap};
	this.fld.push(f);
	return f;
},
function getXUL() { // Генерирует XUL форму по указанным полям????
return "Hello";	
}
		
}