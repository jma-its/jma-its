/* Close the navigation dropdown on outside click or Escape. */
document.addEventListener('click', function(event) {
  document.querySelectorAll('details.portal-menu[open]').forEach(function(menu) {
    if (!menu.contains(event.target)) menu.open = false;
  });
});
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    document.querySelectorAll('details.portal-menu[open]').forEach(function(menu) { menu.open = false; });
  }
});
