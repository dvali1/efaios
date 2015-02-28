// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;
var ready = new Array();
var roles = new Array();
var minplayers = 1;
var socketids = new Array();
var playorder = new Array();

function allready(arr) {
var i;
    for(i in arr)
    {
        if(arr[i] !== 'is Ready')
				return false;
    }

    return true;
}

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    // we store the username in the socket session for this client
    socket.username = username;
    // add the client's username to the global list
    usernames[username] = username;
	socketids[username] = socket.id;
	ready[username]="is Not Ready";
	
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
	numUsers: numUsers,
	usernames: usernames
	
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers,
	usernames: usernames
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      delete usernames[socket.username];
	  delete ready[socket.username];
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers,
		usernames: usernames

      });
    }
  });



 // when the client emits 'ready status', this listens and executes
	socket.on('ready status', function (data) {
		ready[socket.username]=data;
		
    	socket.broadcast.emit('ready stat', {
     	 	username: socket.username,
      		message: data
  					       });
		console.log(ready);
 					     });
						 
	socket.on('start', function () {
		if ((numUsers >= minplayers) && (allready(ready)))
		{
			console.log("Start");
			var o = new Array(numUsers);
			for(var i=0; i<numUsers; i++)	{
				o[i]="Human";
			}	
			for(var i=0; i<numUsers/2; i++)	{
				o[i]="Alien";
			}	
			for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
			
			var j=0;
			for (var i in usernames)
			{
				roles[i] = o[j];
				playorder[j]=i;
				j++;
				io.to(socketids[i]).emit('privmessage', {
					username: i,
					role: roles[i]
				});
				
			}
			
			for(var j, x, i = playorder.length; i; j = Math.floor(Math.random() * i), x = playorder[--i], playorder[i] = playorder[j], playorder[j] = x);
						
			console.log(roles);
			
			io.sockets.emit('start', {
				playorder: playorder,
				numUsers: numUsers
			});
		}
		
	});



});