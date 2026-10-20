// Native details keeps product navigation usable without JavaScript.
document.querySelectorAll('.products-menu').forEach((menu) => {
  const trigger = menu.querySelector('summary');
  const mouseHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  let closeTimer;
  let openedByHover = false;

  const close = () => {
    clearTimeout(closeTimer);
    menu.open = false;
    openedByHover = false;
  };

  menu.addEventListener('pointerenter', (event) => {
    clearTimeout(closeTimer);
    if (event.pointerType !== 'mouse' || !mouseHover.matches) return;
    openedByHover = !menu.open;
    menu.open = true;
  });

  menu.addEventListener('pointerleave', () => {
    closeTimer = setTimeout(() => {
      if (!menu.contains(document.activeElement)) close();
    }, 160);
  });

  trigger.addEventListener('click', (event) => {
    // A first mouse click after hovering should keep the visible panel open.
    if (openedByHover && event.detail > 0) {
      event.preventDefault();
      openedByHover = false;
    }
  });

  trigger.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    menu.open = true;
    menu.querySelector('a').focus();
  });

  menu.addEventListener('focusout', (event) => {
    if (event.relatedTarget && !menu.contains(event.relatedTarget)) close();
  });

  document.addEventListener('pointerdown', (event) => {
    if (!menu.contains(event.target)) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !menu.open) return;
    event.preventDefault();
    close();
    trigger.focus();
  });

  menu.addEventListener('toggle', () => {
    if (!menu.open) {
      clearTimeout(closeTimer);
      openedByHover = false;
    }
  });
  window.addEventListener('pagehide', close);
});
