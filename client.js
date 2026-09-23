var BASE_URL = 'https://miljavi96.github.io/trello-table-view';

window.TrelloPowerUp.initialize({
  'board-buttons': function () {
    return [
      {
        icon: {
          dark: BASE_URL + '/icon-white.svg',
          light: BASE_URL + '/icon-black.svg'
        },
        text: 'Cardsheet',
        condition: 'always',
        callback: function (t) {
          return t.modal({
            url: './table.html',
            // Not "Cards grouped by list": grouping is a toggle, so that title
            // was wrong every time a member turned it off.
            title: 'Cardsheet',
            fullscreen: true
          });
        }
      }
    ];
  }
});
