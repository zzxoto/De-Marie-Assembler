//need a program counter

function CPU( compiled_code = ''){
	var AC = 0;
	var arch = 16;
	var runtimeVar =  {};

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
		,
		fetch: function*(){

			for ( var i= 0; i < compiled_code.length ; i++){
				var x = compiled_code[i];
				if ( x[0][0] === '$'){
					var namespace = x[0];
					if(!x[1])
						runtimeVar[namespace] = 'N/A';//uninitialized variables are set to 'N/A'
					else	
						runtimeVar[namespace] = x[1];
				}
				else{
					yield x;
				}
			}
		},

		decoder:{ 
			A: ['add' , 'sub' , 'mul' , 'div'],
			B:['output'],
			C:['load' , 'store']

			decodeA: function( ins , data ){//decodes instructions that require 2nd arguments
				var opcode,
					data;

				opcode = this.A.indexOf( ins );//ranges -> [0,3]
				data = parseInt( runtimeVar[ data ] );//beware some values may be NaN, e.g. output

				if ( isNaN(data) )
					throw 'uninitialized runtime variable while decoding';

				return [opcode , data];
			},

			decodeB: function( ins , data ){//decodes instruction that doesnot require second argument
				var opcode;
				opcode = this.B.indexOf( ins ) + this.A.length//ranges -> [4]

				if ( data )
					throw 'illegal argument while decoding';

				return [opcode, null];
			},

			decodeC: function( ins, data){
				var opcode;
				opcode = this.C.indexOf( ins ) + this.B.length + this.A.length;

			},

			decode: function( ins ){
				var opc = ins[0];
				var data = ins[1];
				if (this.A.indexOf(opc) != -1)
					return this.decodeA( opc , data );
				else if (this.B.indexOf(opc) != -1)
					return this.decodeB( opc , data );
				else
					throw "opcode missing while decoding";
			}
		},

		execute: function(){
			var fetch_gen = this.fetch();

			
			
			while (true){
				var f = fetch_gen.next();
				if (f.done)
					break;
				else{
					var x = this.decoder.decode( f.value ),
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