// Зависимости
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);

var gameVersion = 'Версия игры: 1.0.1 alpha'

var port = process.env.PORT || 5000;
app.set('port', port);
app.use('/', express.static(__dirname + '/game'));

// Маршруты
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, '/index.html'));
});

// Запуск сервера
server.listen(port, function() {
    console.log('Запускаю сервер на порте ' + port);
});

var GAME = require ('./models/manch');
var importDeck = GAME.importDeck;

// ==========================================================
var room_min_limit = 3; // минимальное кол-во игроков в комнате

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
						// если игроков осталось больше одного
						if(team.length > 1) {
							for(var i=0; i < team.length; i++){ // удаляем отключенного игрока
								if(team[i] == id){ team.splice(i,1); }
							}
							for(player in players_data){ // удаляем отключенного игрока
								if(players_data[player] == id){ delete players_data[player] }
							}
							removeCardsToDisconnect(game_data, id);
						}
						// если все проивники отключились, отправляем сообщение с маркером выхода в лобби
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
				game_rooms[id + 'room'] = {
					host: id,
					status: 'open',
					team: [id],
					room_limit: room_min_limit,
					game: {}
				};
				//server.listen(5000, function() {console.log(game_rooms[id + 'room']);});
				socket.join(id + 'room');
				player.room = id + 'room';
				socket.emit('room-up');
			}
		})
		
		// отмена созданной комнаты =======================================================
		socket.on('delete-game', function(){ // выход из комнаты / закрыть комнату
			if(player.room !== undefined && player.room !== null){
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
					//server.listen(5000, function() {console.log(game_rooms[key]);});
				}
			} else { socket.emit('no-rooms') }
		})
		socket.on('out-room', function(){ // остановка поиска игры
			if(player.room !== undefined && player.room !== null){
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
			if('team' in game_rooms[id + 'room'] && game_rooms[id + 'room'].team !== undefined){
				var n = game_rooms[id + 'room'].team; // участники
				game_rooms[id + 'room'].game = GAME.startGame(n, id);
				var game_data = game_rooms[id + 'room'].game;
				game_rooms[id + 'room'].status = 'close';
				
				// обновляем данные у игроков
				updateGameData(id, game_data);
				// переходим на доску
				io.sockets.to(id + 'room').emit('goToBord');
			}
			else { gameMessage(id, 'Ошибка', null); }
		})

		// ход =============================================================================
		socket.on('turn', function(card_id){
			var room_id = players[id].room; // находим id комнаты
			if(room_id && room_id !== null){
				var game_data = game_rooms[room_id].game; // получаем данные игры
				var cardTo = importDeck[card_id]; // смотрим свойства сыгранной карты
				var cardOn = importDeck[game_data.kon[game_data['kon'].length - 1]]; // смотрим свойства карты на кону
				if(game_data.query == id){ // если сейчас ход игрока сыгравшего карту
					// если на кону карта с action и мини-игра активна
					if('action' in cardOn && game_data.rulls != 'base') {
						// отрабатываем конкретный action
						if(cardOn.action == '+3'){
							// если экшен такой же
							if(cardTo.action == cardOn.action){

								// перемещение карты на кон и проверка на конец игры
								cardToKon(game_data, card_id, id);

								// передаём ход
								nextPlayerTurn(game_data, room_id, id);
							}
							else { gameMessage(id, 'Kарта не подходит', null) }
						}
						else { gameMessage(id, 'Kарта не подходит', null) }

						// обновляем данные у игроков
						updateGameData(room_id, game_data);
					}
					// если совпадает цвет или сила карт
					else {
						if(cardTo.color == cardOn.color || cardTo.title == cardOn.title){
							// перемещение карты на кон и проверка на конец игры
							cardToKon(game_data, card_id, id);
							// передаём ход
							nextPlayerTurn(game_data, room_id, id);
						}
						else { gameMessage(id, 'Kарта не подходит', null) }
					}
				}
				// обновляем данные у игроков
				updateGameData(room_id, game_data);
			}
		})

		// добровольный добор карт
		socket.on('get-card', function(data) {
			if(players[id].freeCards == false){
				if('room' in players[id] && players[id].room !== null){
					var room_id = players[id].room; // находим id комнаты
					var game_data = game_rooms[room_id].game; // получаем данные игры
					if(game_data.query == id){ // если сейчас ход игрока сыгравшего карту
						var els = game_data['deck'].splice(0, data.quant) // берём карты
				        for(var i=0; i < els.length; i++){
				            game_data.players_data[id].push(els[i])
				        }
				        // ставим маркер, что добровольный добор был
				        players[id].freeCards = true;
					}
				}
			}
			else { gameMessage(id, 'Больше нельзя брать из колоды', null) }
			// обновляем данные игроков
			updateGameData(room_id, game_data);
		})

		// когда дека пустая, обновляем
		socket.on('new-deck', function(){
			if('room' in players[id] && players[id].room !== null){
				var room_id = players[id].room; // находим id комнаты
				var game_data = game_rooms[room_id].game; // получаем данные игры
				if(game_data['deck'].length == 0){
					game_data = GAME.newDeck(game_data);
					// обновляем данные в игре
					updateGameData(room_id, game_data);
				}
			}
		})

		// добровольная передача хода
		socket.on('next-player', function(){
			if('room' in players[id] && players[id].room !== null){
				var room_id = players[id].room; // находим id комнаты
				var game_data = game_rooms[room_id].game; // получаем данные игры
				if(game_data.query == id) {
					if(game_data.rulls == 'base'){
						if(players[id].freeCards === true){
							var ind = game_rooms[room_id]['team'].findIndex(function(element, index){ if(element == id){ return true; } })
							if(ind == game_rooms[room_id]['team'].length - 1 ) {
								game_data.query = game_rooms[room_id]['team'][0];
							}
							else { 
								game_data.query = game_rooms[room_id]['team'][ind + 1]
							}
						}
						else {
							gameMessage(id, 'Сыграйте или возьмите карту для передачи хода', null)
						}
					}
					else {
						if(game_data.rulls == '+3'){
							// игрок получает карты согласно индексу
							var els = game_data['deck'].splice(0, game_data.miniGameIndex)
					        for(var i=0; i < els.length; i++){
					            game_data.players_data[id].push(els[i])
					        }
					        // передаём ход
					        nextPlayerTurn(game_data, room_id, id);
					        // снимаем статус мини-игры
					        game_data.rulls = 'base';
					        // и обнуляем индекс
					        game_data.miniGameIndex = 0;
						}
					}
					// снимаем маркер на добровольный добор
						players[id].freeCards = false;
				}
				updateGameData(room_id, game_data);
			}
			else { 
				var mess = { message: 'Игра потеряна', marker: 'exit' }
				socket.emit('popMessage', mess)
			}
		})

}); // end socket - connection

// передаём данные в лобби
state = { gameVersion,players,free,game_rooms }
setInterval(function() {
  io.sockets.emit('state', state);
  //server.listen(5000, function() {console.log(game_rooms);});
}, 1000 / 3);

// функция удаления пустых комнат
function clearRooms(){
	for(room in game_rooms){
		if(game_rooms[room]['team'].length < 1){ delete game_rooms[room] }
	}
}

// обновление данных в игре
function updateGameData(room_id, game_data){
	io.sockets.to(room_id).emit('game-data', game_data);
}

// отправка игровых сообщений
function gameMessage(socketid, text, marker){
	var mess = {
		message: text,
		marker: marker
	}
	io.to(socketid).emit('gameMessage', mess);
}

// перемещаем карту от игрока на кон
function cardToKon(game_data, card_id, id){
	// добавляем сыгранную карту на кон
		game_data['kon'].push(card_id);

	// убираем карту у игрока
	for(var i=0; i < game_data.players_data[id].length; i++){
		var k = game_data.players_data[id][i];
		if(card_id === k){ game_data.players_data[id].splice(i,1); }
	}
	// если эта карта у игрока последняя - он победил
	if(game_data.players_data[id].length == 0) {
		var mess = {
			message: 'Победитель ' + players[id].name,
			marker: 'exit'
		}
		io.sockets.to(players[id].room).emit('popMessage', mess);
		game_data.query = false;					
	}
	// если у новой карты есть мини-игра, добавлем её индекс и игру
	if('action' in importDeck[card_id]){
		game_data.rulls = importDeck[card_id].action;
		if(importDeck[card_id].action == '+3'){ game_data.miniGameIndex = game_data.miniGameIndex + 3 }
	}
	else { game_data.rulls = 'base' }
}

// передача хода
function nextPlayerTurn(game_data, room_id, id){
	var ind = game_rooms[room_id]['team'].findIndex(function(element, index){ if(element == id){ return true; } })
	if( ind == game_rooms[room_id]['team'].length - 1 ) {
		game_data.query = game_rooms[room_id]['team'][0];
	}
	else { 
		game_data.query = game_rooms[room_id]['team'][ind + 1]
	}
	// снимаем маркер на добровольный добор
	players[id].freeCards = false;
	
}