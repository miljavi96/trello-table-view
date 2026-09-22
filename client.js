var BASE_URL = 'https://miljavi96.github.io/trello-table-view';

window.TrelloPowerUp.initialize({
  'board-buttons': function () {
    return [
      {
        icon: {
          dark: BASE_URL + '/icon-white.svg',
          light: BASE_URL + '/icon-black.svg'
        },
        text: 'Table',
        condition: 'always',
        callback: function (t) {
          return t.modal({
            url: './table.html',
            title: 'Cards grouped by list',
            fullscreen: true
          });
        }
      }
    ];
  }
});
