
//16bit -> architecture
//compiled_code is array of length >= 1
//program counter is -1 at very inception of method call. So essentially it starts from 0
//uses recursion to detect stack overflow error to catch infinite loop
function CPU( compiled_code ){
	var AC = 0;
	var arch = 16;
	var runtimeVar =  {};

	var PC =  {
			count: -1,//program counter starts at -1. When ControlUnit calls getCount for first time it gets updated to 0
			maxCount: compiled_code.length - 1,
			getCount: function(){ 
				if (this.count >= this.maxCount)
					return NaN//end of program
				this.count += 1;
				return this.count 
			},
			setCount: function( x ){
				//useful for jump statements
				if (x > this.maxCount || x < -1)//-1 is allowed
					throw "memory breach access unauthorized"
				this.count = x
			}
		}

	var ALU = {
		maxPos : 32767, //2^15 -1
		maxNeg: -32768, //-2^15
		add: function( x ){
			if (this.logic.addError(x)){
				throw 'error adding. Invalid input';
			}
			AC = AC + x;
		},
		sub: function( x ){
			
			if (this.logic.subError( x ))
				throw 'error subbing. Invalid input'
			AC = AC - x;
		},
		mul: function( x ){
			
			if ( this.logic.mulError( x ))
				throw 'error multiplying. Invalid input';
			AC = AC * x;
		},
		div: function( x ){
			
			if ( this.logic.divError( x ))
				throw 'error division';
			AC = Math.round( AC / x)
		},
		jump: function( x ){
			var pc = x - 1;//if I want to land on position x on next iteration I have to set it x-1 on this iteration
			if ( this.logic.jumpError( pc ))
				throw 'error jump operation';
			PC.setCount( pc );
		},
		load: function ( x ){
			if ( this.logic.loadError( x ))
				throw 'error load operation. Invalid input';
			AC = x;
		},
		doIf: function ( x ){
			if ( this.logic.doIfError( x ) )
				throw 'error doIf operation';
			if ( x == 0){//equality
				if ( AC != 0)
					PC.count += 1;
			}
			else if ( x == 1){//less than
				if ( AC >= 0)
					PC.count += 1;
			} 
			else if ( x == 2){//greater than
				if ( AC <= 0 )
					PC.count += 1;
			}
		},
		output: function( x ){
			IO.stdOut( AC );
		},
		store: function ( x ){
			if ( this.logic.storeError( x ) )
				throw 'error store operation';
			runtimeVar[ x ] = AC;
		},

		logic:{
			// true is error
			//false is OK
			//when NaN is encountered it is considered error as well ..happens when user operates on undeclared variables

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

			jumpError: function( x ){
				if ( this.error(x) || x > PC.maxCount || x < 0)//x must be between 0 to maxPC
					return true
				else
					return false;
			},
			loadError: function( x ){
				return this.error( x );
			},
			doIfError: function( x ){
				//x has to be bet'n 0 1 2
				if ( x == 0 || x == 1 || x == 2)
					return false
				else
					return true
			},
			storeError: function( x ){
				//store is a special case where x is the name of the label
				var k = runtimeVar[ x ];
				return this.error ( k );
			},
			error: function( x ){
				//generic error handler every input should pass this test
				if ( x > ALU.maxPos || x < ALU.maxNeg || isNaN(x) )
					return true;
				return false;
			},

		}
};	
	var CU = {

		fetch: function( pc ){
			//main functions sorts out the labels and returns the bare instruction to the callee

			var x = compiled_code[pc];
			if (x[0][0] === '$'){
				var label = x[0];
				if ( x[1] === 'dec'){//instruction of format $x dec 10
					runtimeVar[label] = x[2];
					return 
				}
				else{
					runtimeVar[label] = pc;//instruction of format $x load $y
					x = [x[1] , x[2]];
				}
			}
			return x;
		},

		decoder:{ 
			A: ['add' , 'sub' , 'mul' , 'div', 'jump' , 'load' , 'doIf' , 'output'],
			B:['store'],
		
			decodeA: function( ins , data ){//decodes instructions that require 2nd arguments
				
				var opcode = this.A.indexOf( ins );//ranges -> [0, 7]
				var data = parseInt( runtimeVar[ data ] );
		
				return [opcode , data];//both opcode and data are integers
			},

			decodeB: function( ins , data ){//decodes special case of store store
				
				var opcode = this.A.length // 8 
				return [opcode , data]		//in this case data is String '$x'. Store commmand needs the label
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
			var pc = PC.getCount();
			if (isNaN(pc))
				return //execution ends succesfully
			var f = this.fetch(pc);
			if (!f)	//returns null when instruction was just to initialize variables
				return this.execute();
			try{
				var x = this.decoder.decode( f ),
					opc = x[0],
					data = x[1];
				if (opc == 0)
					ALU.add ( data );
				else if (opc == 1)
					ALU.sub ( data );
				else if (opc == 2)
					ALU.mul ( data );
				else if (opc == 3)
					ALU.div ( data );
				else if (opc == 4)
					ALU.jump ( data );
				else if (opc == 5)
					ALU.load ( data );
				else if (opc == 6)
					ALU.doIf ( data );
				else if (opc == 7)
					ALU.output ( data );
				else if (opc == 8)
					ALU.store ( data );
				return this.execute();//recurse until program counter ends;
			}
			catch( ex ){
				/**	
					*The main purpose of catch is to attach the error with the program counter,
					so that the origin of error would be traced back to line number and displayed to user
					*if catch was executed several layer down the recursion stack then first if statement in the block gets triggered
					*if this was the first catch, then the rest of the if statement gets triggered
					*recursive this.execute() was placed inside the try block to catch the stack overflow error
				**/
				if (ex.msg)
					throw ex
				else if ( ex.constructor.name =='String')//normal errors caused during operations
					throw {pc: pc, msg: ex}
				else if ( ex.constructor.name == 'InternalError')//stack overflow error.. Infinite loop
					throw {pc: pc , msg:'Possibly Infinite Loop. Possibly massive Operation. This is a lightWeight assembler'}
				else
					throw {pc: pc, msg: 'Internal Error. Please notify the developer and send the snippet of the code', ex: ex}
			}

		}
	}
	
	CU.execute();
}
