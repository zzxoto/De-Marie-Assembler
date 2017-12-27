// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

var findAndPop =  require('./helperFunctions').findAndPop;

app.use(express.static('public'));

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});


//TODO use doubly linked list instead. !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

var users = [];//list of users curious enough to sign their name
var busyOnCall = [];//list of users currently chatting
var someoneIsTryingToCallYou = {};

//adds to the list of users intrested in talking
function addUser(username){

  if (username.length != 10){//must be 10 digit
    return false;
  }
  if (users.indexOf(username) != -1){
    return false;
  }
  users.push(username);
  return true;
}


//when a user tries to call other person, has to get filtered through this method
function callRequest(user, someone, cb){
  /**@param someone is the requested if available to chat**/
  /**@param cb callback funciton (err , value)=> {}*/

    var chatRoom = user + ' -- ' + someone//unique room name that these two guys could chat

    if (user === someone){
      cb('cant call self', null)
      return;
    }

    if (users.indexOf(someone) == -1){
        cb('noSuchUser', null);
        return;
    }

    if (busyOnCall.indexOf(someone) != -1){
      cb('otherPersonBusy', null);
      return;
    }

    delete someoneIsTryingToCallYou[user]; //when you call someone, any one who is trying to call you will be discarded
    someoneIsTryingToCallYou[someone] = chatRoom;//adding property with value @chatRoom

    busyOnCall.push(user);//now your status will be busy
    cb(null, chatRoom);//call request succesfull
}


//checks if someone is trying to call the user ... part of routine query
function routineCheck(username){

    var chatRequest = someoneIsTryingToCallYou[username];
    if (chatRequest === null || chatRequest === undefined){//no request so far
        return null;                                      //checking explicitly for CLEAR CODE
    }
    return chatRequest;
}



function invalidRequest(socket  , reason){
  console.log("invalid request" + reason + " "+ socket.username)
  socket.emit('invalid request' , reason);
}


io.on("connection", function(socket){

  //adds the user to voice chat
  socket.on("add user", function(username){
      if (addUser(username)){
        socket.username = username
        socket.emit("add user");//success notice
    }
      else{
        invalidRequest(socket, "invalid username");
      }
  })


  //Recieve audio snippet
  socket.on("audio snippet" , function(snippet){
      if (!socket.room){
        invalidRequest(socket , 'Ended call can stop emitting snippets');
        return;
      }
      socket.broadcast.to(socket.room).emit("audio snippet", snippet);
  })


  //recieve request to call to particular user
  socket.on("call request", function(someone){
      callRequest(socket.username, someone,  (err, room)=>{
          if (err){ invalidRequest(socket, err) }
          else{
              socket.room = room;//adding room property, needed later for directing message
              socket.join(room);
          }
    });
  })


  //every Three seconds routine check to see if anyone tried calling
  socket.on("routine query", function(){

      var room = routineCheck(socket.username);
      if (room){            //someone is requesting to call.
        socket.room = room;//adding room property, needed later for directing message
        socket.join(room);
		
        setTimeout( ()=> { 
				io.to(socket.room).emit("call connected"); 
				busyOnCall.push(socket.username);
				delete someoneIsTryingToCallYou[socket.username];}, 200);
      }
  })


  socket.on("list of users" , function(){
      socket.emit("list of users" , users);
  })


//ending the call
  socket.on("end call", function(){
	console.log("end request " +  socket.username);
    if (!socket.room){
      invalidRequest(socket, 'You are not in any room');
      return;
    }
    socket.leave(socket.room);
    io.to(socket.room).emit("someone disconnected");//notifiying to end the call as one of the user already left;

    delete socket.room;//removing room property
    findAndPop( socket.username, busyOnCall );//removing user from list of busy person
  })


  //when someone leaves the site entirely
  socket.on('disconnect', (reason) => {
	  console.log(socket.username + " disconnected")
      if (socket.room){
        socket.leave(socket.room);
        io.to(socket.room).emit("someone disconnected");
        findAndPop( socket.username, busyOnCall );
      }
      findAndPop( socket.username, users );
      delete someoneIsTryingToCallYou[socket.username];
  });



})


/*
to server---                from server--

audio snippet               invalid request
call request
routine query
add user
end call
list of users
someone disconnected
disconnect
*/
