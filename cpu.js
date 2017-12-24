function CPU( compiled_code = ''){
	var AC = 0;
	var arch = 16;

	var ALU = {
		maxPos : 32767, //2^15 -1
		maxNeg: -32768, //-2^15
		//TODO need to parse the input to '10.5' -> 10 'undefined' -> null
		add: function( x ){
			
			if (this.logic.addError(x))
				throw 'error adding';
			AC = AC + x;
		},
		sub: function( x ){
			
			if (this.logic.subError( x ))
				throw 'error subbing'
			AC = AC - x;
		},
		mul: function( x ){
			
			if ( this.logic.mulError( x ))
				throw 'error multiplying';
			AC = AC * x;
		},
		div: function( x ){
			
			if ( this.logic.divError( x ))
				throw 'error division';
			AC = Math.round( AC / x)
		},

		logic:{
			// true is error
			//false is OK
			//when NaN is encountered it is considered error as well ..happens when user operaties on undeclared variables

			divError: function( x ){
				//AC is numerator
				if (this.error( x ) )
					return true
				else{
					return x == 0;//division error
				}

			},
			mulError: function( x){
				return this.error( x * AC )//overflow error
			},

			addError: function( x){
				if (this.error(x))
					return true
				else
					return this.error( x + AC)//overflow error
			},
			subError: function( x){
				if (this.error(x))
					return true
				else
					return this.error( AC - x)//overflow error				
			},

			error: function( x ){
				if ( x > this.maxPos || x < this.maxNeg || isNaN(x) )
					return true;
				return false;
			}

		}
};	
	var CU = {
		runtimeVar: { },
		fetch: function*(){

			for ( var i= 0; i < compiled_code.length ; i++){
				var x = compiled_code[i];
				if ( x[0][0] === '$'){
					var namespace = x[0];
					if(!x[1])
						this.runtimeVar[namespace] = 0;//uninitialized variables are set to 0
					else	
						this.runtimeVar[namespace] = x[1];
				}
				else{
					yield x;
				}
			}
		},

		decode: function( ins ){
			var instruction = ['add', 'sub', 'mul' , 'div' ,'output'];
			var ops = [0 , 1, 2, 3, 4];	
			var opcode,
				data;

			for (var i = 0; i < instruction.length ; i ++){
				if ( ins[0] === instruction[i]){
					opcode = ops[i];
				}
			}
			data = parseInt( this.runtimeVar[ins[1]] );//beware some values may be NaN, e.g. output

			if ( opcode == null ){
				throw 'opcode missing while decoding'
			}

			return [opcode , data];
		},

		execute: function(){
			var fetch_gen = this.fetch();
			
			while (true){
				var f = fetch_gen.next();
				if (f.done)
					break;
				else{
					var x = this.decode( f.value ),
					opc = x[0],
					data = x[1];
						
					if (opc == 0)
						ALU.add ( data );
					else if (opc == 1)
						ALU.sub ( data );
					else if (opc == 2)
						ALU.mul( data );
					else if (opc == 3)
						ALU.div( data );
					else if (opc == 4)//TODO
						console.log( AC )

				}
			}

		}
	}

CU.execute();
}

//TODO parse this
var compiled = [ ['$x' ], ['$y' , '5'], ['add' , '$x'] , ['sub' , '$y'], ['output'] ]
CPU( compiled )