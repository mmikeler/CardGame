var importDeck = {
        '0blue': { str:0, color:'blue', endTurn: true},
        '1blue': { str:1, color:'blue', endTurn: true},
        '2blue': { str:2, color:'blue', endTurn: true},
        '3blue': { str:3, color:'blue', endTurn: true},
        '4blue': { str:4, color:'blue', endTurn: true},
        '5blue': { str:5, color:'blue', endTurn: true},
        '6blue': { str:6, color:'blue', endTurn: true},
        '7blue': { str:7, color:'blue', endTurn: true},
        '0pink': { str:0, color:'pink', endTurn: true},
        '1pink': { str:1, color:'pink', endTurn: true},
        '2pink': { str:2, color:'pink', endTurn: true},
        '3pink': { str:3, color:'pink', endTurn: true},
        '4pink': { str:4, color:'pink', endTurn: true},
        '5pink': { str:5, color:'pink', endTurn: true},
        '6pink': { str:6, color:'pink', endTurn: true},
        '7pink': { str:7, color:'pink', endTurn: true},
        '0green': { str:0, color:'green', endTurn: true},
        '1green': { str:1, color:'green', endTurn: true},
        '2green': { str:2, color:'green', endTurn: true},
        '3green': { str:3, color:'green', endTurn: true},
        '4green': { str:4, color:'green', endTurn: true},
        '5green': { str:5, color:'green', endTurn: true},
        '6green': { str:6, color:'green', endTurn: true},
        '7green': { str:7, color:'green', endTurn: true},
        '0yellow': { str:0, color:'yellow', endTurn: true},
        '1yellow': { str:1, color:'yellow', endTurn: true},
        '2yellow': { str:2, color:'yellow', endTurn: true},
        '3yellow': { str:3, color:'yellow', endTurn: true},
        '4yellow': { str:4, color:'yellow', endTurn: true},
        '5yellow': { str:5, color:'yellow', endTurn: true},
        '6yellow': { str:6, color:'yellow', endTurn: true},
        '7yellow': { str:7, color:'yellow', endTurn: true},
    }

var GAME = {
    hendLimit: 5,
    importDeck: importDeck,
    baseDeck: Object.keys(importDeck),
    deckShuffle: function(cards){
        // функция перемешивания
        Array.prototype.shuffle = function( b ){
         var i = this.length, j, t;
         while( i ) {
          j = Math.floor( ( i-- ) * Math.random() );
          t = b && typeof this[i].shuffle!=='undefined' ? this[i].shuffle() : this[i];
          this[i] = this[j];
          this[j] = t;
         }
         return this;
        };

        cards.shuffle() // перемешиваем колоду
    },
    getCard: function(game, playerID, quant){
        var els = game.deck.splice(1, quant)
        for(var i=0; i < els.length; i++){
            game.players_data[playerID].push(els[i])
        }
    },
    startGame: function(n, deck) { // обрабатываем все id игроков

        function Data(n){ // объект данных для передачи
            this.deck = deck, // загружаем id карт
            this.kon = [], // массив карт на кону
            this.players_data = {}, // объект данных игроков
            this.query = n[0] // очерёдность хода, берём первого игрока (хост)
        }
        var data = new Data(n);

        this.deckShuffle(data.deck); // перемешиваем карты

        for(var i = 0; i < n.length; i++){ // раздаём карты игрокам согласно лимиту
            els = data['deck'].splice(1, this.hendLimit);
            var k = n[i];
            data.players_data[k] = els;
        }

        // карта на кон
        el = data['deck'].pop();
        data['deck'].splice(1,1);
        data['kon'].push(el);

        return data;

    },
    endGame: function() {}
}


module.exports = GAME;