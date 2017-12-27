//text editor 

/**
Text editor has no effect of logic. For asthetic purpose.
It's main function is to print line number beside the coding area
**/
(function textEditor(){

var ta_code = document.getElementById('textArea-code'),
	ta_index = document.getElementById('textArea-index'),
	monitor = document.getElementById('stdOut');
	 

//send code to compiler
document.getElementById('compile-button').addEventListener('click', function(){
	stdOut.value = '';
	compiler(ta_code.value);
})


 //character per line. varies per textArea-code size. 20 is the default unless we adjust the colspan of text area
const CPL =  25; 
var regx = /\n/;

//everytime user presses a key, the index for the new line is evaluated
ta_code.addEventListener('keydown', function(event){
  //setTimeout is necessary because when this function gets executed by event handler, the value of textArea would
  //not have been refreshed.
  setTimeout( ()=>{
  	var _in = ta_code.value.split( regx );  
	
  	var indices = IndexFactory( _in, CPL );
   	ta_index.value = indices;
	
	ta_index.scrollTop = ta_code.scrollTop;//html hack to set both textArea height in alignment
  } , 10)
})


/**
*When lines are longer than the width of the text area then although browser breaks them, 
  it doesn't add \n to the end of the line
*This function adds \n to such lines and adds indexes i.e. line number appropriately
@param _in{Arary<String>} words that have been split by browser (May not be optimally split)
@param CPL {Number} Maximum characters that could be adjusted in a text area  
**/
function IndexFactory( _in , CPL){
	
  /**
  @param word {String} the sequence of characters between to successive \n characters
  @param threshold {Number} the maximum characters that could be put in the text box
  @return number of chunks word could be further split as parameterised by threshold. Atleast 1
  **/
  function chunks( word , threshold){
    if (word.length < threshold){
        return 1
     }
    return 1 + chunks( word.slice(threshold), threshold)
  }

  /**
  @param index {Number} index for the given character
  @return returns the index with added padding and \n character will be added at textArea-index
  Indexes ranges from 1 - 999
  */
	function indexify( index ){
  	var s = String(index);
    if ( s.length == 1)
    	return '      ' + s + '\n';//6 spaces for 1 digit nums
 
    if (s.length == 2)
    	return '     ' + s + '\n';//5 spaces for 2 digit nums
  
    if (s.length == 3)
		return '    ' + s + '\n';
	
	return '   ' + s + '\n';
	
  }


  //splits word further into chunks if applicable and calculates the index for each chunk 
  //and appends that in the string indices. 
  var indices = '';
  var totalChunks = 0;
	_in.forEach( x=>{
  	  var c = chunks(x , CPL);
      for (var i = 0; i < c; i++){
      	totalChunks += 1;
        indices += indexify( totalChunks );
      }
  })
  
  return indices;
}
	
})();






