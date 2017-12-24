function A(){
try{
	var a = [ 1 , 2, 3]
	a.forEach( x=>{
		B();
	})

}
catch ( ex ){
	console.log( ex )
}

}

function B(){
	C()
}

function C(){
	throw "error message"
}



var t = 0;
for ( t = 0; t < 23; t ++){
	if ( t== 19){
		break
	}
}
console.log ( t );