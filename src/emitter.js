//реализация эмиттера - накопителя, привязанного к медленному хранилищу (база данных)
//пакетно наполняющему себя и выдающему по одной записи за запрос
//возможно в будущем реализую интервал - промежуток времени, через который эмиттер пополняется (тогда надо будет еще максимальный размер указывать)
//min - значение, при котором запускается пополнение - реализую попозже
'use strict';
const util = require('util');
const EventEmitter = require('events');

var Emitter = function(size, provider, finalizer){
    this.storage = [];
    this.size = size;
    this.provider = provider;
    this.queue = []; 
    this.status = "ok";

    this.finalizer = "function" === typeof finalizer ? finalizer : function(){
    
    };
    EventEmitter.call(this);
}
util.inherits(Emitter, EventEmitter);

Emitter.prototype.pop = function(reciever){
    //console.log("emitter: pop");
    switch(true){
        case this.storage.length > 0 :
	    console.log("normal execute: ", this.storage[this.storage.length-1]);
            reciever(this.storage.pop());
	    return true;
        case this.status === "provider waiting":
	    //console.log("push in queue, status is waiting");
            this.queue.push(reciever);
	    return false;
        default:
	    //console.log("push in queue, start provider");
            this.queue.push(reciever);
            this.status = "provider waiting";
            this.provider(this.size);
	    return false;
    }
};
Emitter.prototype.reciever = function(stock){
	console.log("reciever: ", stock);
  //получаем сток, добавляем в storage, вызываем userCb
  if(!stock.length) return this.finalizer();
	//TODO если storage не пустой (это возможно при пересечении нескольких вызовов на пустом storage) - надо мерджить массивы
	//TODO уже не актуально в связи с очередью, но все равно проверить
	//console.log("reciever:", this.status, this.queue);
  if(this.storage.length) this.storage = this.storage.concat(stock);
	else this.storage = stock;
	this.status = "ok";
	console.log("queue: ", this.queue);
  //userCb(this.storage.pop());
	while(this.queue.length && this.pop(this.queue.pop()));
	if(this.queue.length) this.provider(this.size);
};

module.exports = Emitter;
