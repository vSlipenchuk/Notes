/*
 
  ���������� ��� ������� � ���������� gcls, ���������� �������:
   1. ������ ����� (fld) �� ���������� ������ (�������� ��� �� ds);
   2. 
  
 */

function gcls() { // ����� ��� ���������������� �����... 
  this.fld=[]; // ������ ������ ����� 
  }

gcls.prototype = { 
function addField(name,cap) {
	if (!cap) cap=name;
	var f = {name:name,cap:cap};
	this.fld.push(f);
	return f;
},
function getXUL() { // ���������� XUL ����� �� ��������� �����????
return "Hello";	
}
		
}