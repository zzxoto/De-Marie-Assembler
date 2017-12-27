
//need to keep track of lines

const IO = {
	monitor: document.getElementById('stdOut'),

	printStackTrace: function( err , lineNo){
		if (!err)
			this.stdOut( `error in line ${lineNo}`)
		else{
			this.stdOut(`error in line ${lineNo}`);
			this.stdOut(err.msg);
			if (err.ex)
				console.log( err.ex);//unhandeled / unknown exceptions
		}
	},

	stdOut: function( x ){
		this.monitor.value += x +'\n';
	}
}



function compiler( blob ){
	//@param blob {String} text extracted from the html text area

	//splits document to lines and lines to operations
	const reg_document = /\n/,
		reg_line = /\s+/,
		reg_digit = /^[\-\+]?\d+$/ //support integers of atleast 1 length - and + are optional

	function compile(){
		var t = 0;//keeps track of the line number
		var lines = blob.split( reg_document );
		try{
			for ( t = 0 ; t < lines.length ; t ++){
				var line = lines[t].trim();
				if ( line.length > 0 ){//empty lines are not considered for validation
					var rawCommands  =  line.split( reg_line );
					validator.validate( rawCommands );
				}
			}
			callCpu();
		}
		catch( ex ){
			if (ex == "error")
				IO.printStackTrace(null , t+1);
			else
				IO.printStackTrace({msg: 'Internal Error. Please notify the developer and send the snippet of the code', ex: ex} , t+1);
		}


		/*break down and send to CPU
		 *empty lines are discarded and not sent to CPU
		**/
		function callCpu(){
			var compiled_code = [];
			lines.forEach( line=>{
				line = line.trim();
				if ( line.length > 0)
					compiled_code.push( line.split( reg_line ));
			})
			try{
				CPU( compiled_code );
			}
			catch( ex ){//print stack trace
				/**
				*if CPU throws error we catch it and trace out the line number that corresponds to the error
				*if CPU throws error it also sends program counter along with it.
				*We trace the line number corresponding to program counter and print the stack trace to the user
				*program counter vary from line number since some lines may be empty and are not counter as program counter
				**/
				var pc = ex.pc;//program counter is part of the exception message and starts at 0
				var z = 0;
				
				for ( t = 0; t < lines.length; t++){
					if ( z == pc){
					  	IO.printStackTrace(ex, t + 1)
					  	break;
					}
					if (lines[t]!='')
						pc += 1;
				}
			}
		}
	};//compile() ends

	/**Validation Module
	  *validates a single line
	  *dollar_state, instruction_state_A/B mimic the concept of finite state machines. 
	**/
	var validator = {

		// when $x --> 0, $x dec--> 1, $x dec 40 --> 2 || $x -->0 $x output --> 1 || $x -->0 $x add --> 1 $x add $y--> 2
		dollar_state: -1,
		
		//Instructions not starting as $ and that resolve in 2 passes i.e. add $a OR sub $b ,etc
		instruction_state_A: -1,

		//Instructions not starting as $ and that resolve in 1 pass i.e. output
		instruction_state_B: -1,

		A: ['add' , 'sub' , 'mul' , 'div', 'jump' , 'load' , 'doIf' , 'store'],
		B: ['output'],
		validate: function( rawCommands ){
			rawCommands.forEach( x=>{
				//if this is the first command in the line and checking if it is variable assignment
				if (this.dollar_state == -1 && this.instruction_state_A == -1 && this.instruction_state_B == -1){
					if (x[0] == '$'){	
						this.dollar_validator(x);
					}
					else
						this.instruction_validator(x)	
				}
				//when state of the command is  variable assignment
				else if ( this.dollar_state > -1)
					this.dollar_validator(x);

				//when the state of the command is instruction 
				else{
					this.instruction_validator(x)
				}
			})

			//incomplete state of machine such as ['add'] or ['$a' , 'dec']
			if (this.dollar_state == 0 || this.dollar_state == 100 || this.instruction_state_A == 0)
				this.abort();
			this.resetFlags();
		},


		/**
			Validation codes are tricky. Can't explaing it with words. Need to look at it oneself.
			dollar_state can be either 0, 10, 2 || 0 , 100 || 0 , 100 , 2.
			Note that final state of dollar_state cannot be 10. In that case we throw error
		**/
		dollar_validator: function( x ){
			//test the validity of the label
			// assigning labels take either 2 or 3 commands i.e. $a add $b || $a output

			if ( this.dollar_state == 2)
				this.abort()
			else if ( this.dollar_state == -1){//checks validity of variable name
				if ( x.length > 1)//guard against'$' or '$ 123'
					this.dollar_state = 0;
				else
					this.abort()
			}
			else if ( this.dollar_state == 0){//checks validity of assigned integer
				if (this.A.indexOf(x) != -1 ||  this.B.indexOf(x) != -1){//labeled instruction ex-$a add $b
					this.instruction_validator( x )
					this.dollar_state = 10;
				}
				else if (x == 'dec')
					this.dollar_state = 100//data assignment state
				else
					this.abort();
			}
			else if ( this.dollar_state == 10){//labeled instruction round 2
				this.instruction_validator( x )
				this.dollar_state = 2;
			}

			else if (this.dollar_state == 100){
				if ( !reg_digit.test( x ) )//expected integers
					this.abort();
				else
					this.dollar_state = 2;
			}
		},

		instruction_validator: function( x ){
			if ( this.instruction_state_B == 0 || this.instruction_state_A == 1 )
				this.abort()

			//first command in the line expected to be either in this.A list or this.B list
			else if (this.instruction_state_A == -1 && this.instruction_state_B == -1  ){
				if ( this.A.indexOf(x) != -1 )
					this.instruction_state_A = 0;
				else if ( this.B.indexOf(x) != -1)
					this.instruction_state_B = 0;
				else
					this.abort();//illegal expression
			}
			//checks for the correct variable name
			else if (this.instruction_state_A == 0){
				if (x[0] == '$'){
					if (x.length == 1)//guard against label of length 1 i.e. '$'
						this.abort();
				}
				else
					this.abort();//expected label
				this.instruction_state_A = 1;
			}
		},

		//at the end of program finite state machines are reset
		resetFlags: function(){
			this.dollar_state = -1;
			this.instruction_state_A = -1;
			this.instruction_state_B = -1;
		},
		//when illegal arguments are caught during validations, do abort
		abort: function(){
			this.resetFlags();
			throw "error";
		}

	}
	compile();
}

