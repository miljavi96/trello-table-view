window.TrelloPowerUp.initialize({
  'board-buttons': function () {
    return [
      {
        icon: {
          dark: './icon-white.svg',
          light: './icon-black.svg'
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
