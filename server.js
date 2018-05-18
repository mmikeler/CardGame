// Зависимости
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);

var gameVersion = 'Версия игры: 1.0.0 alpha'

app.set('port', 80);
app.use('/', express.static(__dirname + '/game'));

// Маршруты
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, '/index.html'));
});

// Запуск сервера
server.listen(80, function() {
    console.log('Запускаю сервер на порте 80');
});

var GAME = require ('./models/manch');
var importDeck = GAME.importDeck

// ==========================================================
var hend_limit = 3; // кол-во карт в руке на старте
var room_limit = 4; // минимальное кол-во игроков в комнате

var players = {} // объект игроков
var free = {} // игроки в поиске
var game_rooms = {} // комнаты
var rooms_count = 0;
var state = {} // данные передаваемые в лобби



// Обработчик веб-сокетов
io.on('connection', function(socket, name) {
	var id = socket.id;
		
		var ava = Math.floor( Math.random() * 4 ); // выбираем случайный аватар
	    players[id] = {
	      name: 'Name',
	      avatar: ava,
	      status: 'online',
	      room: null,
	      freeCards: false
	    }

	var player = players[id];

		socket.on('disconnect', function() { // удаление игрока
				if('room' in players[id] && players[id].room !== null){
					io.sockets.to(player.room).emit('player-disconnect', id); // рассылаем сообщение об отключении игрока
					
						var team = game_rooms[player.room].team; // id игроков в комнате
						var game_data = game_rooms[player.room].game;
						var players_data = game_rooms[player.room].game.players_data;

						for(var i=0; i < team.length; i++){
							if(team[i] === id){ team.splice(i,1); }
						}
						if(team.length > 1) { // если игроков осталось больше одного
							for(var i=0; i < team.length; i++){ // удаляем отключенного игрока
								if(team[i] == id){ team.splice(i,1); }
							}
							for(player in players_data){ // удаляем отключенного игрока
								if(players_data[player] == id){ delete players_data[player] }
							}
						}
						else {
							var mess = {
								message: player.name + ' отключился',
								marker: 'exit'
							}
							io.sockets.to(player.room).emit('popMessage', mess);
						}
						io.sockets.to(player.room).emit('game-data', game_data);
					
				}
				delete free[id];
				delete players[id];
				clearRooms();
		})
		// создать комнату ========================================================================
		socket.on('create-game', function(){ // открытие комнаты - игры
			if(player.status == 'online') {
				player.status = 'server';
				game_rooms[id] = {
					host: id,
					status: 'open',
					team: [id],
					room_limit: room_limit,
					game: {}
				};
				//server.listen(5000, function() {console.log(game_rooms[id]);});
				socket.join(id);
				player.room = id;
				socket.emit('room-up');
				socket.emit('importDeck', importDeck);
			}
		})
		
		// отмена созданной комнаты =======================================================
		socket.on('delete-game', function(){ // выход из комнаты / закрыть комнату
			if(player.room !== undefined){
				player.status = 'online';
				socket.leave(player.room);
				var team = game_rooms[player.room].team;
				for(var i=0; i < team.length; i++){
					if(team[i] === id){ team.splice(i,1); }
				}
				clearRooms();
				player.room = null;
			}
		})

		// присоединиться к комнате =================================================================
		socket.on('join-game', function(data) {
			if(Object.keys(game_rooms).length > 0){
				if(player.status == 'online' && data !== null && data.length > 2 && data.length < 11) {
					var key = Object.keys(game_rooms).find(function(e,i){ if(game_rooms[e].status == 'open'){ return true; } });
					socket.join(key);
					game_rooms[key]['team'].push(id);
					player.status = 'in-room';
					player.name = data;
					player.room = key;
					socket.emit('room-join');
					socket.emit('importDeck', importDeck);
					//server.listen(5000, function() {console.log(game_rooms[key]);});
				}
			} else { socket.emit('no-rooms') }
		})
		socket.on('out-room', function(){ // остановка поиска игры
			if(player.room !== undefined){
				player.status = 'online';
				socket.leave(player.room);
				var team = game_rooms[player.room].team;
				for(var i=0; i < team.length; i++){
					if(team[i] === id){ team.splice(i,1); }
				}
				player.room = null;
			}
		})

		// start game ======================================================================
		socket.on('start-game', function(){
			if(game_rooms[id].team !== undefined){
				var n = game_rooms[id].team; // участники
				var deck = Object.keys(importDeck);
				game_rooms[id].game = GAME.startGame(n, deck);
				var game_data = game_rooms[id].game;
				game_rooms[id].status = 'close';
				
				io.sockets.to(id).emit('game-data', game_data);
				// server.listen(5000, function() { console.log(game_data) });
				io.sockets.to(id).emit('goToBord');
			}
		})

		// ход =============================================================================
		socket.on('turn', function(card_id){
			var room_id = players[id].room; // находим id комнаты
			if(room_id && room_id !== null){
				var game_data = game_rooms[room_id].game; // получаем данные игры
				var cardTo = importDeck[card_id]; // смотрим свойства сыгранной карты
				var cardOn = importDeck[game_data.kon[game_data['kon'].length - 1]]; // смотрим свойства карты на кону
				var endTurn = cardTo.endTurn;
				if(game_data.query == id){ // если сейчас ход игрока сыгравшего карту
					if(cardTo.color == cardOn.color || cardTo.str == cardOn.str){ // если совпадает цвет или сила карт
						game_data['kon'].push(card_id); // добавляем карту на кон
						for(var i=0; i < game_data.players_data[id].length; i++){ // убираем карту у игрока
							var k = game_data.players_data[id][i];
							if(card_id === k){ game_data.players_data[id].splice(i,1); }
						}
						// если это последняя карта игрока - заканчиваем игру
						if(game_data.players_data[id].length == 0) {
							var mess = {
								message: 'Победитель ' + player.name,
								marker: 'exit'
							}
							io.sockets.to(room_id).emit('popMessage', mess);
							game_data.query = false;					
						}
						// если не последняя карта, передаём ход следующему по списку игроку
						else {
							var ind = game_rooms[room_id]['team'].findIndex(function(element, index){ if(element == id){ return true; } })
							if(ind == game_rooms[room_id]['team'].length -1 ) {
								game_data.query = game_rooms[room_id]['team'][0];
							}
							else { 
								game_data.query = game_rooms[room_id]['team'][ind + 1]
							}
							// снимаем маркер на добровольный добор
							players[id].freeCards = false;
						}
					}
					else { socket.emit('gameMessage', 'карта не подходит') } // если карта не подходит
				}
				io.sockets.to(room_id).emit('game-data', game_data);
			}
		})

		// добор карт
		socket.on('get-card', function(quant) {
			if(players[id].freeCards == false){
				if('room' in players[id] && players[id].room !== null){
					var room_id = players[id].room; // находим id комнаты
					var game_data = game_rooms[room_id].game; // получаем данные игры
					if(game_data.query == id){ // если сейчас ход игрока сыгравшего карту
						var els = game_data.deck.splice(1, quant) // берём карты
				        for(var i=0; i < els.length; i++){
				            game_data.players_data[id].push(els[i])
				        }
				        // ставим маркер, что добровольный добор был
				        players[id].freeCards = true;
					}
				}
			} else { socket.emit('gameMessage', 'больше нельзя брать из колоды') }
			io.sockets.to(room_id).emit('game-data', game_data);
		})

		// добровольная передача хода
		socket.on('next-player', function(){
			//server.listen(5000, function() {console.log(players);});
			if('room' in players[id] && players[id].room !== null){
				var room_id = players[id].room; // находим id комнаты
					var game_data = game_rooms[room_id].game; // получаем данные игры
					if(game_data.query == id) {
						if(players[id].freeCards == true){
							var ind = game_rooms[room_id]['team'].findIndex(function(element, index){ if(element == id){ return true; } })
							if(ind == game_rooms[room_id]['team'].length - 1 ) {
								game_data.query = game_rooms[room_id]['team'][0];
							}
							else { 
								game_data.query = game_rooms[room_id]['team'][ind + 1]
							}
						}
						// снимаем маркер на добровольный добор
						players[id].freeCards = false;
					}
					else { socket.emit('gameMessage', 'возьмите карту') }
					io.sockets.to(room_id).emit('game-data', game_data);
			}
			else { 
				var mess = { message: 'игра потеряна', marker: 'exit' }
				socket.emit('popMessage', mess)
			}
		})

		// возврат в лобби
		socket.on('exit', function(){
			if(room_id && room_id !== null) {
				var room_id = players[id].room; // находим id комнаты
				var game_data = game_rooms[room_id].game; // получаем данные игры
			}
		})

}); // end socket - connection

// передаём данные в лобби
state = { gameVersion,players,free,game_rooms }

setInterval(function() {
  io.sockets.emit('state', state);
  //server.listen(5000, function() {console.log(game_rooms);});
}, 1000 / 5);

// функция удаления пустых комнат
function clearRooms(){
	for(room in game_rooms){
		if(game_rooms[room]['team'].length < 1){ delete game_rooms[room] }
	}
}
