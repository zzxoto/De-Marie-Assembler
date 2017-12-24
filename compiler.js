
//need to keep track of lines


function compiler( blob ){
	//@param string that we extracted from the html text area

	//splits document to lines and lines to operations
	var reg_document = /\n/,
		reg_line = /\s+/,
		reg_nonDigit = /\D/;

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
				console.log( `error in the line ${t+1}` );
			else
				throw ex//uncaught exception
			//TODO return the error to ERRORBOX
		}

		//break down and send to CPU
		function callCpu(){
			var compiled_code = [];
			lines.forEach( line=>{
				line = line.trim();
				if ( line.length > 0)
					compiled_code.push( line.split( reg_line ));
			})
			console.log( compiled_code );
		}
	};

	var validator = {
		//validates a single line
		//each line can have either variable assignment or instruction

		dollar_state: -1,// when variable --> 0, when data--> 1
		instruction_state_A: -1,//instruction that resolves in 2 parts		add -> 0   $var -> 1
		instruction_state_B: -1,//instruction that resolves in 1 part ( eg:output )  output -> 0
		A: ['add' , 'sub' , 'mul' , 'div'],
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

			//incomplete state of machine such as ['add'] ['$a' , 'dec']
			if (this.dollar_state == 0 || this.dollar_state == 100 || this.instruction_state_A == 0)
				this.abort();
			this.resetFlags();
		}
		,
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
				if (this.A.indexOf(x) != -1 ||  this.B.indexOf(x) != -1){//$a add $b
					this.instruction_validator( x )
					this.dollar_state = 10;
				}
				else if (x == 'dec')
					this.dollar_state = 100
				else
					this.abort();
			}
			else if ( this.dollar_state == 10){
				this.instruction_validator( x )
				this.dollar_state = 2;
			}

			else if (this.dollar_state == 100){
				if ( reg_nonDigit.test( x ) )//expected pure integer
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
					if (x.length == 1)//guard against'$'
						this.abort();
				}
				else
					this.abort();
				this.instruction_state_A = 1;
			}

		},
		resetFlags: function(){
			this.dollar_state = -1;
			this.instruction_state_A = -1;
			this.instruction_state_B = -1;
		},
		abort: function(){
			this.resetFlags();
			throw "error";
		}

	}
	compile();
}

