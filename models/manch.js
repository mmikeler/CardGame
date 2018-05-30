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
        // '0green': { title:0, color:'green', endTurn: true},
        // '1green': { title:1, color:'green', endTurn: true},
        // '2green': { title:2, color:'green', endTurn: true},
        // '3green': { title:3, color:'green', endTurn: true},
        // '4green': { title:4, color:'green', endTurn: true},
        // '5green': { title:5, color:'green', endTurn: true},
        // '6green': { title:6, color:'green', endTurn: true},
        // '7green': { title:7, color:'green', endTurn: true},
        // '0yellow': { title:0, color:'yellow', endTurn: true},
        // '1yellow': { title:1, color:'yellow', endTurn: true},
        // '2yellow': { title:2, color:'yellow', endTurn: true},
        // '3yellow': { title:3, color:'yellow', endTurn: true},
        // '4yellow': { title:4, color:'yellow', endTurn: true},
        // '5yellow': { title:5, color:'yellow', endTurn: true},
        // '6yellow': { title:6, color:'yellow', endTurn: true},
        // '7yellow': { title:7, color:'yellow', endTurn: true},
        '+3blue': { title: '+3', color:'blue', action: '+3', caption: 'Противник берёт 3 карты'},
        '+3pink': { title: '+3', color:'pink', action: '+3', caption: 'Противник берёт 3 карты'},
        '+3green': { title: '+3', color:'green', action: '+3', caption: 'Противник берёт 3 карты'},
        '+3yellow': { title: '+3', color:'yellow', action: '+3', caption: 'Противник берёт 3 карты'}
    }

GAME = {
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
        var els = game.deck.splice(0, quant)
        for(var i=0; i < els.length; i++){
            game.players_data[playerID].push(els[i])
        }
    },
    startGame: function(n) { // обрабатываем все id игроков

        var Data = function(n){ // объект данных для передачи
            this.gameID = k,
            this.deck = Object.keys(importDeck), // загружаем id карт
            this.kon = [], // массив карт на кону
            this.players_data = {}, // объект данных игроков
            this.query = n[0], // очерёдность хода, берём первого игрока (хост)
            this.rulls = 'base',
            this.miniGameIndex = 0
        }
        var data = new Data(n);

        this.deckShuffle(data.deck); // перемешиваем карты

        for(var i = 0; i < n.length; i++){ // раздаём карты игрокам согласно лимиту
            var els = data['deck'].splice(1, this.hendLimit);
            var k = n[i];
            data.players_data[k] = els;
        }

        // карта на кон( не содержащая action )
        var el = data['deck'].findIndex(function(element, index){ if('action' in importDeck[element]){ return false } else { return true }})
        data['kon'].push(data['deck'].splice(el,1));

        return data;

    },
    newDeck: function(game){
       var els = game['kon'].splice(0, game['kon'].length - 1);
       for (var i = 0; i < els.length; i++) {
           game['deck'].push(els[i]);
       }
       this.deckShuffle(game.deck)
       return game;
    },
    removeCardsToDisconnect: function(game, playerID){
        game['deck'].push(game.players_data[playerID]);
        this.deckShuffle(game.deck)

        return game;
    },
    endGame: function() {}
}


module.exports = GAME;