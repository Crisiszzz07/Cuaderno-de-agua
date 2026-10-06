const printButton = document.querySelector<HTMLButtonElement>('[data-print-slides]');
if (printButton) {
  printButton.hidden = false;
  printButton.addEventListener('click', () => window.print());
}
export {};
