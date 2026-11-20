// 퍼즐 도우미(PuzzleHelper)로 합쳐져 새 주소의 지뢰찾기 화면으로 넘긴다
const target = 'https://itjeong-dev.github.io/PuzzleHelper/#/minesweeper';
document.getElementById('root')!.innerHTML =
  `<p style="font-family:system-ui,sans-serif;padding:24px;line-height:1.6">지뢰찾기 도우미는 퍼즐 도우미로 옮겼어요.<br><a href="${target}">새 주소로 가기</a></p>`;
window.location.replace(target);
