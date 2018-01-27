var Client = {};
Client.socket = io.connect();

/* Outbound */
Client.sendInput = function(input) {
  Client.socket.emit('input', input);
};

/* Inbound */
