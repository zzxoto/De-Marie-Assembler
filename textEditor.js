//text editor 
//create two text areas named following --
var ta_code = document.getElementById('textArea-code');
var ta_index = document.getElementById('textArea-index')

 //character per line .. -3 to offset space taken to print LINE_NO
const CPL =  22; 
var regx = /\n/;

ta_code.addEventListener('keydown', function(event){
	var _in = ta_code.value.split( regx );  
	var indices = IndexFactory( _in, CPL );
 	ta_index.value = indices;
})

function IndexFactory( _in , CPL){
	
  function chunks( word , threshold){
    if (word.length < threshold){
        return 1
     }
    return 1 + chunks( word.slice(threshold), threshold)
  }

	function indexify( num ){
  	var s = String(num);
    if ( s.length == 1){
    	return '  ' + s + '\n';
    }
    if (s.length == 2){
    	return ' ' + s + '\n';
    }
    	return '' + s + '\n';
  }

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







