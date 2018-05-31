var socket = io();
var importDeck = {
        '0blue': { title:0, color:'blue', endTurn: true},
        '1blue': { title:1, color:'blue', endTurn: true},
        '2blue': { title:2, color:'blue', endTurn: true},
        '3blue': { title:3, color:'blue', endTurn: true},
        '4blue': { title:4, color:'blue', endTurn: true},
        '5blue': { title:5, color:'blue', endTurn: true},
        '6blue': { title:6, color:'blue', endTurn: true},
        '7blue': { title:7, color:'blue', endTurn: true},
        '0pink': { title:0, color:'pink', endTurn: true},
        '1pink': { title:1, color:'pink', endTurn: true},
        '2pink': { title:2, color:'pink', endTurn: true},
        '3pink': { title:3, color:'pink', endTurn: true},
        '4pink': { title:4, color:'pink', endTurn: true},
        '5pink': { title:5, color:'pink', endTurn: true},
        '6pink': { title:6, color:'pink', endTurn: true},
        '7pink': { title:7, color:'pink', endTurn: true},
        '0green': { title:0, color:'green', endTurn: true},
        '1green': { title:1, color:'green', endTurn: true},
        '2green': { title:2, color:'green', endTurn: true},
        '3green': { title:3, color:'green', endTurn: true},
        '4green': { title:4, color:'green', endTurn: true},
        '5green': { title:5, color:'green', endTurn: true},
        '6green': { title:6, color:'green', endTurn: true},
        '7green': { title:7, color:'green', endTurn: true},
        '0yellow': { title:0, color:'yellow', endTurn: true},
        '1yellow': { title:1, color:'yellow', endTurn: true},
        '2yellow': { title:2, color:'yellow', endTurn: true},
        '3yellow': { title:3, color:'yellow', endTurn: true},
        '4yellow': { title:4, color:'yellow', endTurn: true},
        '5yellow': { title:5, color:'yellow', endTurn: true},
        '6yellow': { title:6, color:'yellow', endTurn: true},
        '7yellow': { title:7, color:'yellow', endTurn: true},
        '+3blue': { title: '+3', color:'blue', action: '+3', caption: 'Противник берёт 3 карты'},
        '+3pink': { title: '+3', color:'pink', action: '+3', caption: 'Противник берёт 3 карты'},
        '+3green': { title: '+3', color:'green', action: '+3', caption: 'Противник берёт 3 карты'},
        '+3yellow': { title: '+3', color:'yellow', action: '+3', caption: 'Противник берёт 3 карты'}
    }
var state;

// общие данные для лобби
socket.on('state', function(data){
	var h = $('#main-table').height(); $('#main-table').css('top', 'calc(50% - ' + (h + 100)*.5 + 'px)')
	$('#version').text(data.gameVersion);
	$('#server-status').text('Сервер: online | Вы: ' + data.players[socket.id].status);
	$('#pl-online').text('Всего игроков: ' + Object.keys(data.players).length);
	$('#free').text('Игроки в поиске: ' + Object.keys(data.free).length);
	var open = 0;
	for(room in data.game_rooms){ if(data.game_rooms[room].status == 'open'){ open++; } }
	$('#rooms').text('Комнаты: ' + open);
	state = data;
	//console.log(data.game_rooms[data.players[socket.id].room])
	//console.log(data.players[socket.id])

// создаём таблицу нашей группы ===============================
		$('#your-room-table').html('');
		$('#room-title').text('Ваша комната')
		if(data.players[socket.id].room !== null){
			$('#your-room-table').removeClass('bounceOutLeft').addClass('bounceInLeft');
			var l = data.players[socket.id].room;
			var s = data.game_rooms[l];
			
			if( s['team'].length > 1 && data.players[socket.id].status == 'server'){ $('#start-game').show() }
			else { $('#start-game').hide();}

			for( var i = 0; i < s['team'].length; i++ ) {
				var k = s.team[i];
				if( data.players[k] !== undefined ){
			 		$('#your-room-table').append('<li><img src="img/avatar/'+ data.players[k].avatar +'.gif"><p>'+ data.players[k].name +'<br><span class="pl-status">'+ data.players[k].status +'</p></li>');
				}
			}
		}
		else { $('#your-room-table').removeClass('bounceInLeft').addClass('bounceOutLeft') }

		if(data.players[socket.id].status == 'server') { $('#join-game').slideUp() } else { $('#join-game').slideDown() }
		if(data.players[socket.id].status == 'in-room') { $('#create-game').slideUp() } else { $('#create-game').slideDown() }
})

// опциональные запросы =========================
//socket.on('importDeck', function(data){ importDeck = data }); // загружаем карты и их данные 
socket.on('no-rooms', function(){ alert('нет комнат') }); // нет свободных комнат
socket.on('rooms-full', function(data){ alert(data) }); // нельзя присоединится к комнате. заполнена.

// игровые сообщения ============================
function inGameTip(text) {
	$('#mainTip .tipContent').html('<span>!</span>' + text);
	$('#mainTip').removeClass('bounceOutLeft').show(0).addClass('bounceInLeft');
	setTimeout(function(){$('#mainTip').removeClass('bounceInLeft').addClass('bounceOutLeft').delay(1000).hide(0)}, 3000);
}
function popTip(data) {
	$('#popTip span').text(data.message);
	if(data.marker == 'exit'){ $('#popTip .btn').show() } else { $('#popTip .btn').hide() }
	$('#popTip').fadeIn(500);
}

socket.on('popMessage', function(data){ popTip(data) }); // сообщение для игрока в popUp
socket.on('gameMessage', function(data){ inGameTip(data.message) }); // сообщения для игрока в логах
socket.on('player-disconnect', function(id){ inGameTip(state.players[id].name + ' отключился') })

// кнопка создания комнаты =========================
$('#create-game').on('click', function(){ // открытие комнаты игроком для других игроков
	if($(this).attr('create-data') == 'online' && state.players[socket.id].status == 'online') {
		socket.emit('create-game');
		socket.on('room-up', function(){ // анимация кнопки поиска
			$('#create-game').text('отмена').attr('create-data', 'server');
		})
	}
	else {
		socket.emit('delete-game');
		$('#create-game').text('Создать игру').attr('create-data', 'online');
	}
})

// кнопка присоединения к игре
$('#join-game').on('click', function(){ // подключение к комнате
	if($(this).attr('join-data') == 'online') {
		var i_name = prompt('Ваше имя');
		if(i_name !== null && i_name.length > 2 && i_name.length < 11) {
			socket.emit('join-game', i_name);
			socket.on('room-join', function(){ // анимация кнопки поиска
				$('#join-game').text('покинуть комнату').attr('join-data', 'in_room');
			})
		} else { if(i_name !== null){alert('от 3 до 10 символов')} }
	}
	else {
		socket.emit('out-room');
		$('#join-game').text('Найти игру').attr('join-data', 'online');
	}
})

// запускаем игру ===============================
$('#start-game').on('click', function(){ socket.emit('start-game'); });

// переходим на доску и выбираем случайный фон поля
socket.on('goToBord', function(){
	$('#lobby').addClass('behind');
	var bg = Math.floor( Math.random() * 2 );
	$('#bord').css({'background': 'url(img/bord'+ bg +'.jpg)'})
})
// создаём поле и карты
socket.on('game-data', function(game){
	//console.log(game.rulls, game.miniGameIndex, game);
	// если дека пустая
	if(game['deck'].length == 0 && game['kon'].length > 1){ socket.emit('new-deck') };
	// далее
	var kon = game.kon;
	var players = game.players_data;
	var opp_count = Object.keys(game.players_data).length - 1;
	var col_class = 'col-' + opp_count;

	$('#deck').text(Object.keys(game.deck).length);
	if('caption' in importDeck[kon[kon.length - 1]]){ var tooltip = 'data-tooltip="'+ importDeck[kon[kon.length - 1]].caption +'"' } else { tooltip = null }
	$('#kon').html('<div class="card '+ importDeck[kon[kon.length - 1]].color +'"'+ tooltip + '>' + importDeck[kon[kon.length - 1]].title +'</div>');

	var opp = 2; // идентификатор блока для оппонентов
	$('#opponents').html('');
	for(player in players) { // раскидываем карты
		if( player === socket.id ) {
			//console.log(players[player]);
			$('#player_1 .cards-container').html('');
			for(var l=0; l < players[player].length; l++) {
				var card_id = players[player][l]
				if('caption' in importDeck[card_id]){ var tooltip = 'data-tooltip="'+ importDeck[card_id].caption +'"' } else { tooltip = null }
				$('#player_1 .cards-container').append('<div class="card '+ importDeck[card_id].color +'" data-id="'+ card_id +'"'+ tooltip +'>'+ importDeck[card_id].title +'</div>');
			}
			if(player === game.query){ $('#player_1 .turn-mark').addClass('pulse') } else { $('#player_1 .turn-mark').removeClass('pulse') }
		} else {
			//console.log(players[player]);
			$('#opponents').append('<div id="player_' + opp + '" class="animated opp-zone '+ col_class +'"><img src="img/avatar/'+ state.players[player].avatar +'.gif" class="avatar"><p>'+ state.players[player].name +'</p></div>');
			for(var i=0; i < players[player].length; i++){
				$('#opponents #player_'+ opp).append('<div class="opp-card"></div>');
			}
			if(player === game.query){ $('#player_'+ opp).addClass('pulse-border') } else { $('#player_'+ opp).removeClass('pulse-border') }
			opp++;
		}
	}
	cardsAlign();
})

// ход
$('#player_1').on('click','.card', function() {
	var card_id = $(this).attr('data-id');
	//console.log('ход сделан');
	socket.emit('turn', card_id);
})

// взять карту
$('#deck').on('click', function(){
	var data = { quant: 1 }
	socket.emit('get-card', data);
	//console.log('добор сделан');
})

// добровольно передать ход
$('#player_1').on('click', '.turn-mark', function(){
	socket.emit('next-player');
	//console.log('передача хода')
})

// вернуться в лобби
$('#exit').on('click', function(){
	socket.emit('exit');
	$('#lobby').removeClass('behind');
	$('#popTip').fadeOut(500);
})

// выравнивание карт
function cardsAlign() {
	var k = 0;
	var elts = $('#player_1 .cards-container .card');
	var elt = $('#player_1 .cards-container .card').width();
	var w = $('#player_1 .cards-container').width();
	var ind = w / elts.length;
	var cor = $('#player_1 .cards-container .card').width() - ind;
	if(w < elt*elts.length){
	  $('#player_1 .cards-container .card').each(function(){
	    var el = 'left:'+(k)+'px'
	    $(this).attr('style', el);
	    k = Math.floor(k + ind - cor / elts.length);
	  })
	}
	else {
		k = Math.floor(w - (elt*elts.length + 20*(elts.length - 1))) / 2;
		$('#player_1 .cards-container .card').each(function(){
	    var el = 'left:'+(k)+'px'
	    $(this).attr('style', el);
	    k = (k + elt + 20);
	  })
	}
}